#!/usr/bin/env node
/**
 * Unit checks for the AI Listen Along game logic.
 *
 * Covers the parts of the section that are pure and mechanical, and therefore
 * the parts a regression would hide in: the tolerant JSON parse that stands
 * between a model response and the database, the world-state merge that
 * guarantees established facts accumulate rather than get overwritten, and the
 * mode registry's own internal consistency.
 *
 * There used to be a computeLinks group here, covering the Spotify-metadata link
 * checks that decided legality in strict modes. Both are gone: legality is now
 * the interpreter's ruling, which is not mechanical and so is not testable here.
 *
 * Nothing here touches the network — no Spotify, no interpreter. The turn route
 * itself is covered by playing a game in the browser.
 *
 * Run: node tests/listen-logic.mjs        (from frontend/)
 *
 * The modules under test are TypeScript, so they are transpiled to CommonJS in
 * a temp dir first using the project's own `typescript` devDependency. tsc's
 * CommonJS output keeps extensionless relative requires, which Node's CJS
 * resolver handles — no bundler and no extra dependency needed.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'listen-logic-'))

function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  const entries = ['prompt', 'modes'].map(n => join('lib', 'listen', `${n}.ts`))
  try {
    execFileSync(process.execPath, [
      tsc, ...entries,
      '--outDir', outDir,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--rootDir', join(FRONTEND, 'lib', 'listen'),
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    // tsc exits non-zero on type errors but still emits; only a missing emit is fatal.
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim()) console.error(out.trim())
  }
  const require = createRequire(import.meta.url)
  return {
    prompt: require(join(outDir, 'prompt.js')),
    modes: require(join(outDir, 'modes.js')),
  }
}

const { prompt: P, modes: M } = build()
const { parseJsonObject, normalizeInterpretation, applyWorldDelta } = P
const { MODE_LIST, MODES, getMode } = M

let pass = 0
const failures = []
function t(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { failures.push(name); console.log(`  ✗ ${name}${extra ? ` :: ${extra}` : ''}`) }
}
const group = name => console.log(`\n${name}`)

group('parseJsonObject — surviving what models actually return')
t('a bare object', parseJsonObject('{"a":1}')?.a === 1)
t('a fenced object', parseJsonObject('```json\n{"a":2}\n```')?.a === 2)
t('prose before the object', parseJsonObject('Sure thing!\n{"a":3}')?.a === 3)
t('prose after the object', parseJsonObject('{"a":4} hope that helps')?.a === 4)
t('nested objects', parseJsonObject('{"a":{"b":{"c":5}}}')?.a.b.c === 5)
t('braces inside a string do not end the object', parseJsonObject('{"a":"}{"}')?.a === '}{')
t('escaped quotes inside a string', parseJsonObject('{"a":"say \\"hi\\""}')?.a === 'say "hi"')
t('an escaped backslash before a quote', parseJsonObject('{"a":"back\\\\"}')?.a === 'back\\')
t('no JSON at all yields null', parseJsonObject('there is no json here') === null)
t('an unterminated object yields null', parseJsonObject('{"a":1') === null)

group('normalizeInterpretation — refusing to store junk')
t('an empty response is rejected', normalizeInterpretation({}) === null)
t('a non-object is rejected', normalizeInterpretation(null) === null)
t('a reading alone is enough', normalizeInterpretation({ reading: 'r' })?.reading === 'r')
t('facts are capped', normalizeInterpretation({ reading: 'r', facts: ['1', '2', '3', '4', '5'] })?.facts.length === 3)
t('non-string facts are dropped', normalizeInterpretation({ reading: 'r', facts: ['ok', 7, null] })?.facts.length === 1)
t('an array worldDelta is discarded', Object.keys(normalizeInterpretation({ reading: 'r', worldDelta: ['no'] }).worldDelta).length === 0)
t('a verdict passes through', normalizeInterpretation({ reading: 'r', verdict: 'illegal' })?.verdict === 'illegal')
t('an invented verdict is dropped', normalizeInterpretation({ reading: 'r', verdict: 'maybe' })?.verdict === undefined)

group('applyWorldDelta — established facts are binding')
const w0 = { place: 'the airfield', callers: [], anomaly: 'unestablished', facts: ['f1'] }
const w1 = applyWorldDelta(w0, normalizeInterpretation({ reading: 'r', narration: 'n', facts: ['f2'], worldDelta: { place: 'the hangar' } }))
t('a changed key is merged', w1.place === 'the hangar')
t('keys the delta omits survive', w1.anomaly === 'unestablished' && Array.isArray(w1.callers))
t('facts accumulate rather than replace', JSON.stringify(w1.facts) === JSON.stringify(['f1', 'f2']), JSON.stringify(w1.facts))
t('a repeated fact is not duplicated', JSON.stringify(applyWorldDelta(w1, normalizeInterpretation({ reading: 'r', facts: ['f1'] })).facts) === JSON.stringify(['f1', 'f2']))
t('facts smuggled into worldDelta are folded in, not overwriting', JSON.stringify(applyWorldDelta(w1, normalizeInterpretation({ reading: 'r', worldDelta: { facts: ['f3'] } })).facts) === JSON.stringify(['f1', 'f2', 'f3']))
t('the original world is not mutated', JSON.stringify(w0.facts) === JSON.stringify(['f1']))

group('mode registry — internal consistency')
t('MODE_LIST covers every mode exactly once', MODE_LIST.length === Object.keys(MODES).length && new Set(MODE_LIST.map(m => m.id)).size === MODE_LIST.length)
t('every entry is filed under its own id', MODE_LIST.every(m => MODES[m.id]?.id === m.id))
t('every mode seeds a facts array', MODE_LIST.every(m => Array.isArray(m.seedWorld.facts)))
t('every mode declares world keys', MODE_LIST.every(m => m.worldKeys.length > 0))
t('every declared world key is seeded', MODE_LIST.every(m => m.worldKeys.every(k => k.key in m.seedWorld)),
  MODE_LIST.filter(m => !m.worldKeys.every(k => k.key in m.seedWorld)).map(m => m.id).join(', '))
t('every mode answers all six pieces', MODE_LIST.every(m =>
  ['playerMove', 'interpreter', 'responseRule', 'worldState', 'constraint', 'goal'].every(k => typeof m.pieces[k] === 'string' && m.pieces[k].length > 0)))
t('every mode has a persona and a reply rule', MODE_LIST.every(m => m.persona.length > 0 && m.replyRule.length > 0))
t('every judge is one of the two kinds', MODE_LIST.every(m => ['player', 'narrator'].includes(m.judge)))
t('both interpretation kinds are represented', new Set(MODE_LIST.map(m => m.judge)).size === 2)
t('no mode judges on Spotify metadata any more', MODE_LIST.every(m => m.judge !== 'features'))
t('a mode that enforces its constraint exists', MODE_LIST.some(m => m.enforcesConstraint === true))
t('enforcesConstraint is boolean-or-absent', MODE_LIST.every(m => m.enforcesConstraint === undefined || typeof m.enforcesConstraint === 'boolean'))
t('an unknown mode id yields null', getMode('no-such-mode') === null)

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
