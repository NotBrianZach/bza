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

rmSync(outDir, { recursive: true, force: true })
console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
