import { useState, useRef, useEffect, useCallback } from 'react'
import type { SerendipityCard } from '../SerendipityOverlay'

interface SerendipityPrefs {
  enabled: boolean
  sources: string[]
  customUrls: string[]
  frequency: number
}

interface UseSerendipityOpts {
  prefs?: SerendipityPrefs
}

// Randomly-timed enrichment cards shown between page flips.
// Extracted from BookReader — flipCountRef, prefetchedCardRef, and the
// on-flip trigger logic all live here. BookReader calls
// maybeShowOnPageFlip() inside goToPage after committing the new page.
export function useSerendipity({ prefs }: UseSerendipityOpts) {
  const [serendipityCard, setSerendipityCard] = useState<SerendipityCard | null>(null)
  const flipCountRef = useRef(0)
  const prefetchedCardRef = useRef<SerendipityCard | null>(null)
  const serendipityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prefetch = useCallback((sources: string[], customUrls: string[]) => {
    const pool = [...sources, ...customUrls]
    if (!pool.length) return
    const source = pool[Math.floor(Math.random() * pool.length)]
    fetch(`/api/serendipity?source=${encodeURIComponent(source)}`)
      .then(r => r.ok ? r.json() : null)
      .then(card => { if (card && !card.error) prefetchedCardRef.current = card })
      .catch(() => {})
  }, [])

  // Pre-fetch first card on mount / when enabled toggles on.
  useEffect(() => {
    if (prefs?.enabled) {
      prefetch(prefs.sources, prefs.customUrls ?? [])
    }
  }, [prefs?.enabled, prefs?.sources, prefs?.customUrls, prefetch])

  const dismissSerendipity = useCallback(() => {
    setSerendipityCard(null)
    if (serendipityTimerRef.current) clearTimeout(serendipityTimerRef.current)
  }, [])

  const maybeShowOnPageFlip = useCallback((scrollMode: boolean) => {
    if (!prefs?.enabled || scrollMode) return
    const { sources, customUrls = [], frequency } = prefs
    const pool = [...sources, ...customUrls]
    if (pool.length === 0) return

    flipCountRef.current += 1
    if (flipCountRef.current % frequency !== 0) return

    const show = (card: SerendipityCard) => {
      setSerendipityCard(card)
      if (serendipityTimerRef.current) clearTimeout(serendipityTimerRef.current)
      serendipityTimerRef.current = setTimeout(() => setSerendipityCard(null), 10000)
      prefetch(sources, customUrls)
    }

    if (prefetchedCardRef.current) {
      show(prefetchedCardRef.current)
      prefetchedCardRef.current = null
    } else {
      const source = pool[Math.floor(Math.random() * pool.length)]
      fetch(`/api/serendipity?source=${encodeURIComponent(source)}`)
        .then(r => r.ok ? r.json() : null)
        .then(card => { if (card && !card.error) show(card) })
        .catch(() => {})
    }
  }, [prefs, prefetch])

  return {
    serendipityCard,
    dismissSerendipity,
    maybeShowOnPageFlip,
  }
}
