#!/usr/bin/env node
/**
 * Unit checks for the librarian's context gating.
 *
 * Only the PURE half of lib/librarian/context.ts is covered — `sectionsNeeded`
 * and `notLoadedNotice`. `feedContext` and `practiceContext` read the database
 * and are integration concerns; a test that faked those reads would be
 * asserting the fake, which is the same line tests/concepts-logic.mjs draws
 * around the equivalence worker.
 *
 * WHY THIS FILE EXISTS AT ALL: the gating decides whether the librarian can
 * see anything, and it fails in two directions with very different costs. A
 * missed trigger is recoverable — it says it has not looked. A trigger that
 * fires on everything silently restores the per-message cost the gate was
 * added to remove. Both directions are asserted here.
 *
 * The harness compiles the module with the project's own tsc, same as the
 * other suites. It works because context.ts's only runtime imports are from
 * lib/suggest and lib/concepts — so those are compiled alongside it, and the
 * `@/lib/...` specifiers are rewritten by nothing: they are never reached,
 * because nothing here calls a function that touches them.
 *
 * Run: node tests/librarian-logic.mjs      (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'librarian-logic-'))

/**
 * The gating functions, extracted and compiled in isolation.
 *
 * context.ts imports the suggest and concepts stores at module scope, and
 * those import `@supabase/supabase-js` and `@/lib/supabaseSchema` — neither of
 * which this harness maps. So rather than map them, the two pure functions are
 * compiled from a slice of the file. The slice is taken by MARKER, not by line
 * number, so it cannot silently drift: if the markers move or vanish the build
 * fails loudly instead of testing a stale copy.
 */
function build() {
  const src = readFileSync(join(FRONTEND, 'lib', 'librarian', 'context.ts'), 'utf8')
  const start = src.indexOf('const FEED_TRIGGERS')
  const end = src.indexOf('export async function librarianContext')
  if (start < 0 || end < 0 || end <= start) {
    console.error(
      'FATAL: could not find the gating section in lib/librarian/context.ts.\n' +
      'Expected `const FEED_TRIGGERS` followed by `export async function librarianContext`.\n' +
      'If those were renamed, update this harness — do not delete the check.',
    )
    process.exit(1)
  }
  const slice = src.slice(start, end)
  const file = join(outDir, 'gating.ts')
  writeFileSync(file, slice)

  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [
      tsc, file,
      '--outDir', outDir,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--skipLibCheck',
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim()) console.error(out.trim())
  }
  const require = createRequire(import.meta.url)
  return require(join(outDir, 'gating.js'))
}

const M = build()

// ── harness ──────────────────────────────────────────────────────────────────

let passed = 0
const failures = []
let current = ''

function test(name, fn) {
  current = name
  try { fn(); passed++ } catch (e) { failures.push(`${name}: ${e.message}`) }
}
function assert(cond, msg) { if (!cond) throw new Error(msg ?? 'assertion failed') }
function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg ?? current} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}

const user = content => ({ role: 'user', content })
const bot = content => ({ role: 'assistant', content })

// ═══════════════════════════════════════════════════════════════════════════
// sectionsNeeded — it must fire
// ═══════════════════════════════════════════════════════════════════════════

test('a direct feed question loads the feed and not practice', () => {
  const r = M.sectionsNeeded([user('why is this article in my feed?')])
  eq(r.feed, true)
  eq(r.practice, false, 'a feed question should not pay for the practice reads')
})

test('a direct practice question loads practice and not the feed', () => {
  const r = M.sectionsNeeded([user('what maths should I work on next?')])
  eq(r.practice, true)
  eq(r.feed, false)
})

test('a question about both loads both', () => {
  const r = M.sectionsNeeded([user('anything in my feed that connects to the algebra I am practising?')])
  eq(r.feed, true)
  eq(r.practice, true)
})

test('the phrasings a person actually uses all fire', () => {
  const feedy = [
    'what should I read today?',
    'why did you suggest that one?',
    'any good headlines?',
    'what news do I have',
    'why is this showing up',
    'can you recommend something',
    'what are my sources',
    'add an rss subscription',
    'what is in my digest',
  ]
  for (const q of feedy) {
    assert(M.sectionsNeeded([user(q)]).feed, `feed trigger missed: "${q}"`)
  }
  const mathy = [
    'what am I blocked on',
    'how is my practice going',
    'quiz me on logarithms',
    'I keep getting polynomials wrong',
    'what concepts have I mastered',
    'what should I study',
    'show me my review queue',
    'help with this problem set',
  ]
  for (const q of mathy) {
    assert(M.sectionsNeeded([user(q)]).practice, `practice trigger missed: "${q}"`)
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// sectionsNeeded — it must NOT fire on everything
// ═══════════════════════════════════════════════════════════════════════════

test('an ordinary book question loads nothing', () => {
  // The entire point of the gate. If this regresses, every library chat
  // message pays for two rounds of database reads again.
  const r = M.sectionsNeeded([user('what did Tolstoy say about family in Anna Karenina?')])
  eq(r.feed, false)
  eq(r.practice, false)
})

test('book questions in general load nothing', () => {
  const booky = [
    'summarise chapter three',
    'who is the narrator',
    'what else have I read by her',
    'find me a quote about grief',
    'how long is this',
    'translate this passage',
  ]
  for (const q of booky) {
    const r = M.sectionsNeeded([user(q)])
    assert(!r.feed && !r.practice, `gate leaked on a book question: "${q}" → ${JSON.stringify(r)}`)
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// sectionsNeeded — follow-ups
// ═══════════════════════════════════════════════════════════════════════════

test('a keyword-free follow-up keeps the context loaded', () => {
  // "Why that one?" is the commonest second message there is and contains no
  // trigger. Gating on the latest message alone would drop the context exactly
  // when it was most needed.
  const r = M.sectionsNeeded([
    user('what is in my feed today?'),
    bot('Four items — the MBTI paper is there because it bridges machine learning.'),
    user('why that one?'),
  ])
  eq(r.feed, true)
})

test('an assistant turn alone is enough of a signal', () => {
  const r = M.sectionsNeeded([
    bot('Your practice shows you are blocked on adding and multiplying polynomials.'),
    user('ok, and then?'),
  ])
  eq(r.practice, true)
})

test('the window is bounded, so an old topic stops counting', () => {
  // Otherwise a single feed question at the top of a long chat would make
  // every subsequent message pay for the reads forever.
  const messages = [
    user('what is in my feed?'),
    bot('Four items.'),
  ]
  for (let i = 0; i < 8; i++) {
    messages.push(user(`tell me more about chapter ${i}`), bot(`Chapter ${i} concerns the family.`))
  }
  const r = M.sectionsNeeded(messages)
  eq(r.feed, false, 'a feed question 16 messages ago must not still be loading the feed')
})

test('windowSize is honoured', () => {
  const messages = [user('my feed'), bot('ok'), user('a'), bot('b'), user('c')]
  eq(M.sectionsNeeded(messages, 10).feed, true)
  eq(M.sectionsNeeded(messages, 2).feed, false)
})

test('an empty or malformed message list is safe', () => {
  eq(M.sectionsNeeded([]).feed, false)
  eq(M.sectionsNeeded([{ role: 'user' }]).feed, false, 'a message with no content must not throw')
})

// ═══════════════════════════════════════════════════════════════════════════
// notLoadedNotice
// ═══════════════════════════════════════════════════════════════════════════

test('the notice says you know nothing, NOT that nothing is there', () => {
  // The whole reason the notice exists. An absent feed section reads to a
  // model as "there is nothing to say about the feed", and it will then answer
  // from imagination.
  const n = M.notLoadedNotice({ feed: true, practice: false })
  assert(/NOT LOADED/.test(n), n)
  assert(/know NOTHING/i.test(n), n)
  assert(/not that it is empty/i.test(n), `must rule out the empty reading: ${n}`)
  assert(/do not guess/i.test(n), n)
  assert(!/practice/i.test(n), 'should not mention a section that WAS loaded')
})

test('the notice is empty when both sections were loaded', () => {
  // No notice, so nothing dilutes the real context.
  eq(M.notLoadedNotice({ feed: false, practice: false }), '')
})

test('the notice names both when both are missing, and reads as plural', () => {
  const n = M.notLoadedNotice({ feed: true, practice: true })
  assert(/suggested feed/.test(n) && /practice state/.test(n), n)
  assert(/them/.test(n), `plural phrasing expected: ${n}`)
})

// ── report ───────────────────────────────────────────────────────────────────

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
