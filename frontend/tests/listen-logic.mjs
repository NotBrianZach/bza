#!/usr/bin/env node
/**
 * Unit checks for the AI Listen Along game logic.
 *
 * Covers the parts of the section that are pure and mechanical, and therefore
 * the parts a regression would hide in: the verifiable link checks that decide
 * legality in strict modes, the tolerant JSON parse that stands between a model
 * response and the database, the world-state merge that guarantees established
 * facts accumulate rather than get overwritten, and the mode registry's own
 * internal consistency.
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
  const entries = ['links', 'prompt', 'modes'].map(n => join('lib', 'listen', `${n}.ts`))
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
    links: require(join(outDir, 'links.js')),
    prompt: require(join(outDir, 'prompt.js')),
    modes: require(join(outDir, 'modes.js')),
  }
}

const { links: L, prompt: P, modes: M } = build()
const { computeLinks, describeLinks } = L
const { parseJsonObject, normalizeInterpretation, applyWorldDelta } = P
const { MODE_LIST, MODES, getMode } = M

let pass = 0
const failures = []
function t(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { failures.push(name); console.log(`  ✗ ${name}${extra ? ` :: ${extra}` : ''}`) }
}
const group = name => console.log(`\n${name}`)

/** A track with sane defaults, so each case only states what it is testing. */
const mk = o => ({
  id: o.id,
  name: o.name,
  artist: o.artist ?? 'Some Artist',
  artistIds: o.artistIds ?? ['artist-default'],
  album: o.album ?? 'Some Album',
  albumId: o.albumId ?? 'album-default',
  releaseDate: o.releaseDate ?? '2001-01-01',
  uri: `spotify:track:${o.id}`,
  url: null,
  image: null,
  previewUrl: null,
  durationMs: o.durationMs ?? 200_000,
  popularity: o.popularity ?? 50,
  explicit: false,
})

// Two genuinely unrelated tracks: different artist, album, decade, length, reach.
const ROSE = mk({ id: 'rose', name: 'Rose Nebula', artist: 'Pram', artistIds: ['pram'], albumId: 'alb-a', releaseDate: '1998-03-01', durationMs: 240_000, popularity: 20 })
const ERROR = mk({ id: 'err', name: 'A New Error', artist: 'Moderat', artistIds: ['moderat'], albumId: 'alb-b', releaseDate: '2009-05-01', durationMs: 300_000, popularity: 60 })
/** Shares nothing with ROSE on any axis — the baseline for "no link holds". */
const unrelatedTo = o => mk({ albumId: 'alb-z', releaseDate: '1970-01-01', durationMs: 1_000, popularity: 99, artistIds: ['nobody'], ...o })

group('computeLinks — legality in strict modes')
t('an opening move has no previous track to link to', computeLinks(ROSE, null).length === 0)
t('unrelated tracks share nothing checkable', computeLinks(ROSE, ERROR).length === 0, describeLinks(computeLinks(ROSE, ERROR)))
t('same artist is a link', computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', artistIds: ['pram'] }), ROSE).some(l => l.id === 'artist'))
t('same album is a link', computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', albumId: 'alb-a' }), ROSE).some(l => l.id === 'album'))
t('a shared title word is a link', computeLinks(unrelatedTo({ id: 'x', name: 'Nebula Drift' }), ROSE).some(l => l.id === 'title-word'))
t('stopwords and short words are not a title link', !computeLinks(
  unrelatedTo({ id: 'x', name: 'The It Of A' }),
  mk({ id: 'y', name: 'A Of The It', artistIds: ['nobody2'], albumId: 'alb-y', releaseDate: '1955-01-01', durationMs: 5_000, popularity: 7 }),
).some(l => l.id === 'title-word'))
t('remaster suffixes are stripped before matching', computeLinks(unrelatedTo({ id: 'x', name: 'Nebula (2011 Remaster)' }), ROSE).some(l => l.id === 'title-word'))
t('dash suffixes are stripped before matching', computeLinks(unrelatedTo({ id: 'x', name: 'Nebula - Live at Home' }), ROSE).some(l => l.id === 'title-word'))
t('same decade is a link', computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', releaseDate: '1994-01-01' }), ROSE).some(l => l.id === 'decade'))
t('same year reports as year, not decade', (() => {
  const ls = computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', releaseDate: '1998-11-01' }), ROSE)
  return ls.some(l => l.id === 'year') && !ls.some(l => l.id === 'decade')
})())
t('near-identical length is a link', computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', durationMs: 245_000 }), ROSE).some(l => l.id === 'duration'))
t('a 40-second gap is not a length link', !computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', durationMs: 280_000 }), ROSE).some(l => l.id === 'duration'))
t('comparable popularity is a link', computeLinks(unrelatedTo({ id: 'x', name: 'Zzz', popularity: 22 }), ROSE).some(l => l.id === 'popularity'))
t('describeLinks reports an empty set as none', describeLinks([]) === 'none')

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
t('every judge is one of the three kinds', MODE_LIST.every(m => ['features', 'player', 'narrator'].includes(m.judge)))
t('all three interpretation kinds are represented', new Set(MODE_LIST.map(m => m.judge)).size === 3)
t('an unknown mode id yields null', getMode('no-such-mode') === null)

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
