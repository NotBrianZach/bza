#!/usr/bin/env node
/**
 * Derive the concept graph from task structure and print how it compares to the
 * authored one. Writes nothing.
 *
 * ── What this is for ──────────────────────────────────────────────────────
 *
 * SPEC-LEARNING §13 asks whether a prerequisite graph can come from somewhere
 * other than a person's judgement. This answers it with a number instead of an
 * opinion, and the number is the point — not the edge list.
 *
 * Read the three buckets, not the totals:
 *
 *   confirmed      structure and a person agree. Raises confidence in both.
 *   derived-only   structure proposes, nobody authored. Review candidates, and
 *                  the place the method's false positives live.
 *   authored-only  a person thought it mattered and structure is silent. The
 *                  most informative bucket: it maps what this method cannot see.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────
 *
 *   node scripts/derive-edges.mjs [--variants N] [--json] [--edges]
 *
 *   --variants N   generated instances per generator to draw as evidence
 *                  (default 20; 0 uses only the authored tasks, which makes
 *                  every support count an anecdote)
 *   --edges        print the derived candidates as pasteable ConceptEdge literals
 *   --json         the whole comparison as JSON
 *
 * Nothing printed here is promoted. Moving any of it into ontology.ts is a
 * hand-authoring decision, and the edges carry a rationale saying so.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const require = createRequire(join(FRONTEND, 'package.json'))

const argv = process.argv.slice(2)
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('usage: node scripts/derive-edges.mjs [--variants N] [--edges] [--json]')
  process.exit(0)
}

let variants = 20
let asJson = false
let showEdges = false
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--variants') {
    const value = Number(argv[i + 1])
    if (!Number.isInteger(value) || value < 0) {
      console.error('--variants needs a non-negative integer')
      process.exit(2)
    }
    variants = value
    i += 1
  } else if (argv[i] === '--json') asJson = true
  else if (argv[i] === '--edges') showEdges = true
  else {
    console.error(`Unknown option ${argv[i]}`)
    process.exit(2)
  }
}

const outDir = mkdtempSync(join(tmpdir(), 'bza-derive-'))
function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [
      tsc,
      join('lib', 'concepts', 'derive.ts'),
      join('lib', 'concepts', 'ontology.ts'),
      '--outDir', outDir,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--rootDir', join(FRONTEND, 'lib'),
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    // tsc exits non-zero on the unresolved `@/lib/...` path alias and still
    // emits; those imports are `import type` and erased. Only a missing emit is
    // fatal, which the require below surfaces.
    void e
  }
  return {
    derive: require(join(outDir, 'concepts', 'derive.js')),
    ontology: require(join(outDir, 'concepts', 'ontology.js')),
  }
}

const { derive, ontology } = build()
const o = ontology.RATIONAL_EXPRESSIONS

const containment = derive.deriveEdges(o, variants)
const interference = derive.deriveInterference(o, variants)
const comparisons = [
  derive.compareWithAuthored(o, containment, 'encompasses'),
  derive.compareWithAuthored(o, containment, 'candidate_prerequisite'),
  derive.compareWithAuthored(o, interference, 'interferes_with'),
]
const candidates = derive.asCandidateEdges(containment)

if (asJson) {
  console.log(JSON.stringify({ variants, comparisons, candidates }, null, 2))
  rmSync(outDir, { recursive: true, force: true })
  process.exit(0)
}

const rule = text => console.log(`\n${text}\n${'─'.repeat(text.length)}`)
const name = id => ontology.RATIONAL_EXPRESSIONS.concepts.find(c => c.id === id)?.name ?? id

console.log(`subject "${o.subject.id}" · ${variants} generated instance(s) per generator as evidence`)
if (variants === 0) {
  console.log('! with --variants 0 every support count rests on a single authored expression')
}

rule('Summary')
for (const line of derive.summariseDerivation(comparisons)) console.log(`  ${line}`)

for (const c of comparisons) {
  rule(c.kind)
  const pct = v => (v === null ? 'n/a' : `${Math.round(v * 100)}%`)
  console.log(`  recall ${pct(c.recall)} · precision ${pct(c.precision)}`)

  console.log('\n  confirmed — structure and the author agree')
  if (c.confirmed.length === 0) console.log('    (none)')
  for (const e of c.confirmed) {
    console.log(`    ${name(e.from)} → ${name(e.to)}   (${e.support} observations)`)
  }

  console.log('\n  derived only — proposals, and where the false positives are')
  if (c.derivedOnly.length === 0) console.log('    (none)')
  for (const e of c.derivedOnly) {
    console.log(`    ${name(e.from)} → ${name(e.to)}   (${e.support}) via ${e.via}`)
  }

  console.log('\n  authored only — a person saw something structure cannot')
  if (c.authoredOnly.length === 0) console.log('    (none)')
  for (const e of c.authoredOnly) {
    console.log(`    ${name(e.from)} → ${name(e.to)}`)
    if (e.rationale) console.log(`      "${e.rationale}"`)
  }
}

if (showEdges) {
  rule('Derived candidates, as ConceptEdge literals')
  console.log('// Paste into ontology.ts only after reviewing each one. No promotedBy:')
  console.log('// a derivation is not a promoter.')
  for (const edge of candidates) {
    console.log(`  {`)
    console.log(`    id: ${JSON.stringify(edge.id)},`)
    console.log(`    from: ${JSON.stringify(edge.from)},`)
    console.log(`    to: ${JSON.stringify(edge.to)},`)
    console.log(`    kind: 'candidate_prerequisite',`)
    console.log(`    rationale: ${JSON.stringify(edge.rationale)},`)
    console.log(`  },`)
  }
}

rmSync(outDir, { recursive: true, force: true })
