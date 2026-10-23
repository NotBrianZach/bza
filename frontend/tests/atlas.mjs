#!/usr/bin/env node
/**
 * Checks on the atlas — the map of mathematics in atlas*.ts.
 *
 * Separate from tests/concepts-logic.mjs because the thing under test is a
 * DOCUMENT, not an algorithm. These assertions are editorial invariants: no
 * dangling edge, no cycle, no node shadowing an authored concept, nothing
 * unreachable. The logic they exercise (`gatingPrerequisitesOf`,
 * `ontologyProblems`) is unit-tested over there against synthetic graphs; here
 * it runs against the real content, where the failure mode is a typo in an id
 * rather than a bug in a walk.
 *
 * The coverage report at the end is deliberately printed on every run. A map
 * that is 3% written should say so out loud, every time, rather than letting
 * "a map of mathematics" stand unqualified.
 *
 * Run: node tests/atlas.mjs        (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'atlas-'))

/**
 * Same tolerant build as tests/concepts-logic.mjs, and duplicated knowingly.
 *
 * tsc exits non-zero here and that is expected: `types.ts` and `registry.ts`
 * import `@/lib/correlate/scope` for a type, the path alias is not configured
 * in this bare invocation, and the import is `import type` so it is erased from
 * the emit anyway. Two TS2307 lines, no missing output. Only an absent emit is
 * fatal, which is what the require below would report.
 */
function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  const entries = [
    join('lib', 'concepts', 'atlas.ts'),
    join('lib', 'concepts', 'ontology.ts'),
    join('lib', 'concepts', 'registry.ts'),
  ]
  try {
    execFileSync(process.execPath, [
      tsc, ...entries,
      '--outDir', outDir,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--rootDir', join(FRONTEND, 'lib'),
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim()) console.error(out.trim())
  }
}

build()
const req = createRequire(import.meta.url)
writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }))

const atlas = req(join(outDir, 'concepts', 'atlas.js'))
const registry = req(join(outDir, 'concepts', 'registry.js'))
const ontology = req(join(outDir, 'concepts', 'ontology.js'))

const {
  AREAS, MATHEMATICS, areaOntology, atlasCoverage, areaOf, shippedAtlasProblems,
} = atlas
const {
  ontologyProblems, cycles, prerequisitesOf, gatingPrerequisitesOf, isTeachable, roots,
  teachingOrder,
} = registry
const { ONTOLOGIES } = ontology

let pass = 0
const failures = []
function t(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { failures.push(name); console.log(`  ✗ ${name}${extra ? ` :: ${extra}` : ''}`) }
}
const group = name => console.log(`\n${name}`)

// ---------------------------------------------------------------------------

group('the composed atlas is a valid ontology')

const problems = ontologyProblems(MATHEMATICS)
t('it has no structural problems', problems.length === 0, problems.slice(0, 8).join(' | '))

const atlasOwn = shippedAtlasProblems()
t('no node shadows an authored concept and no node is declared twice',
  atlasOwn.length === 0, atlasOwn.slice(0, 5).join(' | '))

const loops = cycles(MATHEMATICS)
t('the prerequisite graph is acyclic', loops.length === 0,
  loops.slice(0, 3).map(l => l.join(' → ')).join(' | '))

t('every concept is reachable in a teaching order',
  teachingOrder(MATHEMATICS).length === MATHEMATICS.concepts.length,
  `${teachingOrder(MATHEMATICS).length} of ${MATHEMATICS.concepts.length}`)

// ---------------------------------------------------------------------------

group('an area in isolation is also valid')

for (const area of AREAS) {
  const areaProblems = ontologyProblems(areaOntology(area))
  t(`${area.id} on its own`, areaProblems.length === 0, areaProblems.slice(0, 4).join(' | '))
}

// ---------------------------------------------------------------------------

group('the two halves are one graph')

/**
 * The point of the whole exercise. If no mapped node names an authored concept
 * as a prerequisite, the map and the syllabi are two disconnected drawings and
 * mastering the authored material opens nothing.
 */
const authoredIds = new Set(ONTOLOGIES.flatMap(o => o.concepts.map(c => c.id)))
const edgesFromAuthoredToMap = MATHEMATICS.edges.filter(
  e => e.kind === 'prerequisite' && authoredIds.has(e.from) && !authoredIds.has(e.to),
)
t('mapped nodes rest on authored concepts', edgesFromAuthoredToMap.length > 0,
  `${edgesFromAuthoredToMap.length} such edges`)

const edgesFromMapToAuthored = MATHEMATICS.edges.filter(
  e => e.kind === 'prerequisite' && !authoredIds.has(e.from) && authoredIds.has(e.to),
)
t('authored concepts rest on mapped ones, so the syllabi are not roots of mathematics',
  edgesFromMapToAuthored.length > 0, `${edgesFromMapToAuthored.length} such edges`)

t('every authored concept still exists in the composed graph with its material intact',
  [...authoredIds].every(id => isTeachable(MATHEMATICS, id)),
  [...authoredIds].filter(id => !isTeachable(MATHEMATICS, id)).join(', '))

// ---------------------------------------------------------------------------

group('the map cannot block a learner')

/**
 * The invariant that makes an unwritten map safe to ship. Every mapped node has
 * strength 0 forever, so if one could gate, everything behind it would be
 * permanently unreachable — and nearly all of mathematics now sits behind one.
 */
const unteachableGates = MATHEMATICS.concepts.flatMap(c =>
  gatingPrerequisitesOf(MATHEMATICS, c.id)
    .filter(g => !isTeachable(MATHEMATICS, g))
    .map(g => `${c.id} gated by unteachable ${g}`))
t('no concept is gated by something with no problems written for it',
  unteachableGates.length === 0, unteachableGates.slice(0, 5).join(' | '))

/**
 * A concrete instance, named rather than quantified, so a regression says what
 * broke. `integration-partial-fractions` sits behind the authored partial
 * fractions concept and behind a long mapped chain; the mapped part must
 * disappear from its gating list entirely.
 */
const ipf = 'integration-partial-fractions'
t(`${ipf} is drawn as resting on a mapped chain`,
  prerequisitesOf(MATHEMATICS, ipf).some(p => !isTeachable(MATHEMATICS, p)))
t(`…but is gated only by authored material`,
  gatingPrerequisitesOf(MATHEMATICS, ipf).length > 0
  && gatingPrerequisitesOf(MATHEMATICS, ipf).every(g => isTeachable(MATHEMATICS, g)),
  gatingPrerequisitesOf(MATHEMATICS, ipf).join(', '))

// ---------------------------------------------------------------------------

group('editorial standards')

const noDescription = MATHEMATICS.concepts.filter(c => !c.name.trim())
t('every concept has a name', noDescription.length === 0)

const mappedRoots = roots(MATHEMATICS).filter(id => !isTeachable(MATHEMATICS, id))
t('the roots of the map are few — a root is a claim that nothing comes before it',
  mappedRoots.length <= 4, `${mappedRoots.length}: ${mappedRoots.join(', ')}`)

const interference = MATHEMATICS.edges.filter(e => e.kind === 'interferes_with')
t('every interference states a reason', interference.every(e => !!e.rationale))

const singletons = AREAS.filter(a => a.nodes.length < 5)
t('no area is a stub', singletons.length === 0, singletons.map(a => a.id).join(', '))

// `promotedBy` is what distinguishes a real edge from a quarantined candidate.
const mapEdges = MATHEMATICS.edges.filter(e => !authoredIds.has(e.from) || !authoredIds.has(e.to))
t('every atlas edge names who promoted it', mapEdges.every(e => !!e.promotedBy))

t('the atlas proposes no unreviewed candidate edges',
  MATHEMATICS.edges.filter(e => e.kind === 'candidate_prerequisite' && !authoredIds.has(e.from)).length === 0)

// ---------------------------------------------------------------------------

const cov = atlasCoverage(MATHEMATICS)
console.log(`\ncoverage — and it is meant to look small`)
console.log(`  areas:              ${cov.areas}`)
console.log(`  concepts:           ${cov.concepts}`)
console.log(`  teachable:          ${cov.teachable} (${Math.round(100 * cov.teachable / cov.concepts)}%)`)
console.log(`  prerequisite edges: ${cov.prerequisiteEdges}`)
console.log(`  crossing an area:   ${cov.crossAreaEdges}`)
console.log(`  interferences:      ${interference.length}`)
console.log(`  deepest chain:      ${teachingOrder(MATHEMATICS).length > 0 ? maxDepth() : 0} concepts`)

function maxDepth() {
  const memo = new Map()
  const depth = id => {
    if (memo.has(id)) return memo.get(id)
    memo.set(id, 0)
    const d = prerequisitesOf(MATHEMATICS, id).reduce((m, p) => Math.max(m, 1 + depth(p)), 0)
    memo.set(id, d)
    return d
  }
  return 1 + Math.max(...MATHEMATICS.concepts.map(c => depth(c.id)))
}

console.log('\nper area')
for (const row of cov.byArea.sort((a, b) => b.concepts - a.concepts)) {
  console.log(`  ${String(row.concepts).padStart(3)}  ${String(row.teachable).padStart(2)} written  ${row.id}`)
}

rmSync(outDir, { recursive: true, force: true })
console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length > 0) process.exit(1)
