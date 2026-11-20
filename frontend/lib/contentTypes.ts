/**
 * How a book's content type is named and coloured in the filter chips.
 *
 * ── Why this is a module and not two object literals in the page ──────────
 *
 * It was two literals inside an IIFE in app/page.tsx, and the home page grew a
 * small empty circle under the search bar: a chip with a border, no colour and
 * no text. `content_type` has twelve values in `lib/queries/types.ts` and the
 * labels covered ten, so a library holding a `chat_book` or a `manga` rendered
 * `TYPE_LABELS[t]` as undefined — an empty rounded outline that filtered the
 * library to nothing when clicked, and said nothing about why.
 *
 * Out here two things become possible that were not possible in there. The
 * maps can be typed `Record<ContentType, …>`, which makes the next value added
 * to the union a compile error instead of a blank chip; and `labelForType` can
 * be tested, which is the only way the fallback below is worth anything.
 *
 * ── The fallback is not belt-and-braces, it is the actual guarantee ───────
 *
 * `Record<ContentType, …>` makes the maps complete with respect to the TYPE.
 * It cannot make them complete with respect to the DATABASE: `content_type` is
 * a column, rows predate the union, an import can write what it likes, and
 * TypeScript has no vote on any of that. So the lookup never returns undefined
 * — an unrecognised value is title-cased and shown. A chip reading "Scroll" is
 * a thing a reader can click and understand; an empty one is a bug report.
 */

import type { Book } from '@/lib/queries/types'

export type ContentType = NonNullable<Book['content_type']>

/**
 * Exhaustive by type, so adding a content type without naming it fails the
 * build. That is the whole reason for the annotation — the previous version
 * was a bare `Record<string, string>`, which accepted ten of twelve silently.
 */
export const TYPE_LABELS: Record<ContentType, string> = {
  fiction: 'Fiction',
  biography: 'Biography',
  textbook: 'Textbook',
  math_textbook: 'Math',
  academic_paper: 'Academic',
  wikipedia_article: 'Wikipedia',
  news_article: 'News',
  forum_thread: 'Forum',
  essay: 'Essay',
  reference: 'Reference',
  // The two that were missing. A chat imported from the extension and a manga
  // are both ordinary things to have in a library, and both drew a blank.
  chat_book: 'Chat',
  manga: 'Manga',
}

export const TYPE_CHIP: Record<ContentType, string> = {
  fiction: 'border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300',
  biography: 'border-green-200 text-green-700 dark:border-green-700 dark:text-green-300',
  textbook: 'border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300',
  math_textbook: 'border-teal-200 text-teal-700 dark:border-teal-700 dark:text-teal-300',
  academic_paper: 'border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300',
  wikipedia_article: 'border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300',
  news_article: 'border-sky-200 text-sky-700 dark:border-sky-700 dark:text-sky-300',
  forum_thread: 'border-yellow-200 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300',
  essay: 'border-rose-200 text-rose-700 dark:border-rose-700 dark:text-rose-300',
  reference: 'border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  chat_book: 'border-cyan-200 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300',
  manga: 'border-pink-200 text-pink-700 dark:border-pink-700 dark:text-pink-300',
}

/** The neutral chip, for a value no map knows. Visible, not invisible. */
const UNKNOWN_CHIP = 'border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300'

/**
 * A readable name for any stored value, including ones nothing declared.
 *
 * `math_textbook` → "Math textbook". Not a guess at the right name — the
 * curated label above is that — but a guarantee that a chip always has words
 * in it. Empty is the one output that cannot be allowed, because an empty chip
 * is indistinguishable from a rendering fault and filters the library to
 * nothing when pressed.
 */
export function labelForType(type: string | null | undefined): string {
  if (!type) return 'Other'
  const known = TYPE_LABELS[type as ContentType]
  if (known) return known
  const words = type.replace(/[_-]+/g, ' ').trim()
  if (!words) return 'Other'
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Chip classes for any stored value. Never empty, for the same reason. */
export function chipForType(type: string | null | undefined): string {
  return (type && TYPE_CHIP[type as ContentType]) || UNKNOWN_CHIP
}
