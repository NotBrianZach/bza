/**
 * Shared plumbing for the offering providers.
 *
 * Every catalogued provider has the same three problems — a rate limit that is
 * shared across all users because the requesting IP is ours, responses that are
 * occasionally served with a lying content-type, and the need to distinguish "the
 * upstream is angry" from "there was no match". This is that, once.
 */

export class OfferingError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * A tiny TTL cache, keyed by the caller.
 *
 * In-process only, so on Cloudflare it is per-isolate and partial. That is fine:
 * it is a rate-limit cushion, not a correctness mechanism, and a miss costs one
 * upstream call. A shared cache would need a table and a migration.
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
      // Cheapest useful eviction: Map preserves insertion order, so the first
      // key is the oldest. No LRU bookkeeping for what is only a cushion.
      if (cache.size >= maxEntries) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
      }
      cache.set(key, { at: Date.now(), value })
    },
  }
}

/**
 * A polite, identified GET that parses JSON from the body text.
 *
 * Two non-obvious reasons for the shape:
 *  - iTunes has been known to answer 200 with a JS content-type and a body that
 *    is still JSON, so `res.json()` cannot be trusted.
 *  - The Art Institute's IIIF image host answers **403 to an unidentified
 *    request**. Sending a User-Agent is not optional politeness there, it is the
 *    difference between images and a broken integration.
 */
const UA = 'AIReadAlong/1.0 (+https://aireadalong.com)'

export async function getJson(url: string, extraHeaders: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA, ...extraHeaders },
  })
  if (res.status === 403 || res.status === 429) {
    throw new OfferingError('Too many searches at once — try that again in a moment.', 429)
  }
  if (!res.ok) throw new OfferingError(`Search failed (HTTP ${res.status})`, res.status)

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new OfferingError('That catalogue returned something unreadable', 502)
  }
}

/** The User-Agent that image hosts need to see. Exported for <img> proxying. */
export const OFFERING_UA = UA

/** A stable, readable id for something that was authored rather than looked up. */
export function composedId(medium: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `composed:${medium}:${slug || 'untitled'}`
}
