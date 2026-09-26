/**
 * Verifiable links between two tracks.
 *
 * Strict modes need a link that is true or false independent of anyone's
 * reading, so these are computed from Spotify metadata and never taken from the
 * interpreter. Spotify retired the audio-features endpoint for new apps, so
 * "tempo" and "energy" are not available to us — everything here comes off the
 * track object itself: artists, album, release date, title words, duration,
 * popularity.
 */

import type { LinkCheck, TrackRef } from './types'

/** Words too common to count as a title link. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'from', 'by', 'is', 'it', 'my', 'me', 'you', 'your', 'i', 'we',
  'be', 'am', 'are', 'was', 'this', 'that', 'no', 'not', 'up', 'down', 'out',
  'feat', 'remaster', 'remastered', 'version', 'edit', 'mix', 'remix', 'live',
])

function titleWords(name: string): Set<string> {
  const base = name
    // Drop parenthetical/bracketed noise — "(2011 Remaster)", "[Live]".
    .replace(/[([{][^)\]}]*[)\]}]/g, ' ')
    // Drop a trailing " - Remastered 2009" style suffix.
    .replace(/\s+-\s+.*$/, ' ')
    .toLowerCase()
  const words = base.match(/[\p{L}\p{N}']+/gu) ?? []
  return new Set(words.filter(w => w.length > 2 && !STOPWORDS.has(w)))
}

function year(track: TrackRef): number | null {
  const m = track.releaseDate?.match(/^(\d{4})/)
  return m ? Number(m[1]) : null
}

function fmtDuration(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Every link that genuinely holds between `move` and `prev`. An empty array
 * means the two tracks share nothing checkable — which is the signal a strict
 * mode rejects a move on.
 */
export function computeLinks(move: TrackRef, prev: TrackRef | null): LinkCheck[] {
  if (!prev) return []
  const links: LinkCheck[] = []

  const sharedArtists = move.artistIds.filter(id => prev.artistIds.includes(id))
  if (sharedArtists.length > 0) {
    links.push({
      id: 'artist',
      label: 'Same artist',
      detail: move.artist === prev.artist ? move.artist : `${prev.artist} → ${move.artist}`,
    })
  }

  if (move.albumId && prev.albumId && move.albumId === prev.albumId) {
    links.push({ id: 'album', label: 'Same album', detail: move.album })
  }

  const shared = [...titleWords(move.name)].filter(w => titleWords(prev.name).has(w))
  if (shared.length > 0) {
    links.push({
      id: 'title-word',
      label: shared.length === 1 ? 'Shared title word' : 'Shared title words',
      detail: shared.join(', '),
    })
  }

  const my = year(move)
  const py = year(prev)
  if (my !== null && py !== null) {
    if (my === py) {
      links.push({ id: 'year', label: 'Same year', detail: String(my) })
    } else if (Math.floor(my / 10) === Math.floor(py / 10)) {
      links.push({ id: 'decade', label: 'Same decade', detail: `${Math.floor(my / 10) * 10}s — ${py} / ${my}` })
    }
  }

  // Within 15 seconds reads as a deliberate match rather than coincidence.
  const gap = Math.abs(move.durationMs - prev.durationMs)
  if (gap <= 15_000) {
    links.push({
      id: 'duration',
      label: 'Near-identical length',
      detail: `${fmtDuration(prev.durationMs)} / ${fmtDuration(move.durationMs)}`,
    })
  }

  if (Math.abs(move.popularity - prev.popularity) <= 5) {
    links.push({
      id: 'popularity',
      label: 'Equally well known',
      detail: `popularity ${prev.popularity} / ${move.popularity}`,
    })
  }

  return links
}

/** Human-readable summary for the interpreter prompt and the UI. */
export function describeLinks(links: LinkCheck[]): string {
  if (links.length === 0) return 'none'
  return links.map(l => `${l.label} (${l.detail})`).join('; ')
}
