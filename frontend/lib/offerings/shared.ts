/**
 * Shared plumbing for the offering providers.
 *
 * Every catalogued provider has the same two problems — a rate limit shared by
 * every user because the requesting IP is ours, and responses occasionally served
 * with a lying content-type — so this is that, once.
 *
 * WHAT THIS DELIBERATELY NO LONGER DOES: send a `User-Agent` on every upstream
 * call. A UA was added here because the Art Institute's *IIIF image host* answers
 * 403 to an unidentified request. That was real, but it was the wrong fix in the
 * wrong place twice over:
 *
 *  - Nothing server-side ever fetches an image. Artwork URLs go into `<img src>`
 *    and are loaded by the browser, which sends its own UA. The IIIF host is never
 *    reached from here, so the header fixed a problem this code path does not have.
 *  - It was applied to *every* provider, including iTunes, and it was shaped like a
 *    crawler ID — `Name/1.0 (+https://…)` is the Googlebot convention. A
 *    self-identified crawler arriving from a datacenter IP is exactly the thing an
 *    edge WAF refuses, and Apple's search API sits behind one.
 *
 * A provider that genuinely needs a header can now ask for one per call.
 */

export class OfferingError extends Error {
  /** HTTP status to return to our own client. */
  status: number
  /** Which catalogue failed. Always named, so an error is never ambiguous
   *  between "music is rate-limited" and "art is rate-limited". */
  provider: string
  /** What the catalogue actually answered, when it answered at all. */
  upstreamStatus: number | null

  constructor(message: string, status: number, provider: string, upstreamStatus: number | null = null) {
    super(message)
    this.status = status
    this.provider = provider
    this.upstreamStatus = upstreamStatus
  }
}

/**
 * A tiny TTL cache, keyed by the caller.
 *
 * In-process only, so on Cloudflare it is per-isolate and partial. Worth being
 * honest about the limit: isolates are created and discarded per colo and per
 * load, so this absorbs a single user's repeated keystrokes and very little else.
 * It is a cushion, not a rate-limit solution — a real one needs KV or a table.
 */
export function makeCache<T>(ttlMs: number, maxEntries = 500) {
  const cache = new Map<string, { at: number; value: T }>()
  return {
    get(key: string): T | null {
      const hit = cache.get(key)
      if (!hit) return null
      if (Date.now() - hit.at > ttlMs) { cache.delete(key); return null }
      return hit.value
    },
    set(key: string, value: T) {
      // Cheapest useful eviction: Map preserves insertion order, so the first key
      // is the oldest. No LRU bookkeeping for what is only a cushion.
      if (cache.size >= maxEntries) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
      }
      cache.set(key, { at: Date.now(), value })
    },
  }
}

/**
 * A GET that parses JSON from the body text, and reports failure precisely.
 *
 * `provider` is a human name used in the error, because the previous version threw
 * one message for every catalogue and every failure mode, which is how a hard 403
 * from Apple ended up telling a player they were searching too fast.
 *
 * 403 and 429 are separated on purpose. They are different problems: one means the
 * upstream refused us and will keep refusing until something changes, the other
 * means wait. Collapsing them sends you looking for a rate limit that isn't there.
 *
 * Body text is parsed rather than `res.json()` because iTunes has been known to
 * answer 200 with a JS content-type and a body that is still JSON.
 */
export async function getJson(
  provider: string,
  url: string,
  headers: Record<string, string> = {},
): Promise<any> {
  let res: Response
  try {
    res = await fetch(url, { headers: { Accept: 'application/json', ...headers } })
  } catch (e: any) {
    // A thrown fetch is a network or DNS failure, not a status. Say so rather
    // than letting it surface as an unhandled 500.
    throw new OfferingError(`Could not reach ${provider}.`, 502, provider, null)
  }

  if (res.status === 429) {
    throw new OfferingError(
      `${provider} is rate-limiting us — try that again in a moment.`,
      429, provider, 429,
    )
  }
  if (res.status === 403) {
    throw new OfferingError(
      `${provider} refused the request. This is not your rate limit — it is the ` +
      `catalogue blocking this server.`,
      502, provider, 403,
    )
  }
  if (!res.ok) {
    throw new OfferingError(`${provider} search failed (HTTP ${res.status}).`, 502, provider, res.status)
  }

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new OfferingError(`${provider} returned something unreadable.`, 502, provider, res.status)
  }
}

/** A stable, readable id for something that was authored rather than looked up. */
export function composedId(medium: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `composed:${medium}:${slug || 'untitled'}`
}
