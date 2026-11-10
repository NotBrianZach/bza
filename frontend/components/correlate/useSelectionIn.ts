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
 * Below this, a selection is a stray click rather than a question.
 *
 * ── Why this used to be ten, and why that became wrong ───────────────────
 *
 * Ten, matching the reader, on the reasoning that a double-click lands on one
 * word and offering to discuss one word is noise beside the chain. That held
 * only while the conversation was about *reading the exchange* — "what is this
 * doing", "why would this answer the last one" — where a single word genuinely
 * is not the unit.
 *
 * Then the panel started answering questions about the world: what a term IS,
 * how it compares to a thing you already know. For that, one word is the
 * commonest unit there is, and a double-click is the obvious gesture — which
 * the ten-character floor silently refused. "hydrostat" is nine. "chiaroscuro"
 * scrapes through at eleven and "fugue" never had a chance.
 *
 * Three, because that is where stop words stop: "a", "of", "to" and "is" are
 * below it, while "sin", "cos", "log" and "set" are real terms somebody might
 * reasonably want explained. The noise this guards against was never a short
 * selection anyway — it was an ACCIDENTAL one, and a deliberate double-click
 * on a term is not that.
 */
const MIN_CHARS = 3

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
