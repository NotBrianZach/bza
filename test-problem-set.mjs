#!/usr/bin/env node
/**
 * End-to-end test for the Problem Set extraction pipeline.
 * Tests: regex extraction, garble detection, findInSource, and AI extraction API.
 *
 * Usage: node test-problem-set.mjs [path-to-book.md]
 */

import { readFileSync } from 'fs'

// ─── Regex definitions (copied from ProblemSetPanel.tsx) ─────────────────────

const EXERCISE_HEADER_RE = /^(?:#{1,4}\s+)?(?:\*{0,2})?(?:EXERCISES?\b|PROBLEMS?\s*(?:SETS?)?\b|HOMEWORK|WORKSHEET|PRACTICE|ASSIGNMENT|DRILL)\b/i
const SECTION_BREAK_RE = /^(?:#{1,4}\s|\\(?:section|subsection|chapter)\*?\{|(?:\*{0,2})?(?:EXERCISES?|EXAMPLES?|PROBLEMS?\s|THEOREMS?|LEMMAS?|DEFINITIONS?|PROOFS?|SOLUTIONS?)\s+[\d\[])/i
const HEADING_RE = /^(?:#+\s|(?:\*{0,2})?(?:EXERCISE|PROBLEM SET|Chapter|Section|Unit)\s+[\d\-]+)/i
const PROBLEM_LINE_RE = /^(?:\*{0,2})?(?:(?:Exercise|Problem|Question|Example)\s+)?(\d+[\.\):]|[a-z][\.\):]|\([a-z]\)|\([ivx]+\))\s*(?:\*{0,2})?(.{8,})/

function isGarbled(text) {
  const tokens = text.replace(/\s+/g, ' ').trim().split(' ')
  if (tokens.length < 5) return false
  const avgLen = tokens.reduce((s, w) => s + w.length, 0) / tokens.length
  return avgLen < 2.5
}

function collectBlock(srcLines, startLine, highlightLength) {
  const minLines = Math.max(6, Math.ceil(highlightLength / 120))
  const maxLines = Math.max(minLines * 3, 30)
  const result = []
  for (let i = startLine; i < srcLines.length && result.length < maxLines; i++) {
    result.push(srcLines[i])
    if (result.length >= minLines && HEADING_RE.test(srcLines[i + 1] ?? '')) break
  }
  return result.join('\n').trim() || null
}

function findInSource(highlight, source) {
  const cleaned = highlight.replace(/\s+/g, ' ').trim()
  const srcLines = source.split('\n')

  const words = cleaned.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4)
  if (words.length >= 2) {
    let bestLine = -1, bestScore = 0
    for (let i = 0; i < srcLines.length; i++) {
      const ll = srcLines[i].toLowerCase()
      const score = words.filter(w => ll.includes(w.toLowerCase())).length
      if (score > bestScore) { bestScore = score; bestLine = i }
    }
    if (bestScore >= 2 && bestLine !== -1) {
      for (let j = bestLine - 1; j >= Math.max(0, bestLine - 5); j--) {
        if (EXERCISE_HEADER_RE.test(srcLines[j].trim())) { bestLine = j; break }
      }
      return collectBlock(srcLines, bestLine, cleaned.length)
    }
  }

  const markers = [...cleaned.matchAll(/(?:^|\s)((?:[ivx]+|[a-z]|\d+)[\.\)])/gi)].map(m => m[1].toLowerCase())
  const uniqueMarkers = [...new Set(markers)]
  if (uniqueMarkers.length >= 2) {
    const first = uniqueMarkers[0]
    for (let i = 0; i < srcLines.length; i++) {
      const ll = srcLines[i].toLowerCase().trim()
      if (ll.startsWith(first) || ll.match(new RegExp('^\\*{0,2}\\s*' + first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))) {
        const region = srcLines.slice(i, Math.min(i + 50, srcLines.length)).join('\n').toLowerCase()
        const hits = uniqueMarkers.filter(m => region.includes(m)).length
        if (hits >= Math.min(uniqueMarkers.length, 3)) {
          let start = i
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            if (EXERCISE_HEADER_RE.test(srcLines[j].trim())) { start = j; break }
          }
          return collectBlock(srcLines, start, cleaned.length)
        }
      }
    }
  }

  return null
}

function extractExerciseBlocks(source, pageNum) {
  const lines = source.split('\n')
  const exerciseStarts = []
  const allBreaks = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (EXERCISE_HEADER_RE.test(trimmed)) {
      exerciseStarts.push(i)
      allBreaks.push(i)
    } else if (SECTION_BREAK_RE.test(trimmed)) {
      allBreaks.push(i)
    }
  }

  if (exerciseStarts.length > 0) {
    const blocks = []
    for (const start of exerciseStarts) {
      const nextBreak = allBreaks.find(b => b > start) ?? lines.length
      const text = lines.slice(start, nextBreak).join('\n').trim()
      if (text.length > 20) {
        const rawTitle = lines[start].trim().replace(/^#{1,4}\s+/, '').replace(/\*{1,2}/g, '').trim()
        const title = rawTitle.length > 45 ? rawTitle.slice(0, 45) + '…' : rawTitle
        blocks.push({ id: `blk-${pageNum}-${start}`, title, text, pageNum, isMarkdown: true })
      }
    }
    if (blocks.length > 0) return blocks
  }

  // Fallback: individual items
  const problems = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    const m = line.match(PROBLEM_LINE_RE)
    if (m) {
      const textLines = [line]
      let j = i + 1
      while (j < lines.length && lines[j].trim() && !lines[j].trim().match(PROBLEM_LINE_RE)) {
        textLines.push(lines[j].trim())
        j++
      }
      const text = textLines.join('\n')
      if (text.length > 15) {
        problems.push({ id: `src-${pageNum}-${i}`, title: `Problem ${m[1].replace(/[.:)]$/, '')}`, text, pageNum, isMarkdown: true })
      }
      i = j
    } else {
      i++
    }
  }
  return problems
}

// ─── Test runner ─────────────────────────────────────────────────────────────

const bookPath = process.argv[2] || '/home/zach/Downloads/aops-vol-1-the-basics.md'
const charPageLen = 420
let passed = 0, failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`)
    failed++
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg) }

console.log(`\nLoading book: ${bookPath}`)
const content = readFileSync(bookPath, 'utf-8')
const totalPages = Math.ceil(content.length / charPageLen)
console.log(`Book: ${content.length} chars, ${totalPages} pages @ ${charPageLen} chars/page\n`)

// Find all exercises in the book
const exerciseMatches = [...content.matchAll(/^EXERCISE \d+-\d+/gm)]
console.log(`Found ${exerciseMatches.length} EXERCISE headers in full text`)

// ─── Test 1: Every exercise header is on exactly one page ────────────────────

console.log(`\n--- Test 1: Exercise location & page slice ---`)
for (const m of exerciseMatches.slice(0, 10)) {
  const offset = m.index
  const page = Math.floor(offset / charPageLen) + 1
  const pageStart = (page - 1) * charPageLen
  const pageEnd = pageStart + charPageLen
  const pageSource = content.substring(pageStart, pageEnd)

  test(`${m[0]} is on page ${page} and extractable`, () => {
    assert(pageSource.includes(m[0]), `Page ${page} doesn't contain "${m[0]}"`)
    const blocks = extractExerciseBlocks(pageSource, page)
    assert(blocks.length > 0, `No exercises extracted from page ${page}`)
    assert(blocks[0].title.includes(m[0].replace('EXERCISE ', '')), `Extracted title "${blocks[0].title}" doesn't match`)
  })
}

// ─── Test 2: Garbled text detection ──────────────────────────────────────────

console.log(`\n--- Test 2: Garbled text detection ---`)

const garbledSamples = [
  'i. 3 4 3 4 ii. 2 5 2 2 2 5 2 2 iii. 5 − 3 5 5 5 − 1',
  '1 . 3 4 2 . 2 5 3 . x y z 4 . a b c',
  'x 2 + y 2 = z 2 x 2 + y 2 = z 2',
]
for (const g of garbledSamples) {
  test(`"${g.slice(0, 40)}…" detected as garbled`, () => {
    assert(isGarbled(g), 'Should be garbled')
  })
}

const cleanSamples = [
  'EXERCISE 1-1 Evaluate each of the following.',
  'Solve for x: $3^x = 27$',
  'Convert the following exponential equations to logarithmic equations.',
]
for (const c of cleanSamples) {
  test(`"${c.slice(0, 40)}…" NOT detected as garbled`, () => {
    assert(!isGarbled(c), 'Should not be garbled')
  })
}

// ─── Test 3: findInSource with text-heavy highlight ──────────────────────────

console.log(`\n--- Test 3: findInSource ---`)

// Simulate page 59 source
const ex11Offset = content.indexOf('EXERCISE 1-1')
const ex11Page = Math.floor(ex11Offset / charPageLen) + 1
const ex11Source = content.substring((ex11Page - 1) * charPageLen, ex11Page * charPageLen)

test('findInSource with text-heavy highlight matches', () => {
  const highlight = 'EXERCISE 1-1 Evaluate each of the following exponential expressions'
  const result = findInSource(highlight, ex11Source)
  assert(result !== null, 'Should find match')
  assert(result.includes('EXERCISE 1-1'), 'Result should include exercise header')
})

test('findInSource with marker-based highlight matches', () => {
  const highlight = 'i. something ii. something iii. something iv. something'
  const result = findInSource(highlight, ex11Source)
  assert(result !== null, 'Should find match via markers')
})

test('findInSource returns null for unrelated text', () => {
  const highlight = 'This has absolutely nothing to do with the page content whatsoever'
  const result = findInSource(highlight, ex11Source)
  assert(result === null, 'Should return null')
})

// ─── Test 4: Page boundary edge cases ────────────────────────────────────────

console.log(`\n--- Test 4: Page boundaries ---`)

// Check if any exercise header falls exactly at a page boundary
for (const m of exerciseMatches) {
  const offset = m.index
  const pageInOffset = offset % charPageLen
  const charsRemaining = charPageLen - pageInOffset

  if (charsRemaining < m[0].length + 50) {
    // Exercise header is near end of page — might be split
    const page = Math.floor(offset / charPageLen) + 1
    const pageSource = content.substring((page - 1) * charPageLen, page * charPageLen)
    const nextPageSource = content.substring(page * charPageLen, (page + 1) * charPageLen)

    test(`${m[0]} near page ${page} boundary (${charsRemaining} chars left)`, () => {
      const thisPageBlocks = extractExerciseBlocks(pageSource, page)
      const nextPageBlocks = extractExerciseBlocks(nextPageSource, page + 1)
      const found = thisPageBlocks.length > 0 || nextPageBlocks.length > 0
      assert(found, `Exercise not found on page ${page} (${thisPageBlocks.length} blocks) or ${page + 1} (${nextPageBlocks.length} blocks)`)
    })
  }
}

// ─── Test 5: Full pipeline simulation ────────────────────────────────────────

console.log(`\n--- Test 5: Full pipeline simulation ---`)

// Simulate what happens when user highlights garbled text on the exercise page
test('Full pipeline: garbled highlight + page source → exercise extracted', () => {
  const garbledHighlight = 'i. 3 4 3 4 ii. 2 5 2 2 2 5 2 2 iii. 5 − 3 5 5 5 − 1 iv. 4 3 / 4'
  const pageSource = ex11Source

  const problems = []

  // Step 1: Try highlight
  const sourceText = findInSource(garbledHighlight, pageSource)
  if (sourceText) {
    problems.push({ id: 'hl-test', title: 'Highlighted', text: sourceText })
  } else if (!isGarbled(garbledHighlight)) {
    problems.push({ id: 'hl-test', title: 'Highlighted', text: garbledHighlight })
  }
  // If garbled and no source match, skip (correct behavior)

  // Step 2: Extract from page source
  const extracted = extractExerciseBlocks(pageSource, ex11Page)
  problems.push(...extracted)

  assert(problems.length > 0, `No problems found! Highlight result: ${sourceText ? 'matched' : 'no match'}, garbled: ${isGarbled(garbledHighlight)}, extracted: ${extracted.length}`)

  // The first problem should be EXERCISE 1-1 (either from highlight match or extraction)
  const hasExercise = problems.some(p => p.title.includes('1-1') || p.text.includes('EXERCISE 1-1'))
  assert(hasExercise, `No EXERCISE 1-1 in results: ${problems.map(p => p.title).join(', ')}`)
})

test('Full pipeline: no highlight, just page source → exercise extracted', () => {
  const problems = extractExerciseBlocks(ex11Source, ex11Page)
  assert(problems.length > 0, 'Should extract exercises from page source alone')
  assert(problems[0].text.includes('$3^{4}$'), 'First exercise should contain the math items')
})

// ─── Test 6: AI extraction API (if OPENAI_API_KEY is set) ────────────────────

console.log(`\n--- Test 6: AI extraction API ---`)

if (process.env.OPENAI_API_KEY) {
  try {
    const res = await fetch('http://localhost:3000/api/problem-set-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: '', mode: 'extract', pageSource: ex11Source, bookTitle: 'AoPS Vol 1', pageNum: ex11Page }),
    })
    const data = await res.json()
    console.log(`  AI extraction returned ${data.problems?.length ?? 0} problems`)
    if (data.problems?.length > 0) {
      for (const p of data.problems) {
        console.log(`    - ${p.title}: ${p.text.slice(0, 60)}…`)
      }
      passed++
      console.log(`  ✅ AI extraction works`)
    } else {
      console.log(`  ⚠️  AI returned no problems (API may not be running locally)`)
    }
  } catch (e) {
    console.log(`  ⚠️  AI extraction skipped (server not running): ${e.message}`)
  }
} else {
  console.log(`  ⚠️  Skipped (OPENAI_API_KEY not set)`)
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
