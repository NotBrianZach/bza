import { useState, useRef, useCallback } from 'react'
import { personaSpeak } from '@/lib/persona'

// State + primitives for browser/AI text-to-speech narration.
//
// Extracted from BookReader — the composed narratePage() /
// narrateTranslation() functions stay in BookReader because they need
// too many reader-local deps (currentPage, totalPages, contentCacheRef,
// pageBreaksRef, translatedPagesRef, translationPromptRef, book.id,
// fetch('/api/translate-page'), etc.). This hook owns just the
// primitives: state + stop + speak. The orchestration layer builds on
// top of them.
export function useNarration() {
  const [narrating, setNarrating] = useState(false)
  const [narrateLoading, setNarrateLoading] = useState(false)
  const [narratingTranslation, setNarratingTranslation] = useState(false)
  const narrateAutoAdvance = useRef(false)
  const cancelNarrationRef = useRef<(() => void) | null>(null)
  const stoppingRef = useRef(false) // prevent re-entrant stopNarration

  const stopNarration = useCallback(() => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    const cancel = cancelNarrationRef.current
    cancelNarrationRef.current = null
    if (cancel) cancel()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setNarrating(false)
    setNarrateLoading(false)
    setNarratingTranslation(false)
    narrateAutoAdvance.current = false
    stoppingRef.current = false
  }, [])

  // Speak text using persona voice (AI or browser based on settings).
  // onStart fires when audio actually starts; onEnd when playback completes.
  const speakText = useCallback((text: string, onStart: () => void, onEnd: () => void) => {
    setNarrateLoading(true)
    cancelNarrationRef.current = personaSpeak(
      text,
      () => { setNarrateLoading(false); onStart() },
      () => { setNarrateLoading(false); onEnd() },
    )
  }, [])

  return {
    narrating, setNarrating,
    narrateLoading,
    narratingTranslation, setNarratingTranslation,
    narrateAutoAdvance,
    stopNarration,
    speakText,
  }
}
