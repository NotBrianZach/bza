'use client'

import { BookOpen, ExternalLink, RefreshCw, X as XIcon } from 'lucide-react'
import type { WikiDiff } from './useWikiUpdate'

interface WikiDiffModalProps {
  diff: WikiDiff
  /**
   * The revision the reader's own copy is at, for the "N → M" line. Stored as
   * text on the book row while `latestRevid` comes back from the API as a
   * number, so both shapes are accepted and only ever rendered.
   */
  currentRevid?: string | number | null
  updating: boolean
  onUpdate: () => void
  onClose: () => void
}

/**
 * What changed in the Wikipedia article since this copy was imported.
 *
 * Opened for both answers, not just the interesting one: `hasUpdate` false
 * renders "Your copy is up to date" rather than nothing, because a check button
 * that sometimes does nothing visible reads as a broken button.
 *
 * `diffRows` can be empty on a real update — the API gives a revid comparison
 * without always giving renderable rows — so that case says so and offers the
 * link out instead of showing an empty panel under an "updated" heading.
 */
export function WikiDiffModal({ diff, currentRevid, updating, onUpdate, onClose }: WikiDiffModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {diff.hasUpdate ? 'Wikipedia article updated' : 'No updates found'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <XIcon size={18} />
          </button>
        </div>

        {/* Revid info */}
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
          {diff.hasUpdate
            ? <>Revision {currentRevid} → {diff.latestRevid}</>
            : <>Already at latest revision ({diff.latestRevid})</>
          }
          {diff.diffUrl && (
            <a href={diff.diffUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-blue-500 hover:underline inline-flex items-center gap-1">
              Full diff <ExternalLink size={11} />
            </a>
          )}
        </div>

        {/* Diff rows */}
        {diff.hasUpdate && diff.diffRows && diff.diffRows.length > 0 ? (
          <div className="overflow-y-auto flex-1 font-mono text-xs p-3 space-y-0.5">
            {diff.diffRows.map((row, i) => (
              <div
                key={i}
                className={
                  row.type === 1 ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-0.5 rounded' :
                  row.type === 2 ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-0.5 rounded' :
                  row.type === 3 ? 'font-bold text-gray-700 dark:text-gray-300 px-2 py-1' :
                  'text-gray-500 dark:text-gray-400 px-2 py-0.5'
                }
              >
                {row.type === 1 ? '+ ' : row.type === 2 ? '− ' : ''}{row.content || ' '}
              </div>
            ))}
          </div>
        ) : diff.hasUpdate ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Update detected but diff details unavailable.
            {diff.diffUrl && (
              <a href={diff.diffUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">View on Wikipedia</a>
            )}
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            Your copy is up to date.
          </div>
        )}

        {/* Update to latest button */}
        {diff.hasUpdate && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              onClick={onUpdate}
              disabled={updating}
              className="btn btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
              {updating ? 'Updating…' : 'Update to latest'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
