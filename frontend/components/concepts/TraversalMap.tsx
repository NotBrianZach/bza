'use client'

import { useCallback, useState } from 'react'
import { DoorOpen, KeyRound, Loader2, MapPin } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'

/**
 * The traversal, as a board. `navigation`'s world with the doors being
 * prerequisites.
 *
 * The constraint is navigation's own, verbatim — "You pick the key, never the
 * door" — and the UI has to make that legible rather than just true. So the
 * learner picks from what they have *reached* and the arrival is announced to
 * them; there is no control anywhere on this panel that selects a destination.
 *
 * A refused key is rendered as an outcome and not as an error, because most keys
 * will not fit and that is the game. The refusal always names what is missing,
 * which is the half of it that makes a refusal useful: "that door needs
 * polynomial division, which you have not reached" is a next move, where "locked"
 * is a wall.
 */

interface Named { conceptId: string; conceptName: string }

export interface TraversalView {
  reached: number
  total: number
  frontier: number
  here: string | null
  hereName: string | null
  /** The concepts reached, which are also the keys the learner may offer. */
  route: Named[]
}

/**
 * What /api/learn/traverse returns.
 *
 * `world` is deliberately read only for the refresh signal: the parent reloads
 * /api/learn/session on a change rather than merging a second shape of the same
 * state here, because two code paths maintaining one world is how the frontier in
 * the panel and the frontier on the server drift apart.
 */
interface TraverseResponse {
  outcome?: 'opens' | 'blocked' | 'not-yours' | 'interferes' | 'spent'
  because?: string
  detail?: string
  door?: string
  doorName?: string
  nearestName?: string
  missing?: Named[]
  withName?: string
  error?: string
  openings?: Named[]
}

export default function TraversalMap({
  traversal, openings, onChanged,
}: {
  traversal: TraversalView
  /** Where a learner may start, or the current frontier once they have. */
  openings: Named[]
  onChanged?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<TraverseResponse | null>(null)

  const post = useCallback(async (body: Record<string, string>) => {
    if (busy) return
    setBusy(true)
    try {
      const response = await authedFetch('/api/learn/traverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await response.json()) as TraverseResponse
      setLast(data)
      if (data.outcome === 'opens') onChanged?.()
    } catch (e) {
      setLast({ error: e instanceof Error ? e.message : 'the request failed' })
    } finally {
      setBusy(false)
    }
  }, [busy, onChanged])

  const started = traversal.route.length > 0

  return (
    <div className='space-y-3 rounded-lg border border-gray-800 bg-gray-900 p-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-sm font-semibold text-gray-100'>Traversal</h3>
        <span className='text-xs text-gray-500'>
          {traversal.reached} of {traversal.total} reached · {traversal.frontier} open
        </span>
      </div>

      <p className='text-xs italic text-gray-500'>You pick the key, never the door.</p>

      {!started ? (
        <>
          <p className='text-xs text-gray-400'>
            Pick somewhere to start. After that, the door is not your decision.
          </p>
          <div className='flex flex-wrap gap-2'>
            {openings.map(door => (
              <button
                key={door.conceptId}
                onClick={() => post({ start: door.conceptId })}
                disabled={busy}
                className='inline-flex items-center gap-1.5 rounded bg-sky-900 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-800 disabled:opacity-50'
              >
                {busy ? <Loader2 size={12} className='animate-spin' /> : <DoorOpen size={12} />}
                {door.conceptName}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className='flex items-center gap-1.5 text-xs text-gray-300'>
            <MapPin size={12} className='text-sky-400' />
            Standing in <strong className='text-gray-100'>{traversal.hereName}</strong>
          </p>

          <div>
            <p className='text-[11px] uppercase tracking-wide text-gray-600'>Offer a key you hold</p>
            <div className='mt-1.5 flex flex-wrap gap-1.5'>
              {traversal.route.map(reached => (
                <button
                  key={reached.conceptId}
                  onClick={() => post({ offer: reached.conceptId })}
                  disabled={busy}
                  className='inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200 hover:border-sky-700 hover:text-sky-200 disabled:opacity-50'
                >
                  <KeyRound size={11} /> {reached.conceptName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className='text-[11px] uppercase tracking-wide text-gray-600'>Route so far</p>
            <p className='mt-0.5 text-xs text-gray-400'>
              {traversal.route.map(r => r.conceptName).join(' → ')}
            </p>
          </div>
        </>
      )}

      {last && <Outcome response={last} />}
    </div>
  )
}

function Outcome({ response }: { response: TraverseResponse }) {
  if (response.error) {
    return (
      <div className='rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-200'>
        {response.error}
        {response.openings && response.openings.length > 0 && (
          <span className='mt-1 block text-rose-300/80'>
            Openings: {response.openings.map(o => o.conceptName).join(', ')}
          </span>
        )}
      </div>
    )
  }

  if (response.outcome === 'opens') {
    return (
      <div className='rounded border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs'>
        <p className='font-medium text-emerald-200'>
          <DoorOpen size={12} className='mr-1 inline' /> You arrive at {response.doorName}
        </p>
        <p className='mt-1 text-gray-300'>{response.because}</p>
        {response.detail && <p className='mt-1 italic text-gray-400'>{response.detail}</p>}
      </div>
    )
  }

  // Every other outcome is a refusal, and each one names what is missing. The
  // door does not open early — see the inversion note in lib/concepts/traversal.ts.
  return (
    <div className='rounded border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs'>
      <p className='font-medium text-amber-200'>
        {response.outcome === 'blocked' && `That key is part of what opens ${response.nearestName}, but the door does not open early.`}
        {response.outcome === 'not-yours' && 'That is not a key you are holding.'}
        {response.outcome === 'spent' && 'That key opens nothing new.'}
        {response.outcome === 'interferes' && `${response.doorName} must not be met next to ${response.withName}.`}
      </p>
      <p className='mt-1 text-gray-300'>{response.because}</p>
      {response.missing && response.missing.length > 0 && (
        <p className='mt-1 text-gray-400'>
          Still missing: {response.missing.map(m => m.conceptName).join(', ')}
        </p>
      )}
    </div>
  )
}
