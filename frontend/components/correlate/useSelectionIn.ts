'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Text the player has selected inside one element, and where to put a button.
 *
 * Scoped to a container rather than listening on the document, which is the
 * difference between this and the reader's version. The board renders a dozen
 * exchanges at once, so a document-level listener would fire for a selection in
 * any of them and the panel would have to guess which one the player meant.
 * Anchoring to a container makes the question unambiguous: the exchange that
 * owns the selection is the one that heard about it.
 *
 * `selectionchange` on `document` rather than `mouseup` on the element, because
 * mouseup misses two real cases — a keyboard selection, and a drag that ends
 * outside the element it started in. The containment test is done against the
 * range rather than the event target for the same reason.
 */
export interface Selected {
  text: string
  /** Viewport coordinates of the selection's end, for positioning. */
  x: number
  y: number
}

/**
 * Below this, a selection is a click rather than a passage.
 *
 * The reader uses ten. This uses the same number for the same reason: a
 * double-click lands on one word, and offering a discussion of one word is
 * noise next to the chain.
 */
const MIN_CHARS = 10

export function useSelectionIn<T extends HTMLElement>(): {
  /**
   * Typed as the mutable form React's `ref` prop wants.
   *
   * `useRef<T | null>(null)` yields `RefObject<T | null>`, which this version of
   * the React types will not accept on an element — the prop wants
   * `RefObject<T>`. `useRef<T>(null!)` is the shape that satisfies both without
   * casting at the call site, which would have to be repeated by every caller.
   */
  ref: React.MutableRefObject<T | null>
  selected: Selected | null
  clear: () => void
} {
  const ref = useRef<T | null>(null)
  const [selected, setSelected] = useState<Selected | null>(null)

  const clear = useCallback(() => {
    setSelected(null)
    // The highlight goes too. Leaving it would make the panel and the page
    // disagree about whether anything is selected, and the next selection would
    // look like it had failed to replace the last.
    try { window.getSelection()?.removeAllRanges() } catch {}
  }, [])

  useEffect(() => {
    const onChange = () => {
      const el = ref.current
      if (!el) return
      const sel = window.getSelection()
      const text = sel?.toString().trim() ?? ''
      if (!sel || sel.rangeCount === 0 || text.length < MIN_CHARS) {
        setSelected(null)
        return
      }
      const range = sel.getRangeAt(0)
      // `commonAncestorContainer` and not `anchorNode`: a selection dragged
      // across two paragraphs has its anchor in the first and its focus in the
      // second, and only the common ancestor is reliably inside the container
      // for both.
      if (!el.contains(range.commonAncestorContainer)) {
        setSelected(null)
        return
      }
      const rects = range.getClientRects()
      const rect = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect()
      if (!rect) { setSelected(null); return }
      setSelected({ text, x: rect.right, y: rect.bottom })
    }

    document.addEventListener('selectionchange', onChange)
    return () => document.removeEventListener('selectionchange', onChange)
  }, [])

  return { ref, selected, clear }
}
