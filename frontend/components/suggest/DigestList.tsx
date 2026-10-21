'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronRight, ExternalLink, Eye, Minus, Plus, ThumbsUp, Clock, Check,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'

/**
 * The digest, with every item able to explain itself.
 *
 * ── The disclosure is the product, not a debug view ───────────────────────
 *
 * The spec's closing line is that the algorithm "should make it possible to see
 * why an item appeared and which part of the feed mix it is serving", and this
 * is where that becomes true or doesn't. So the "why" panel shows the six
 * scores AND the scorer's own sentence for each, verbatim from
 * `digest_items.because` — not a re-description written here, which would be a
 * second opinion that could disagree with the ranking.
 *
 * ── Three things shown that a nicer-looking feed would hide ───────────────
 *
 * **Back-filled items are labelled in the row**, not just in a gaps summary. An
 * item sitting in the "outside-the-map" slot that did not qualify for it is a
 * stand-in, and presenting it as discovery would be the interface telling a
 * lie the pipeline went to some trouble to avoid.
 *
 * **Gaps and notes are rendered**, because a digest of fourteen when twenty
 * were asked for otherwise reads as "that is all there is".
 *
 * **A score of 0 is shown as 0**, with its reason. The temptation is to hide
 * the zeroes as noise, but "local fit 0 — you have not named a region" is the
 * single most actionable line in the panel for a new user.
 *
 * ── Feedback is optimistic but never silent ───────────────────────────────
 *
 * The button marks immediately and the request goes out behind it, because
 * waiting on a round trip to acknowledge a click makes the control feel broken.
 * But the response carries which interest weights moved, and that is surfaced —
 * a learning system that adjusts itself invisibly cannot be argued with, and
 * `/api/suggest/feedback` returns the before and after specifically so this can
 * say "energy storage 0.62 → 0.70".
 */

export interface DigestItem {
  itemId: string
  title: string
  url: string
  summary?: string | null
  source?: string
  feedName?: string
  publishedAt?: string | null
  articleType?: string
  bucket: string
  backfilled?: boolean
  alsoQualifiedFor?: string[]
  parts?: Record<string, number>
  base?: number
  because?: Record<string, string>
  matchedInterests?: string[]
  bridgeFrom?: string | null
  bridgeTo?: string | null
}

export interface DigestGap {
  bucket: string
  wanted: number
  filled: number
  reason: string
  backfilled: number
}

const BUCKET_LABEL: Record<string, string> = {
  core: 'core interest',
  adjacent: 'adjacent discovery',
  outside: 'outside the map',
  context: 'context',
  local: 'local',
}

/**
 * Bucket colours.
 *
 * The two discovery buckets share a hue family on purpose — they are two
 * degrees of the same thing, and giving them unrelated colours would make the
 * mix harder to read at a glance than it already is.
 */
const BUCKET_STYLE: Record<string, string> = {
  core: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  adjacent: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  outside: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200',
  context: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  local: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
}

const PART_LABEL: Record<string, string> = {
  relevance: 'Relevance',
  quality: 'Quality',
  freshness: 'Freshness',
  bridge: 'Bridge',
  novelty: 'Novelty',
  localFit: 'Local fit',
}

/** The five controls from §5, in the order they are most likely to be wanted. */
const CONTROLS: { kind: string; label: string; icon: typeof Plus; title: string }[] = [
  { kind: 'worth_seeing', label: 'Worth seeing', icon: ThumbsUp, title: 'Glad this was in the feed' },
  { kind: 'more_like_this', label: 'More', icon: Plus, title: 'Find more like this' },
  { kind: 'less_like_this', label: 'Less', icon: Minus, title: 'Find less like this' },
  {
    kind: 'interesting_not_useful', label: 'Interesting, not useful', icon: Clock,
    // Spelled out because the distinction is the whole reason the control
    // exists, and a user who reads it as a soft "less like this" will teach the
    // system the opposite of what they mean.
    title: 'A good find at the wrong moment — this will NOT reduce the topic’s weight',
  },
  { kind: 'already_saw', label: 'Already saw', icon: Eye, title: 'A duplicate — this moves no interest weight' },
]

function Score({ name, value, why }: { name: string; value: number; why?: string }) {
  const pct = Math.round((value ?? 0) * 100)
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
          {PART_LABEL[name] ?? name}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gray-500 dark:bg-gray-400"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
          {(value ?? 0).toFixed(2)}
        </span>
      </div>
      {/* The scorer's own sentence. Shown even when the value is 0 — "you have
          not named a region" is the most useful line here for a new user. */}
      {/* ml-20 plus pl-2 to clear the label column. `ml-22` is NOT a Tailwind
          class — the default scale jumps 20 → 24 — and would have silently
          produced no indent at all. */}
      {why && <p className="ml-20 pl-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">{why}</p>}
    </div>
  )
}

export default function DigestList({
  items,
  gaps = [],
  notes = [],
  digestId,
  compact = false,
  limit,
}: {
  items: DigestItem[]
  gaps?: DigestGap[]
  notes?: string[]
  digestId?: string | null
  /** Home-page strip: no feedback controls, shorter rows. */
  compact?: boolean
  limit?: number
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState<Record<string, string>>({})
  const [moved, setMoved] = useState<Record<string, string>>({})

  const shown = typeof limit === 'number' ? items.slice(0, limit) : items

  async function send(itemId: string, kind: string) {
    setSent(s => ({ ...s, [itemId]: kind }))
    try {
      const res = await authedFetch('/api/suggest/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, kind, digestId }),
      })
      const d = await res.json()
      // Surfaced, not swallowed. The route returns before/after precisely so a
      // user can see — and dispute — what their click did.
      if (Array.isArray(d.moved) && d.moved.length > 0) {
        setMoved(m => ({
          ...m,
          [itemId]: d.moved
            .map((w: { name: string; from: number; to: number }) =>
              `${w.name} ${w.from?.toFixed(2)} → ${w.to?.toFixed(2)}`)
            .join(', '),
        }))
      } else if (d.explanation) {
        setMoved(m => ({ ...m, [itemId]: d.explanation }))
      }
      if (d.error) setMoved(m => ({ ...m, [itemId]: `not recorded: ${d.error}` }))
    } catch {
      setMoved(m => ({ ...m, [itemId]: 'not recorded — the request failed' }))
      setSent(s => {
        const next = { ...s }
        delete next[itemId]
        return next
      })
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Nothing in the digest yet.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-2">
        {shown.map(item => {
          const isOpen = !!open[item.itemId]
          const source = item.source ?? item.feedName ?? 'unknown source'
          return (
            <li
              key={item.itemId}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1 text-sm font-medium text-gray-900 hover:underline dark:text-gray-100"
                  >
                    <span className="min-w-0">{item.title}</span>
                    <ExternalLink size={12} className="mt-1 shrink-0 text-gray-400" />
                  </a>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className={`rounded-full px-1.5 py-0.5 font-medium ${BUCKET_STYLE[item.bucket] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                      {BUCKET_LABEL[item.bucket] ?? item.bucket}
                    </span>
                    {/* Labelled in the row, not only in the gaps summary. An
                        item standing in for a slot it did not qualify for must
                        not read as an instance of that slot. */}
                    {item.backfilled && (
                      <span
                        className="rounded-full bg-gray-200 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        title="This slot had no qualifying candidate. This item is standing in for it — it is not an example of this part of the mix."
                      >
                        stand-in
                      </span>
                    )}
                    <span>{source}</span>
                    {item.articleType && item.articleType !== 'unclassified' && (
                      <span>{item.articleType.replace(/_/g, ' ')}</span>
                    )}
                  </div>

                  {/* The one-line reason an unfamiliar item is here. Rendered
                      only when the scorer actually found a bridge — it returns
                      null below 0.15 rather than inventing a connection. */}
                  {item.bridgeFrom && (
                    <p className="mt-1 text-[11px] italic text-gray-500 dark:text-gray-400">
                      Connects to your interest in {item.bridgeFrom}
                      {item.bridgeTo ? ` through ${item.bridgeTo}` : ''}.
                    </p>
                  )}

                  {!compact && item.summary && (
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-600 dark:text-gray-300">
                      {item.summary}
                    </p>
                  )}
                </div>

                {item.parts && (
                  <button
                    onClick={() => setOpen(o => ({ ...o, [item.itemId]: !isOpen }))}
                    className="shrink-0 rounded px-1 py-0.5 text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Why is this here?"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />} why
                    </span>
                  </button>
                )}
              </div>

              {isOpen && item.parts && (
                <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                  {Object.entries(item.parts).map(([name, value]) => (
                    <Score key={name} name={name} value={value} why={item.because?.[name]} />
                  ))}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {typeof item.base === 'number' && (
                      <span>blended score {item.base.toFixed(2)}</span>
                    )}
                    {item.matchedInterests && item.matchedInterests.length > 0 ? (
                      <span>matched: {item.matchedInterests.join(', ')}</span>
                    ) : (
                      <span>matched no interest — it is not here because of one</span>
                    )}
                    {item.alsoQualifiedFor && item.alsoQualifiedFor.length > 0 && (
                      <span>
                        also fitted {item.alsoQualifiedFor.map(b => BUCKET_LABEL[b] ?? b).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!compact && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {CONTROLS.map(c => {
                    const Icon = c.icon
                    const isSent = sent[item.itemId] === c.kind
                    return (
                      <button
                        key={c.kind}
                        onClick={() => send(item.itemId, c.kind)}
                        title={c.title}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                          isSent
                            ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/40 dark:hover:text-gray-200'
                        }`}
                      >
                        {isSent ? <Check size={11} /> : <Icon size={11} />}
                        {c.label}
                      </button>
                    )
                  })}
                  {moved[item.itemId] && (
                    <span className="ml-1 text-[11px] text-gray-400 dark:text-gray-500">
                      {moved[item.itemId]}
                    </span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Gaps and notes, rendered rather than summarised away. A digest of
          fourteen when twenty were asked for otherwise reads as "that is all
          there is", and the real cause is the most useful thing here. */}
      {!compact && gaps.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20">
          <h3 className="mb-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
            Slots that could not be filled
          </h3>
          <ul className="space-y-1">
            {gaps.map(g => (
              <li key={g.bucket} className="text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                <span className="font-medium">{BUCKET_LABEL[g.bucket] ?? g.bucket}</span>
                {' — '}{g.filled} of {g.wanted}
                {g.backfilled > 0 && ` (${g.backfilled} stand-in${g.backfilled === 1 ? '' : 's'})`}
                {': '}{g.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && notes.length > 0 && (
        <ul className="mt-3 space-y-1">
          {notes.map((n, i) => (
            <li key={i} className="text-[11px] text-gray-500 dark:text-gray-400">· {n}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
