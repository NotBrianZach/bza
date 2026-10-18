'use client'

import { useCallback, useRef, useState } from 'react'
import { authedFetch } from '@/lib/authedFetch'
import type { Offering } from '@/lib/correlate/types'

/**
 * Turning an offering into a full-length video, without burning the day's lookups.
 *
 * The scarce thing here is not bandwidth or time, it is quota: a video id can only
 * come from YouTube Data API search at 100 units against 10,000 a day, so the whole
 * application shares roughly **one hundred new tracks a day**. Resolutions are
 * cached server-side forever, hits and misses alike, so a track anybody has already
 * looked up is free from then on.
 *
 * That shapes the policy, which is cache-first and just-in-time:
 *
 *  - **The free check happens first, always.** `GET` reads the cache and spends
 *    nothing, so a chain of familiar records costs zero.
 *  - **Quota is spent only for the track about to play**, not for everything sitting
 *    in the radio's lookahead. Resolving the buffer would feel better — the video
 *    would be ready before the preview ended — and it would spend the budget on
 *    records the listener may never reach, because they can switch radio off or play
 *    a move of their own at any point. Roughly twenty lookups per listening hour
 *    rather than per queued item.
 *  - **Running out is not an error.** The route answers `reason: 'quota'` with a
 *    200, and after one of those this stops asking for the rest of the session and
 *    lets everything fall back to the preview. Continuing to ask would mean a
 *    pointless round trip before every track for the rest of the day.
 *  - **A per-session memo on top of the server cache**, because a chain is re-walked
 *    constantly — branching, going back, replaying — and the same track resolving
 *    twice in one sitting is two needless requests even when both are free.
 *
 * Returns a video id or null, and null always means "play the preview". Every
 * failure mode — no key, no match, not embeddable, quota gone, network down, signed
 * out — comes back the same way, because the queue's response to all of them is
 * identical and distinguishing them would only give it something to get wrong.
 */
export interface FullLengthResolver {
  resolve: (offering: Offering) => Promise<string | null>
  /** True once the shared daily budget is spent, so the UI can say why. */
  quotaSpent: boolean
}

export function useFullLengthResolver(): FullLengthResolver {
  /** trackId -> video id, or null for "known to have none". */
  const memo = useRef(new Map<string, string | null>())
  const [quotaSpent, setQuotaSpent] = useState(false)
  const quotaRef = useRef(false)

  const resolve = useCallback(async (offering: Offering): Promise<string | null> => {
    if (offering.medium !== 'music') return null

    const trackId = offering.id
    const seen = memo.current.get(trackId)
    if (seen !== undefined) return seen

    const remember = (v: string | null) => { memo.current.set(trackId, v); return v }

    try {
      // Free: the server cache, which is shared by every user and never expires.
      const hit = await authedFetch(
        `/api/music/youtube?trackId=${encodeURIComponent(trackId)}`,
      ).then(r => (r.ok ? r.json() : null))

      if (hit?.known) {
        return remember(hit.videoId && hit.embeddable ? hit.videoId : null)
      }

      // Not known, and the only way to find out costs 100 units.
      if (quotaRef.current) return remember(null)

      const res = await authedFetch('/api/music/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          artist: offering.attribution ?? '',
          title: offering.title,
        }),
      })
      const body = await res.json().catch(() => null)

      if (body?.reason === 'quota') {
        // Not memoised: the budget resets daily and this track is still unknown.
        // Remembering it as a miss would make it unresolvable long after the quota
        // came back.
        quotaRef.current = true
        setQuotaSpent(true)
        return null
      }
      return remember(body?.videoId && body?.embeddable ? body.videoId : null)
    } catch {
      // A network failure says nothing about the track, so it is not memoised
      // either — but this track plays as a preview now.
      return null
    }
  }, [])

  return { resolve, quotaSpent }
}
