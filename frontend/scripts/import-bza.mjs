#!/usr/bin/env node
/**
 * Read a .bza scrape and print the ontology import report. Writes nothing.
 *
 * ── Why this exists alongside the route ───────────────────────────────────
 *
 * `POST /api/learn/import` needs a signed-in session and a running Next server.
 * The first thing anybody does with a fresh scrape is find out whether the
 * importer understands it at all, and that question should not require either.
 * This is the same code path — it imports `lib/concepts/import.ts` directly — so
 * a disagreement between this and the route would be a bug in one of them rather
 * than two implementations drifting.
 *
 * It is also the only way to run a real archive through the importer without a
 * browser, which matters because the fixture in tests/concepts-logic.mjs is
 * synthetic. Until a real archive goes through something, the wire types are what
 * the extension's code *writes*, not what a scrape was observed to write.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────
 *
 *   node scripts/import-bza.mjs <archive.bza> [--subject <id>] [--module out.ts]
 *
 *   --subject   the subject id to file the drafts under (default rational-expressions)
 *   --module    write the emitted TypeScript draft here instead of printing a preview
 *   --json      print the whole report as JSON, for piping
 *
 * Exits 0 when the archive was read, 1 when it could not be, and 2 on a usage
 * error. A report full of refusals is a successful run: refusing things is what
 * the importer is for.
 *
 * ── Capturing an archive in the first place ───────────────────────────────
 *
 *   1. Load math-academy-scraper as an unpacked extension (chrome://extensions,
 *      developer mode, "Load unpacked").
 *   2. Visit the topic pages you want. The prerequisite graph comes from a topic's
 *      *overview* page, so visiting only lessons yields steps and no edges —
 *      which imports fine and reports zero candidates.
 *   3. Click the extension, then "Export to BZA". That downloads the .bza.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const require = createRequire(join(FRONTEND, 'package.json'))

function usage(message) {
  console.error(`${message}\n`)
  console.error('usage: node scripts/import-bza.mjs <archive.bza> [--subject <id>] [--module <out.ts>] [--json]')
  process.exit(2)
}

const argv = process.argv.slice(2)
if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
  usage('Reads a .bza scrape and reports what it would propose. Writes nothing.')
}

/**
 * A single left-to-right pass, so a value that looks like a flag and a filename
 * that matches an earlier value are both handled. The obvious `indexOf`
 * implementation gets this wrong whenever the same string appears twice.
 */
let archivePath = null
let subjectId = 'rational-expressions'
let modulePath = null
let asJson = false

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i]
  if (arg === '--subject' || arg === '--module') {
    const value = argv[i + 1]
    if (value === undefined) usage(`${arg} needs a value`)
    if (arg === '--subject') subjectId = value
    else modulePath = value
    i += 1
  } else if (arg === '--json') {
    asJson = true
  } else if (arg.startsWith('--')) {
    usage(`Unknown option ${arg}`)
  } else if (archivePath === null) {
    archivePath = arg
  } else {
    usage('Only one archive at a time.')
  }
}

if (archivePath === null) usage('No archive given.')

/**
 * The importer is TypeScript, so it is transpiled to a temp dir with the
 * project's own tsc — the same approach tests/concepts-logic.mjs takes, and for
 * the same reason: no bundler, no extra dependency, and the `@/lib/...` imports
 * in these modules are all `import type` and therefore erased.
 */
const outDir = mkdtempSync(join(tmpdir(), 'bza-import-'))
function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [
      tsc,
      join('lib', 'concepts', 'expr.ts'),
      join('lib', 'concepts', 'import.ts'),
      join('lib', 'concepts', 'types.ts'),
      '--outDir', outDir,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--rootDir', join(FRONTEND, 'lib'),
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    // tsc exits non-zero on the unresolved path alias and still emits. Only a
    // missing emit is fatal, which the require below will surface.
    void e
  }
  return require(join(outDir, 'concepts', 'import.js'))
}

const { importArchive, emitDraftModule, summariseImport } = build()

let bytes
try {
  bytes = readFileSync(archivePath)
} catch (e) {
  console.error(`Could not read ${archivePath}: ${e.message}`)
  rmSync(outDir, { recursive: true, force: true })
  process.exit(1)
}

const JSZip = require('jszip')
const zip = await JSZip.loadAsync(bytes).catch(e => {
  console.error(`${archivePath} is not a readable ZIP: ${e.message}`)
  process.exit(1)
})

/** Missing members are not an error — a lesson-only scrape has no graph/. */
async function readJson(path) {
  const file = zip.file(path)
  if (!file) return undefined
  try {
    return JSON.parse(await file.async('text'))
  } catch (e) {
    console.error(`! ${path} is not valid JSON and was skipped (${e.message})`)
    return undefined
  }
}

const topics = await readJson('graph/topics.json')
const edges = await readJson('graph/edges.json')
const steps = await readJson('content/steps.json')
const manifest = await readJson('manifest.json')

if (!topics && !edges && !steps) {
  console.error(
    'The archive carries none of graph/topics.json, graph/edges.json or ' +
    'content/steps.json, so there is nothing to draft from.',
  )
  console.error(`Members present: ${Object.keys(zip.files).sort().join(', ') || '(none)'}`)
  rmSync(outDir, { recursive: true, force: true })
  process.exit(1)
}

const archive = {
  manifest: manifest && typeof manifest === 'object' ? manifest : undefined,
  graph: {
    topics: topics && typeof topics === 'object' && !Array.isArray(topics) ? topics : undefined,
    edges: Array.isArray(edges) ? edges : undefined,
  },
  steps: Array.isArray(steps) ? steps : undefined,
}

const report = importArchive(archive, subjectId)

if (asJson) {
  console.log(JSON.stringify({ ...report, module: emitDraftModule(report) }, null, 2))
  rmSync(outDir, { recursive: true, force: true })
  process.exit(0)
}

const rule = (text = '') => console.log(text ? `\n${text}\n${'─'.repeat(text.length)}` : '')

console.log(`${archivePath} → subject "${subjectId}"`)
console.log(`archive members: ${Object.keys(zip.files).sort().join(', ')}`)

rule('Summary')
console.log('NOTHING WAS WRITTEN. The ontology is a TypeScript module; promoting any of this')
console.log('means authoring it into lib/concepts/ontology.ts by hand.')
console.log()
for (const line of summariseImport(report)) console.log(`  ${line}`)

rule('Drafted concepts')
for (const concept of report.concepts) {
  const s = concept.source.stepCounts
  console.log(`  ${concept.id}  ${concept.name}`)
  console.log(`    origin: ${concept.source.origin}; steps: ${s.tutorial}t/${s.example}e/${s.question}q${s.unknown ? `/${s.unknown} unread` : ''}`)
  console.log(`    ${concept.draftKnowledgePoints.length} draft point(s), ${concept.draftTasks.length} draft task(s), ${concept.blocking.length} blocker(s)`)
}
if (report.concepts.length === 0) console.log('  (none)')

rule('Candidate prerequisites — none promoted, none gating anything')
for (const edge of report.edges) console.log(`  ${edge.from} → ${edge.to}`)
if (report.edges.length === 0) console.log('  (none)')

rule('Refused')
for (const edge of report.rejected.edges) {
  console.log(`  ${edge.from} → ${edge.to} [${edge.type}]`)
  console.log(`    ${edge.reason}`)
}
for (const step of report.rejected.steps) console.log(`  step ${step.id}: ${step.reason}`)
if (report.rejected.edges.length === 0 && report.rejected.steps.length === 0) console.log('  (nothing)')

if (report.cycles.length > 0) {
  rule('Cycles among candidates — the scraper\'s heuristics misfired somewhere')
  for (const loop of report.cycles) console.log(`  ${loop.join(' → ')} → ${loop[0]}`)
}

const emitted = emitDraftModule(report)
if (modulePath) {
  writeFileSync(modulePath, emitted)
  rule('Draft module')
  console.log(`  written to ${modulePath} (${emitted.split('\n').length} lines)`)
} else {
  rule('Draft module (first 40 lines — pass --module <file> to write it all)')
  console.log(emitted.split('\n').slice(0, 40).map(l => `  ${l}`).join('\n'))
}

rmSync(outDir, { recursive: true, force: true })
