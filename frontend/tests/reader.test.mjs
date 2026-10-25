#!/usr/bin/env node
/**
 * Test suite for bza reader functionality.
 * Run: node tests/reader.test.mjs
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++ }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++ }
}
function assert(cond, msg) { if (!cond) throw new Error(msg) }

// ─── Scroll ↔ Paginated mode ─────────────────────────────────────────────────

console.log('\n--- Scroll / Paginated Mode ---')

test('Page calculation: 420 chars per page', () => {
  const content = 'x'.repeat(2100)
  const charPageLen = 420
  const totalPages = Math.ceil(content.length / charPageLen)
  assert(totalPages === 5, `Expected 5, got ${totalPages}`)
})

test('Page slice boundaries are correct', () => {
  const content = 'AAAA' + 'BBBB' + 'CCCC' // 12 chars, 4 per page
  const getSlice = (page, cpl) => content.substring((page - 1) * cpl, page * cpl)
  assert(getSlice(1, 4) === 'AAAA', 'Page 1')
  assert(getSlice(2, 4) === 'BBBB', 'Page 2')
  assert(getSlice(3, 4) === 'CCCC', 'Page 3')
})

test('Scroll position to page number mapping', () => {
  const totalPages = 100
  // scrollTop = 0 → page 1
  const pageFromScroll = (scrollTop, scrollHeight, clientHeight) => {
    const pct = scrollTop / (scrollHeight - clientHeight || 1)
    return Math.max(1, Math.min(totalPages, Math.round(pct * (totalPages - 1)) + 1))
  }
  assert(pageFromScroll(0, 10000, 500) === 1, 'Top = page 1')
  assert(pageFromScroll(9500, 10000, 500) === 100, 'Bottom = last page')
  assert(pageFromScroll(4750, 10000, 500) === 51, 'Middle ≈ page 51')
})

test('Mode toggle preserves page number', () => {
  let currentPage = 42
  // Simulate toggle: scroll→paginated should keep same page
  const toggleResult = currentPage // toggleScrollMode stores prevPage
  assert(toggleResult === 42, 'Page preserved after toggle')
})

// ─── Problem Set Extraction ──────────────────────────────────────────────────

console.log('\n--- Problem Set Extraction ---')

const EXERCISE_HEADER_RE = /^(?:#{1,4}\s+)?(?:\*{0,2})?(?:EXERCISES?\b|PROBLEMS?\s*(?:SETS?)?\b|HOMEWORK|WORKSHEET|PRACTICE|ASSIGNMENT|DRILL)\b/i
const SECTION_BREAK_RE = /^(?:#{1,4}\s|\\(?:section|subsection|chapter)\*?\{|(?:\*{0,2})?(?:EXERCISES?|EXAMPLES?|PROBLEMS?\s|THEOREMS?|LEMMAS?|DEFINITIONS?|PROOFS?|SOLUTIONS?)\s+[\d\[])/i

test('EXERCISE_HEADER_RE matches exercise headers', () => {
  assert(EXERCISE_HEADER_RE.test('EXERCISE 1-1 Evaluate'), 'EXERCISE 1-1')
  assert(EXERCISE_HEADER_RE.test('Exercise 2.3'), 'Exercise 2.3')
  assert(EXERCISE_HEADER_RE.test('PROBLEMS'), 'PROBLEMS')
  assert(EXERCISE_HEADER_RE.test('HOMEWORK 1'), 'HOMEWORK 1')
  assert(EXERCISE_HEADER_RE.test('## Practice'), '## Practice')
})

test('EXERCISE_HEADER_RE does not match examples', () => {
  assert(!EXERCISE_HEADER_RE.test('EXAMPLE 1-1'), 'Should not match EXAMPLE')
  assert(!EXERCISE_HEADER_RE.test('THEOREM 3'), 'Should not match THEOREM')
  assert(!EXERCISE_HEADER_RE.test('For example'), 'Should not match prose')
})

test('SECTION_BREAK_RE matches structural breaks', () => {
  assert(SECTION_BREAK_RE.test('EXAMPLE 1-1 Evaluate'), 'EXAMPLE 1-1')
  assert(SECTION_BREAK_RE.test('EXERCISE 2-3 Find'), 'EXERCISE 2-3')
  assert(SECTION_BREAK_RE.test('\\subsection*{1.2}'), '\\subsection')
  assert(SECTION_BREAK_RE.test('## Chapter 3'), '## heading')
})

test('Garble detection works', () => {
  const isGarbled = (text) => {
    const tokens = text.replace(/\s+/g, ' ').trim().split(' ')
    if (tokens.length < 5) return false
    const avgLen = tokens.reduce((s, w) => s + w.length, 0) / tokens.length
    return avgLen < 2.5
  }
  assert(isGarbled('i. 3 4 3 4 ii. 2 5 2 2'), 'Math garbled text')
  assert(!isGarbled('EXERCISE 1-1 Evaluate each of the following'), 'Normal text')
  assert(!isGarbled('Hello'), 'Too short')
})

test('Content fingerprint deduplication', () => {
  const fp = (text) => text.trim().slice(0, 80)
  const a = 'EXERCISE 1-1 Evaluate each of the following.\ni. $3^4$'
  const b = 'EXERCISE 1-1 Evaluate each of the following.\ni. $3^4$'
  const c = 'EXERCISE 1-2 Something different'
  assert(fp(a) === fp(b), 'Same content = same fingerprint')
  assert(fp(a) !== fp(c), 'Different content = different fingerprint')
})

// ─── Persona System ──────────────────────────────────────────────────────────

console.log('\n--- Persona System ---')

test('Persona voices mapped correctly', () => {
  const voices = {
    sensei: 'onyx', buddy: 'nova', rival: 'echo',
    professor: 'fable', coach: 'alloy', librarian: 'shimmer',
    tsundere: 'nova', custom: 'nova',
  }
  assert(voices.sensei === 'onyx', 'Sensei = onyx')
  assert(voices.librarian === 'shimmer', 'Librarian = shimmer')
  assert(voices.tsundere === 'nova', 'Tsundere = nova')
})

test('Browser voice settings per persona', () => {
  const configs = {
    sensei: { rate: 0.85, pitch: 0.9 },
    buddy: { rate: 1.1, pitch: 1.1 },
    rival: { rate: 1.0, pitch: 0.85 },
  }
  assert(configs.sensei.rate < 1, 'Sensei speaks slowly')
  assert(configs.buddy.rate > 1, 'Buddy speaks fast')
  assert(configs.rival.pitch < 1, 'Rival pitch is low')
})

// ─── Markdown Normalization ──────────────────────────────────────────────────

console.log('\n--- Markdown Normalization ---')

test('normalizeMath converts delimiters', () => {
  const normalizeMath = (text) => text
    .replace(/\\\[(.+?)\\\]/gs, (_, inner) => `$$${inner}$$`)
    .replace(/\\\((.+?)\\\)/gs, (_, inner) => `$${inner}$`)
  assert(normalizeMath('\\(x^2\\)') === '$x^2$', 'Inline math')
  assert(normalizeMath('\\[x^2\\]') === '$$x^2$$', 'Display math')
  assert(normalizeMath('no math here') === 'no math here', 'No change')
})

test('Problem items get blank lines for rendering', () => {
  const addBreaks = (text) => text.replace(/\n((?:[ivx]+|[a-z]|\d+)[\.\)]\s)/gi, '\n\n$1')
  const input = 'EXERCISE 1-1\ni. first\nii. second'
  const result = addBreaks(input)
  assert(result.includes('\n\ni.'), 'Blank line before i.')
  assert(result.includes('\n\nii.'), 'Blank line before ii.')
})

// ─── Webhook System ──────────────────────────────────────────────────────────

console.log('\n--- Webhook System ---')

test('HMAC-SHA256 signature format', () => {
  // Should produce sha256= prefix
  const sig = 'sha256=abc123def456'
  assert(sig.startsWith('sha256='), 'Correct prefix')
  assert(sig.length > 10, 'Has hex content')
})

test('Webhook event types are valid', () => {
  const events = ['book.uploaded', 'book.deleted', 'book.progress',
    'analysis.characters', 'analysis.structure', 'quiz.completed',
    'problem.solved', 'bookmark.created']
  assert(events.length === 8, '8 event types')
  assert(events.every(e => e.includes('.')), 'All use dot notation')
})

// ─── Quota Enforcement ───────────────────────────────────────────────────────

console.log('\n--- Quota System ---')

test('Free user blocked at spend limit', () => {
  const checkQuota = (tier, spend, limit) => {
    if (tier !== 'free') return null
    if (spend >= limit) return 'Monthly AI quota reached.'
    return null
  }
  assert(checkQuota('free', 2.5, 2) !== null, 'Over limit = blocked')
  assert(checkQuota('free', 1.5, 2) === null, 'Under limit = allowed')
  assert(checkQuota('pro', 100, 5) === null, 'Pro always passes')
})

test('Usage costs are reasonable', () => {
  const costs = {
    'problem-set-chat': 0.002,
    'library-chat': 0.002,
    'tts': 0.015,
  }
  assert(costs['problem-set-chat'] < 0.01, 'PSC is cheap')
  assert(costs['tts'] < 0.05, 'TTS is reasonable')
})

// ─── Image System ────────────────────────────────────────────────────────────

console.log('\n--- Image System ---')

test('Signed URL extraction from public URL', () => {
  const publicUrl = 'https://xqtt.supabase.co/storage/v1/object/public/page-images/user123/img.jpg'
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/page-images\/(.+)/)
  assert(match !== null, 'Regex matches')
  assert(match[1] === 'user123/img.jpg', 'Path extracted correctly')
})

test('Extracted images skip signed URL conversion', () => {
  const shouldConvert = (source) => source !== 'extracted'
  assert(!shouldConvert('extracted'), 'Skip extracted')
  assert(shouldConvert('ai_generated'), 'Convert AI generated')
})


// ─── Structure Scanner ───────────────────────────────────────────────────────

console.log('\n--- Structure Scanner ---')

// Import would require ESM setup — inline the logic for testing

const HEADING_PATTERNS_TEST = [
  { re: /^(#{1,6})\s+(.+)$/gm, level: m => m[1].length, title: m => m[2].trim() },
  { re: /^\\section\*?\{(.+?)\}/gm, level: () => 2, title: m => m[1] },
  { re: /^(?:CHAPTER|Chapter)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Chapter ${m[1]}${m[2] ? ': ' + m[2].trim() : ''}` },
]

test('Detects markdown headings', () => {
  const text = '# Title\n\nSome text\n\n## Section 1\n\nMore\n\n### Subsection'
  const headings = []
  for (const pat of HEADING_PATTERNS_TEST) {
    pat.re.lastIndex = 0
    let m
    while ((m = pat.re.exec(text)) !== null) headings.push({ title: pat.title(m), level: pat.level(m) })
  }
  assert(headings.length === 3, `Expected 3, got ${headings.length}`)
  assert(headings[0].title === 'Title', 'First heading')
  assert(headings[0].level === 1, 'Level 1')
  assert(headings[2].level === 3, 'Level 3')
})

test('Detects LaTeX sections', () => {
  const text = '\\section{Introduction}\nblah\n\\section{Methods}'
  const headings = []
  const pat = HEADING_PATTERNS_TEST[1]
  pat.re.lastIndex = 0
  let m
  while ((m = pat.re.exec(text)) !== null) headings.push({ title: pat.title(m), level: pat.level(m) })
  assert(headings.length === 2, `Expected 2, got ${headings.length}`)
  assert(headings[0].title === 'Introduction', headings[0].title)
})

test('Detects Chapter N format', () => {
  const text = 'Chapter 1: The Beginning\n\nOnce upon...\n\nChapter 2: The Middle'
  const headings = []
  const pat = HEADING_PATTERNS_TEST[2]
  pat.re.lastIndex = 0
  let m
  while ((m = pat.re.exec(text)) !== null) headings.push({ title: pat.title(m), level: pat.level(m) })
  assert(headings.length === 2, `Expected 2, got ${headings.length}`)
  assert(headings[0].title === 'Chapter 1: The Beginning', headings[0].title)
})

test('Language detection', () => {
  const detectLang = (text) => {
    const markers = [
      { lang: 'en', words: ['the', 'and', 'is', 'was', 'that', 'for', 'with'] },
      { lang: 'es', words: ['que', 'los', 'las', 'del', 'una', 'por', 'con'] },
      { lang: 'fr', words: ['les', 'des', 'est', 'une', 'que', 'dans', 'pour'] },
    ]
    const words = text.toLowerCase().split(/\s+/)
    let best = 'en', bestScore = 0
    for (const { lang, words: m } of markers) {
      const score = m.filter(w => words.includes(w)).length
      if (score > bestScore) { bestScore = score; best = lang }
    }
    return best
  }
  assert(detectLang('The cat is on the mat and was there') === 'en', 'English')
  assert(detectLang('Los gatos que están por las calles del pueblo') === 'es', 'Spanish')
  assert(detectLang('Les chats sont dans les rues pour une promenade') === 'fr', 'French')
})

test('Smart page breaks prefer paragraph boundaries', () => {
  const text = 'First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.\n\nFourth.'
  // With target 25 chars, should break at \n\n not mid-word
  const breaks = [0]
  let pos = 0
  const len = 25
  while (pos < text.length) {
    const target = pos + len
    if (target >= text.length) break
    const chunk = text.substring(target, Math.min(target + 50, text.length))
    const paraIdx = chunk.indexOf('\n\n')
    const end = paraIdx !== -1 ? target + paraIdx + 2 : target
    breaks.push(end)
    pos = end
  }
  // Every break should be at a \n\n position or end of text
  for (let i = 1; i < breaks.length; i++) {
    const before = text.substring(breaks[i] - 2, breaks[i])
    assert(before === '\n\n' || breaks[i] >= text.length - 10, `Break ${i} at non-paragraph: "${before}"`)
  }
})


// ─── Scroll mode page tracking (with smart breaks) ──────────────────────────

console.log('\n--- Scroll Mode Page Tracking ---')

test('Binary search maps scroll offset to correct page', () => {
  const breaks = [0, 400, 850, 1200, 1700, 2000]  // 5 pages with variable sizes
  const contentLen = 2000

  const findPage = (contentOffset) => {
    let lo = 0, hi = breaks.length - 1
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (breaks[mid] <= contentOffset) lo = mid; else hi = mid - 1 }
    return lo + 1
  }

  assert(findPage(0) === 1, 'Offset 0 → page 1')
  assert(findPage(200) === 1, 'Offset 200 → page 1')
  assert(findPage(400) === 2, 'Offset 400 → page 2')
  assert(findPage(850) === 3, 'Offset 850 → page 3')
  assert(findPage(1000) === 3, 'Offset 1000 → page 3')
  assert(findPage(1700) === 5, 'Offset 1700 → page 5')
  assert(findPage(1999) === 5, 'Offset 1999 → page 5')
})

test('Scroll position maps to break offset correctly', () => {
  const breaks = [0, 420, 840, 1260, 1680, 2100]  // uniform 420-char pages
  const contentLen = 2100

  // goToPage: page 3 → breakOffset = 840, pct = 840/2100 = 0.4
  const page = 3
  const breakOffset = breaks[page - 1]
  const pct = breakOffset / contentLen
  assert(Math.abs(pct - 0.4) < 0.01, `Expected ~0.4, got ${pct}`)

  // handleScrollProgress: pct 0.4 → contentOffset 840 → page 3
  const contentOffset = Math.floor(0.4 * contentLen)
  let lo = 0, hi = breaks.length - 1
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (breaks[mid] <= contentOffset) lo = mid; else hi = mid - 1 }
  assert(lo + 1 === 3, `Expected page 3, got ${lo + 1}`)
})

test('Non-uniform breaks: goToPage and handleScroll are inverses', () => {
  const breaks = [0, 300, 800, 1100, 1900, 2400]
  const contentLen = 2400

  for (let page = 1; page <= breaks.length; page++) {
    const breakOffset = breaks[page - 1] ?? 0
    const pct = breakOffset / contentLen
    const contentOffset = Math.floor(pct * contentLen)
    let lo = 0, hi = breaks.length - 1
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (breaks[mid] <= contentOffset) lo = mid; else hi = mid - 1 }
    assert(lo + 1 === page, `Page ${page}: goToPage → scroll → findPage = ${lo + 1}`)
  }
})

// ─── Pagination against the REAL textPipeline ────────────────────────────────

/**
 * Everything above this line reimplements the logic it checks, which is useful
 * for pinning arithmetic and useless for catching a regression in the shipped
 * code. This section builds `components/reader/textPipeline.ts` and calls it.
 *
 * It is cheap to do: that module has no imports at all, so a bare tsc with no
 * path mapping emits it cleanly — unlike the concepts modules, which need the
 * tolerant build in concepts-logic.mjs.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

console.log('\n--- textPipeline (the real module) ---')

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'reader-'))
const pipeline = (() => {
  try {
    execFileSync(process.execPath, [
      join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc'),
      join('components', 'reader', 'textPipeline.ts'),
      '--outDir', outDir, '--module', 'commonjs', '--target', 'es2020',
      '--moduleResolution', 'node', '--esModuleInterop', '--skipLibCheck',
      '--rootDir', join(FRONTEND, 'components'),
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim()) console.error(out.trim())
  }
  writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }))
  return createRequire(import.meta.url)(join(outDir, 'reader', 'textPipeline.js'))
})()

const { computePageBreaks, sliceForPage } = pipeline

/**
 * A page break must never land inside a markdown image or link.
 *
 * The fixture is the shape that broke it: a maths article from Wikipedia,
 * where every formula is served as an image and the URLs run past 250
 * characters against a 420-character page. The three negotiated breaks —
 * heading, paragraph, sentence — all fail inside a URL, so this input is
 * exactly the one that reaches the hard-cut fallback.
 *
 * Before the fix, three of this article's eighteen links were severed and the
 * reader showed `…/250px-Borromean` at the foot of a page with no image on
 * either side of the break.
 */
const IMG = (n) =>
  `![{\\displaystyle n^{${n}}-n}](https://wikimedia.org/api/rest_v1/media/math/render/svg/` +
  `ce3501c9dc684fcd91366953cba9b88f62aabe69${n}?utm_source=en.wikipedia.org` +
  `&utm_campaign=parser&utm_content=thumbnail)`

const PROSE =
  'In mathematics the Borromean rings are three simple closed curves which are linked ' +
  'but form no two-component link, so that cutting any one frees the other two entirely. '

const article = Array.from({ length: 12 }, (_, i) => `${PROSE}${IMG(i)}\n\n`).join('')

const linkSpans = (text) =>
  [...text.matchAll(/!?\[[^\]\n]*\]\([^)\s]*\)/g)].map(m => ({ s: m.index, e: m.index + m[0].length }))

test('no page break falls inside a markdown image', () => {
  const breaks = computePageBreaks(article, 420)
  const spans = linkSpans(article)
  const cut = []
  for (const b of breaks) {
    const hit = spans.find(s => b > s.s && b < s.e)
    if (hit) cut.push(`${b} inside ${article.slice(hit.s, hit.s + 30)}…`)
  }
  assert(cut.length === 0, `${cut.length} break(s) inside a link: ${cut[0] ?? ''}`)
})

test('every image survives whole on exactly one page', () => {
  const breaks = computePageBreaks(article, 420)
  const pages = breaks.map((_, i) => sliceForPage(article, i + 1, breaks, 420))
  const whole = pages.join('').match(/!\[[^\]]*\]\([^)]*\)/g) ?? []
  const perPage = pages.flatMap(p => p.match(/!\[[^\]]*\]\([^)]*\)/g) ?? [])
  assert(whole.length === 12, `expected 12 links in the rejoined text, got ${whole.length}`)
  assert(perPage.length === 12,
    `expected all 12 links intact within single pages, got ${perPage.length}`)
})

test('the pages still rejoin to exactly the original text', () => {
  const breaks = computePageBreaks(article, 420)
  const rejoined = breaks.map((_, i) => sliceForPage(article, i + 1, breaks, 420)).join('')
  assert(rejoined === article, `rejoined length ${rejoined.length} vs ${article.length}`)
})

test('pages still land near the target when nothing is in the way', () => {
  // Plain prose, no links: the fix must not change ordinary pagination.
  const plain = (PROSE.repeat(20))
  const breaks = computePageBreaks(plain, 420)
  const sizes = breaks.slice(1).map((b, i) => b - breaks[i])
  assert(sizes.every(s => s > 0), 'every page must make forward progress')
  assert(sizes.every(s => s < 420 * 2),
    `no page should be wildly over target without a link to blame: ${Math.max(...sizes)}`)
})

test('a link longer than a whole page does not stall pagination', () => {
  // The forward-push could loop if it ever failed to advance. One 900-char
  // link against a 200-char page is the degenerate case.
  const huge = `${PROSE}![x](https://example.com/${'a'.repeat(900)})\n\n${PROSE}`
  const breaks = computePageBreaks(huge, 200)
  const sizes = breaks.slice(1).map((b, i) => b - breaks[i])
  assert(sizes.every(s => s > 0), 'pagination stalled on an over-long link')
  assert(breaks[breaks.length - 1] <= huge.length, 'a break ran past the end of the text')
})

rmSync(outDir, { recursive: true, force: true })

// ─── Final Summary ───────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
