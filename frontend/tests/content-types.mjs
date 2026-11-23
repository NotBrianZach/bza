#!/usr/bin/env node
/**
 * The library's type-filter chips.
 *
 * Written after an empty white circle appeared under the search bar on the
 * home page. It was a chip: `content_type` has twelve values and the label map
 * had ten, so a library holding a `chat_book` or a `manga` rendered a border
 * with no text and no colour. Clicking it filtered the library to nothing and
 * explained nothing.
 *
 * The invariant worth holding is narrow and absolute: NO CHIP IS EVER EMPTY.
 * A wrong label is a cosmetic complaint; an empty one is indistinguishable
 * from a rendering fault, and it is a control you cannot tell is a control.
 *
 * `Record<ContentType, …>` already makes the maps complete against the TYPE,
 * and that is a compile error rather than a test. What it cannot cover is the
 * DATABASE — a column holds what it holds, rows predate unions, and an import
 * can write anything. That gap is what these cover.
 *
 * Run: node tests/content-types.mjs        (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'content-types-'))

/**
 * Compiled with the `import type` line stripped.
 *
 * contentTypes.ts imports `Book` for a type only, so the import is erased from
 * the emit anyway and nothing here needs the alias resolved. Stripping it
 * keeps this harness from having to map `@/`.
 */
function build() {
  const src = readFileSync(join(FRONTEND, 'lib', 'contentTypes.ts'), 'utf8')
    .replace(/^import type .*$/m, 'type Book = { content_type?: string }')
  const file = join(outDir, 'contentTypes.ts')
  writeFileSync(file, src)
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [
      tsc, file, '--outDir', outDir, '--module', 'commonjs', '--target', 'es2020',
      '--moduleResolution', 'node', '--esModuleInterop', '--skipLibCheck',
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim()) console.error(out.trim())
  }
  return createRequire(import.meta.url)(join(outDir, 'contentTypes.js'))
}

const M = build()

let passed = 0
const failures = []
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`) }
  catch (e) { failures.push(name); console.log(`  ✗ ${name} :: ${e.message}`) }
}
function assert(cond, msg) { if (!cond) throw new Error(msg ?? 'assertion failed') }

/**
 * The union, read out of the source rather than restated here.
 *
 * Restating it would mean this file could agree with itself while disagreeing
 * with the app — which is the exact failure being tested for, one level up.
 */
function declaredTypes() {
  const src = readFileSync(join(FRONTEND, 'lib', 'queries', 'types.ts'), 'utf8')
  const line = src.split('\n').find(l => /content_type\??:/.test(l))
  assert(line, 'could not find content_type in lib/queries/types.ts')
  const values = [...line.matchAll(/'([a-z_]+)'/g)].map(m => m[1])
  assert(values.length >= 10, `only found ${values.length} content types — did the shape change?`)
  return values
}

console.log('\ncontent type chips')

const DECLARED = declaredTypes()

test('every declared content type has a label', () => {
  const missing = DECLARED.filter(t => !M.TYPE_LABELS[t])
  assert(missing.length === 0, `no label for: ${missing.join(', ')}`)
})

test('every declared content type has chip colours', () => {
  const missing = DECLARED.filter(t => !M.TYPE_CHIP[t])
  assert(missing.length === 0, `no chip classes for: ${missing.join(', ')}`)
})

test('the two that were missing are there', () => {
  // chat_book and manga are the specific values that drew the empty circle.
  assert(M.TYPE_LABELS.chat_book, 'chat_book')
  assert(M.TYPE_LABELS.manga, 'manga')
})

test('no label is blank', () => {
  for (const [type, label] of Object.entries(M.TYPE_LABELS)) {
    assert(typeof label === 'string' && label.trim().length > 0, `${type} has an empty label`)
  }
})

/*
 * The database half. These are the ones that matter, because the type system
 * has no vote on what a column contains.
 */
test('an unknown type still gets words, not a blank chip', () => {
  assert(M.labelForType('scroll') === 'Scroll', M.labelForType('scroll'))
  assert(M.labelForType('audio_drama') === 'Audio drama', M.labelForType('audio_drama'))
})

test('null, undefined and empty string get words too', () => {
  for (const value of [null, undefined, '', '   ', '_', '__']) {
    const label = M.labelForType(value)
    assert(typeof label === 'string' && label.trim().length > 0,
      `${JSON.stringify(value)} produced an empty label`)
  }
})

test('an unknown type still gets visible chip classes', () => {
  // Without colour classes the chip keeps the bare `border` from the page and
  // renders as an outline with nothing in it — the circle, exactly.
  for (const value of ['scroll', null, undefined, '']) {
    const chip = M.chipForType(value)
    assert(typeof chip === 'string' && /border-/.test(chip) && /text-/.test(chip),
      `${JSON.stringify(value)} produced no usable chip classes: ${chip}`)
  }
})

test('a known type keeps its curated label rather than the fallback', () => {
  // math_textbook would title-case to "Math textbook"; the curated name is
  // "Math". The fallback must not quietly take over for known values.
  assert(M.labelForType('math_textbook') === 'Math', M.labelForType('math_textbook'))
  assert(M.labelForType('wikipedia_article') === 'Wikipedia', M.labelForType('wikipedia_article'))
})

// ---------------------------------------------------------------------------
// A saved chat has to stay a chat.
//
// `content_type === 'chat_book'` is the ONE thing that decides whether a book
// can be continued — BookReader reads exactly that and renders the input bar
// off it. The chat-book creator held a conversation and then saved it through
// `upload(file, { articleType: 'reference' })`, which set content_type to
// `reference`: the saved conversation opened as static prose with no way to
// add to it. Reported as "once a chat is a book you can't continue it".
//
// The two tests above pass either way, which is the point of adding these.
// They assert that `chat_book` has a LABEL; nothing asserted that anything
// ever produces one. A label for a type nothing creates is a chip that can
// never be clicked.
//
// Source assertions rather than behavioural ones, for the usual reason: the
// alternative is a Supabase round trip in a unit suite. What matters is a
// property of the code — which function the creator calls — and that is
// readable without a database.

const CREATOR = readFileSync(
  join(FRONTEND, 'components', 'upload', 'ChatBookCreator.tsx'), 'utf8')

test('the chat-book creator creates a chat book, not a reference book', () => {
  assert(/booksQueries\.createChatBook\(/.test(CREATOR), 'calls createChatBook')
  assert(!/booksQueries\.upload\(/.test(CREATOR), 'does not go through upload()')
  assert(!/articleType:\s*'reference'/.test(CREATOR), "no articleType: 'reference'")
})

test('the local-storage path carries the type too', () => {
  // A signed-out user got the same dead-end book, by a different route.
  const local = CREATOR.slice(CREATOR.indexOf('useLocalStorage'))
  assert(/content_type:\s*'chat_book'/.test(local), 'saveLocalBook gets chat_book')
})

test('createChatBook can be seeded, or a saved transcript has nowhere to go', () => {
  const BOOKS = readFileSync(join(FRONTEND, 'lib', 'queries', 'books.ts'), 'utf8')
  assert(/async createChatBook\(title: string, initialMarkdown\?: string\)/.test(BOOKS),
    'createChatBook takes initial content')
  assert(/content_type:\s*'chat_book'/.test(BOOKS), 'and sets the type')
})

test('the creator writes turns in the shape the reader appends in', () => {
  // Both render, so a mismatch looks like nothing is wrong — until a
  // continued conversation carries two conventions with the seam exactly
  // where the save happened.
  const READER = readFileSync(join(FRONTEND, 'components', 'BookReader.tsx'), 'utf8')
  const readerUsesBold = /\*\*You:\*\*/.test(READER) && /\*\*Assistant:\*\*/.test(READER)
  const creatorUsesBold = /\*\*You:\*\*/.test(CREATOR) && /\*\*Assistant:\*\*/.test(CREATOR)
  assert(readerUsesBold, 'reader appends **You:** / **Assistant:**')
  assert(creatorUsesBold, 'creator seeds the same way')
  assert(!/## You\\n/.test(CREATOR), 'and no longer uses ## headings')
})

// ---------------------------------------------------------------------------
// The prompt box is a textarea everywhere, not a one-line input.
//
// A single-line `<input>` cannot grow, so a paragraph scrolls sideways and the
// text you wrote is present and invisible. That was true of all three chat
// surfaces. One shared component now, so the next surface cannot quietly get
// the old control.

test('every chat surface composes in the shared PromptInput', () => {
  /*
   * The rule is about the MESSAGE box, not about `type="text"` anywhere.
   *
   * The first version of this banned `type="text"` outright and failed on
   * ChatBookCreator's conversation-title field — which is correctly a
   * one-line input, as PromptInput's own header says. An assertion broad
   * enough to forbid a legitimate control is one somebody will satisfy by
   * making the control worse.
   *
   * So: the surface must use PromptInput, and no single-line input may be
   * bound to the state that holds the message being composed.
   */
  for (const [rel, messageState] of [
    [['components', 'upload', 'ChatBookCreator.tsx'], 'input'],
    [['components', 'reader', 'ChatBookReader.tsx'], 'chatInput'],
    [['components', 'ChatPanel.tsx'], 'inputValue'],
  ]) {
    const src = readFileSync(join(FRONTEND, ...rel), 'utf8')
    const name = rel[rel.length - 1]
    assert(/<PromptInput/.test(src), `${name} uses PromptInput`)
    const oneLineOnMessage = new RegExp(
      `<input[^>]*type="text"[^>]*value=\\{${messageState}\\}`, 's')
    assert(!oneLineOnMessage.test(src),
      `${name} binds no one-line input to ${messageState}`)
  }
})

test('PromptInput sends on Enter, newlines on Shift+Enter, and survives an IME', () => {
  const P = readFileSync(join(FRONTEND, 'components', 'PromptInput.tsx'), 'utf8')
  assert(/<textarea/.test(P), 'it is a textarea')
  assert(/e\.key === 'Enter' && !e\.shiftKey/.test(P), 'Enter sends, Shift+Enter does not')
  // An IME accepts a candidate with Enter. Without this a Japanese or Chinese
  // keyboard sends half a word, which makes the control unusable rather than
  // merely annoying.
  assert(/isComposing/.test(P), 'composition is checked before sending')
  // The height reset before measuring is what lets the box SHRINK again.
  assert(/height = 'auto'/.test(P), 'height is reset before measuring scrollHeight')
})

rmSync(outDir, { recursive: true, force: true })
console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
