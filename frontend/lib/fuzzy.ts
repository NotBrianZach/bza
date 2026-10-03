/**
 * Subsequence fuzzy matching, for picking one thing out of a short list.
 *
 * Built for the preset picker, which has a property worth exploiting: the list is
 * tens of items the player named themselves. That rules out the two usual
 * approaches — a substring filter is too strict for abbreviations people actually
 * type ("jz" for "Jazz night"), and edit distance is too loose at this size,
 * happily matching things the player would never have meant.
 *
 * So: a query matches when its characters appear in order, and the score rewards
 * the things that make a match feel intended rather than coincidental —
 * consecutive runs, hits at word starts, a prefix, a short haystack. The result
 * is that typing initials works, typing a fragment works, and typing nonsense
 * returns nothing instead of returning everything ranked badly.
 */

export interface FuzzyMatch<T> {
  item: T
  score: number
  /** Indices in the target string that the query matched, for highlighting. */
  indices: number[]
}

const WORD_BREAK = /[\s\-_/.,:;([{]/

/**
 * Score one candidate, or null when the query is not a subsequence of it.
 *
 * Greedy left-to-right rather than optimal: with queries this short the optimal
 * alignment and the greedy one almost always agree, and the greedy pass is the
 * one that stays legible.
 */
export function fuzzyScore(query: string, target: string): { score: number; indices: number[] } | null {
  const q = query.trim().toLowerCase()
  if (!q) return { score: 0, indices: [] }

  const t = target.toLowerCase()
  if (q.length > t.length) return null

  const indices: number[] = []
  let score = 0
  let ti = 0
  let runLength = 0

  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return null

    // A character that follows the previous one directly is worth far more than
    // one found later: "jaz" inside "Jazz night" should beat "jaz" scattered
    // across "Just a zither".
    if (found === ti && indices.length > 0) {
      runLength += 1
      score += 8 + runLength * 2
    } else {
      runLength = 0
      score += 1
    }

    // Word starts are what people type when they abbreviate.
    const prev = found > 0 ? t[found - 1] : ''
    if (found === 0) score += 12
    else if (WORD_BREAK.test(prev)) score += 8

    indices.push(found)
    ti = found + 1
  }

  // A query that is most of the target is a better match than one that is a
  // sliver of it, so reward density. Capped contribution — otherwise a one-letter
  // query against a one-letter name would outrank everything.
  score += Math.round((q.length / t.length) * 10)

  // Everything matched early is likelier to be the intended target.
  score -= Math.min(indices[0] ?? 0, 10)

  return { score, indices }
}

/**
 * Rank items by how well `query` matches the string `key` returns.
 *
 * An empty query returns everything in its original order and does not sort —
 * callers rely on that, because their own order (most recently used first) is
 * better than an arbitrary one when nobody has typed anything.
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  key: (item: T) => string,
): FuzzyMatch<T>[] {
  if (!query.trim()) return items.map(item => ({ item, score: 0, indices: [] }))

  const out: FuzzyMatch<T>[] = []
  for (const item of items) {
    const hit = fuzzyScore(query, key(item))
    if (hit) out.push({ item, score: hit.score, indices: hit.indices })
  }
  // Stable within equal scores, so the caller's ordering survives a tie.
  return out.sort((a, b) => b.score - a.score)
}
