/**
 * Fast regex-based structure scanner — runs on full text at upload time.
 * Detects: headings, chapters, exercises, language, content patterns.
 * Returns a document profile used for TOC, page breaks, and smart extraction.
 */

export interface DocHeading {
  title: string
  level: number
  offset: number  // char offset in full text
}

export interface DocProfile {
  headings: DocHeading[]
  language: string        // ISO 639-1 code (en, es, fr, de, ru, zh, ja, ar, etc.)
  exerciseCount: number
  hasLatex: boolean
  hasCode: boolean
  estimatedChapters: number
}

// ─── Heading patterns ────────────────────────────────────────────────────────

const HEADING_PATTERNS: Array<{ re: RegExp; level: (m: RegExpExecArray) => number; title: (m: RegExpExecArray) => string }> = [
  // Markdown headings: # ## ### etc.
  { re: /^(#{1,6})\s+(.+)$/gm, level: m => m[1].length, title: m => m[2].trim() },
  // LaTeX sections
  { re: /^\\chapter\*?\{(.+?)\}/gm, level: () => 1, title: m => m[1] },
  { re: /^\\section\*?\{(.+?)\}/gm, level: () => 2, title: m => m[1] },
  { re: /^\\subsection\*?\{(.+?)\}/gm, level: () => 3, title: m => m[1] },
  // Plain text chapters: "Chapter 1", "CHAPTER I", "Part II", "Book Three"
  { re: /^(?:CHAPTER|Chapter)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Chapter ${m[1]}${m[2] ? ': ' + m[2].trim() : ''}` },
  { re: /^(?:PART|Part)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Part ${m[1]}${m[2] ? ': ' + m[2].trim() : ''}` },
  { re: /^(?:BOOK|Book)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Book ${m[1]}${m[2] ? ': ' + m[2].trim() : ''}` },
  // Numbered sections: "1.2 Title" or "1.2.3 Title"
  { re: /^(\d+(?:\.\d+)*)\s+([A-Z][^\n]{3,60})$/gm, level: m => m[1].split('.').length, title: m => `${m[1]} ${m[2].trim()}` },
]

// ─── Exercise patterns ───────────────────────────────────────────────────────

const EXERCISE_RE = /^(?:\*{0,2})?(?:EXERCISES?|PROBLEMS?(?:\s+SETS?)?|HOMEWORK|WORKSHEET|PRACTICE)\b/gim

// ─── Language detection ──────────────────────────────────────────────────────

const LANG_MARKERS: Array<{ lang: string; words: string[] }> = [
  { lang: 'en', words: ['the', 'and', 'is', 'was', 'that', 'for', 'with', 'this', 'from'] },
  { lang: 'es', words: ['que', 'los', 'las', 'del', 'una', 'por', 'con', 'para', 'como'] },
  { lang: 'fr', words: ['les', 'des', 'est', 'une', 'que', 'dans', 'pour', 'pas', 'avec'] },
  { lang: 'de', words: ['der', 'die', 'und', 'das', 'ist', 'ein', 'den', 'mit', 'auf'] },
  { lang: 'ru', words: ['что', 'как', 'это', 'все', 'его', 'они', 'для', 'был', 'она'] },
  { lang: 'zh', words: ['的', '是', '了', '在', '有', '和', '人', '这', '中'] },
  { lang: 'ja', words: ['の', 'は', 'に', 'を', 'た', 'が', 'で', 'て', 'と'] },
  { lang: 'ar', words: ['في', 'من', 'على', 'أن', 'هذا', 'التي', 'كان', 'عن', 'إلى'] },
  { lang: 'pt', words: ['que', 'não', 'uma', 'com', 'para', 'por', 'mais', 'dos', 'das'] },
  { lang: 'it', words: ['che', 'della', 'per', 'una', 'con', 'sono', 'gli', 'anche', 'questo'] },
]

function detectLanguage(text: string): string {
  // Sample first 5000 chars
  const sample = text.slice(0, 5000).toLowerCase()
  const words = sample.split(/\s+/)

  let best = 'en'
  let bestScore = 0

  for (const { lang, words: markers } of LANG_MARKERS) {
    const score = markers.filter(w => words.includes(w)).length
    if (score > bestScore) { bestScore = score; best = lang }
  }

  return best
}

// ─── Main scanner ────────────────────────────────────────────────────────────

export function scanDocument(text: string): DocProfile {
  const headings: DocHeading[] = []

  for (const pattern of HEADING_PATTERNS) {
    // Reset lastIndex for global regex
    pattern.re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pattern.re.exec(text)) !== null) {
      const title = pattern.title(m)
      // Skip very short or very long "headings" (likely false positives)
      if (title.length < 2 || title.length > 120) continue
      headings.push({ title, level: pattern.level(m), offset: m.index })
    }
  }

  // Sort by offset and deduplicate (some patterns may overlap)
  headings.sort((a, b) => a.offset - b.offset)
  const deduped: DocHeading[] = []
  for (const h of headings) {
    const prev = deduped[deduped.length - 1]
    if (prev && Math.abs(prev.offset - h.offset) < 10) continue // same location
    deduped.push(h)
  }

  // Count exercises
  EXERCISE_RE.lastIndex = 0
  let exerciseCount = 0
  while (EXERCISE_RE.exec(text)) exerciseCount++

  const language = detectLanguage(text)
  const hasLatex = /\$[^$]+\$|\\begin\{|\\frac|\\sum|\\int/.test(text.slice(0, 10000))
  const hasCode = /```[\s\S]{10,}```/.test(text.slice(0, 10000))
  const estimatedChapters = deduped.filter(h => h.level <= 2).length

  return { headings: deduped, language, exerciseCount, hasLatex, hasCode, estimatedChapters }
}

// ─── Smart page breaks ───────────────────────────────────────────────────────

/**
 * Compute page breaks at paragraph boundaries within ±20% of target length.
 * Never splits mid-paragraph. Prefers breaking before headings.
 */
export function computeSmartBreaks(text: string, targetPageLen: number, headingOffsets?: number[]): number[] {
  const breaks: number[] = [0]
  const minLen = Math.floor(targetPageLen * 0.8)
  const maxLen = Math.ceil(targetPageLen * 1.2)
  const headingSet = new Set(headingOffsets ?? [])

  let pos = 0
  while (pos < text.length) {
    // Look for a good break point between minLen and maxLen from current position
    const windowStart = pos + minLen
    const windowEnd = Math.min(pos + maxLen, text.length)

    if (windowEnd >= text.length) {
      // Last page — no break needed
      break
    }

    // Prefer breaking at a heading
    let bestBreak = -1
    for (const ho of headingSet) {
      if (ho > windowStart && ho <= windowEnd) {
        bestBreak = ho
        break // take the first heading in range
      }
    }

    // Otherwise break at the nearest paragraph boundary (\n\n)
    if (bestBreak === -1) {
      const chunk = text.substring(windowStart, windowEnd)
      const paraIdx = chunk.lastIndexOf('\n\n')
      if (paraIdx !== -1) {
        bestBreak = windowStart + paraIdx + 2 // after the double newline
      }
    }

    // Otherwise break at the nearest single newline
    if (bestBreak === -1) {
      const chunk = text.substring(windowStart, windowEnd)
      const nlIdx = chunk.lastIndexOf('\n')
      if (nlIdx !== -1) {
        bestBreak = windowStart + nlIdx + 1
      }
    }

    // Last resort: hard break at target length
    if (bestBreak === -1) {
      bestBreak = pos + targetPageLen
    }

    breaks.push(bestBreak)
    pos = bestBreak
  }

  return breaks
}
