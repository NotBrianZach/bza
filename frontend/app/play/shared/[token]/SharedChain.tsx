'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowRight, CheckCircle2, Flag, Globe2, Loader2, Repeat, Shuffle,
  SignalZero, Target,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { ACCENT_CLASSES, getGame } from '@/lib/correlate/games'
import { getMedium } from '@/lib/correlate/media'
import { RELATIONS } from '@/lib/correlate/relations'
import { buildGraph, defaultParent, pathTo } from '@/lib/correlate/graph'
import { isSelfReply } from '@/lib/correlate/continuation'
import { playedUnder } from '@/lib/correlate/switching'
import type { CorrelationSession, CorrelationTurn, Offering } from '@/lib/correlate/types'
import OfferingCard from '@/components/correlate/OfferingCard'
import { useOfferingPlayer, audioUrl } from '@/components/correlate/useOfferingPlayer'

/**
 * Somebody else's chain, read-only.
 *
 * Deliberately **not** `CorrelationBoard` in a disabled state, and the reason is
 * not code size. That component is fourteen hundred lines of things a reader of
 * somebody else's game must not have: a composer, a tuning panel, radio, the
 * self-reply controls, the switch control, branch focus. Rendering it inert would
 * mean carrying every one of those and trusting a flag to keep them off, with the
 * failure mode being that a stranger plays a turn into your game.
 *
 * So this shows the one thing a shared chain *is*: the line it took, in order,
 * with the readings. No map and no branches — the owner explored a tree and what
 * they are sending you is a line through it.
 *
 * Previews only. Full-length playback goes through a quota'd resolver tied to an
 * account, and there is no account here; `useOfferingPlayer` with no `resolveFull`
 * degrades to the 30-second previews the catalogues hand out, which is what an
 * unauthenticated listener should get anyway.
 */

interface SharedPayload {
  session: CorrelationSession
  turns: CorrelationTurn[]
}

export default function SharedChain({ token }: { token: string }) {
  const [data, setData] = useState<SharedPayload | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/correlate/shared/${encodeURIComponent(token)}`)
      .then(async r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'notfound' : 'failed')
        return r.json()
      })
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message === 'notfound' ? 'notfound' : 'failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const player = useOfferingPlayer()

  const session = data?.session ?? null
  // Inside the memo rather than a `?? []` above it: a fresh array literal every
  // render would make the dependency change every render, which is the one way a
  // memo over the whole graph can cost more than not having it.
  const graph = useMemo(() => buildGraph(data?.turns ?? []), [data])
  /**
   * The line, not the tree.
   *
   * The path down to wherever the owner ended up — the same `defaultParent` the
   * board uses to decide where you are standing. A shared tree would be asking a
   * reader to explore somebody else's abandoned branches, which is the one part
   * of a game that is not legible from outside.
   */
  const line = useMemo(() => pathTo(graph, defaultParent(graph)?.id ?? null), [graph])

  const game = session ? getGame(session.mode) : null
  const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']

  const audible = useMemo(() => {
    const chain = line
      .filter(t => t.legal)
      .flatMap(t => (isSelfReply(t) ? [t.reply_offering] : [t.move_offering, t.reply_offering]))
      .filter((o): o is Offering => !!o?.id)
    return chain.filter(o => !!audioUrl(o))
  }, [line])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </main>
    )
  }

  if (error || !session || !game) {
    return (
      <main className="min-h-screen max-w-xl mx-auto px-4 py-16">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {error === 'notfound' ? 'There is no chain here' : 'That could not be loaded'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {error === 'notfound'
            ? 'The link may have been turned off, or the game may have been thrown away. ' +
              'Either way nothing was lost on the other end — sharing is a switch, not a copy.'
            : 'Something went wrong fetching it. Reloading is worth a try.'}
        </p>
        <Link href="/play" className="inline-block mt-4 text-sm underline hover:no-underline">
          Play one of your own
        </Link>
      </main>
    )
  }

  const plural = line.filter(t => t.legal).length === 1 ? '' : 's'

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            A shared chain
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{session.title}</h1>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${accent.chip}`}>{game.name}</span>
            {session.status === 'finished' && (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                <Flag size={10} /> Finished
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {line.filter(t => t.legal).length} exchange{plural} · an offering here is{' '}
            {game.offeringIs.toLowerCase()}
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* The closing reading first, when there is one.
          A finished chain's whole point is what it turned out to be, and a reader
          arriving at somebody else's game wants the answer before the working —
          which is the opposite of the owner's order, who lived through it. */}
      {session.closing_reading && (
        <div className={`rounded-2xl border ${accent.ring} ${accent.bg} p-4 mb-6`}>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
            <Globe2 size={12} /> What it turned out to be
          </p>
          {session.closing_reading.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-2 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      )}

      {audible.length > 1 && (
        <button
          onClick={() => player.playQueue(audible, 0)}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Play the {audible.length} audible ones
        </button>
      )}

      <ol className="space-y-6">
        {line.map(turn => (
          <li key={turn.id}>
            <SharedTurn
              turn={turn}
              sessionMode={session.mode}
              activeMode={line.length > 0 ? (line[line.length - 1].mode || session.mode) : session.mode}
              player={player}
              accentText={accent.text}
            />
          </li>
        ))}
      </ol>

      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          This is one line through somebody&rsquo;s game. The connections are theirs; whether you
          see them is the whole question.
        </p>
        <Link
          href="/play"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-gray-900 dark:text-gray-100 underline hover:no-underline"
        >
          Start your own <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  )
}

/** One exchange, read-only. A trimmed cousin of the board's TurnBlock. */
function SharedTurn({ turn, sessionMode, activeMode, player, accentText }: {
  turn: CorrelationTurn
  sessionMode: string
  activeMode: string
  player: ReturnType<typeof useOfferingPlayer>
  accentText: string
}) {
  const alone = isSelfReply(turn)
  const playedAs = playedUnder(turn, sessionMode, activeMode)?.name ?? null

  if (!turn.legal) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 mb-3">
          <SignalZero size={13} /> Turn {turn.turn_index + 1} — turned away
        </p>
        <OfferingCard offering={turn.move_offering} player={player} label="they offered" compact />
        {turn.narration && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{turn.narration}</p>
        )}
      </div>
    )
  }

  const crossed = turn.reply_offering && turn.reply_offering.medium !== turn.move_offering.medium

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Turn {turn.turn_index + 1}</p>
        {playedAs && (
          <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            <Shuffle size={9} /> {playedAs}
          </span>
        )}
        {alone && (
          <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            <Repeat size={9} /> on its own
          </span>
        )}
        {turn.relation && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${accentText}`}>
            {RELATIONS[turn.relation]?.name ?? turn.relation}
          </span>
        )}
        {crossed && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            {getMedium(turn.move_offering.medium)?.plural}
            <ArrowRight size={9} />
            {getMedium(turn.reply_offering!.medium)?.plural}
          </span>
        )}
      </div>

      <OfferingCard
        offering={turn.move_offering}
        player={player}
        label={alone ? 'it offered, to itself' : 'they offered'}
        compact={alone}
      />

      {turn.prediction && (
        <div className="flex items-start gap-2 pl-1">
          {turn.prediction_called === true
            ? <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
            : <Target size={13} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />}
          <p className="text-xs leading-relaxed">
            <span className="text-gray-400 dark:text-gray-500">
              {turn.prediction_called === true ? 'they called it — ' : 'they predicted — '}
            </span>
            <span className="text-gray-600 dark:text-gray-300">{turn.prediction}</span>
          </p>
        </div>
      )}

      {turn.reading && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-1 italic">{turn.reading}</p>
      )}

      {turn.reply_offering && (
        <OfferingCard offering={turn.reply_offering} player={player} label="came back" />
      )}

      {turn.narration && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pl-1">{turn.narration}</p>
      )}

      {(turn.carried || turn.lost) && (
        <dl className="pl-1 space-y-0.5">
          {turn.carried && (
            <div className="flex gap-2 text-[11px]">
              <dt className="text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">carried</dt>
              <dd className="text-gray-600 dark:text-gray-300">{turn.carried}</dd>
            </div>
          )}
          {turn.lost && (
            <div className="flex gap-2 text-[11px]">
              <dt className="text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">lost</dt>
              <dd className="text-gray-600 dark:text-gray-300">{turn.lost}</dd>
            </div>
          )}
        </dl>
      )}

      {player.error && turn.turn_index === 0 && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {player.error}
        </p>
      )}
    </div>
  )
}
