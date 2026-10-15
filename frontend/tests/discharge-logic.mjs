#!/usr/bin/env node
/**
 * Unit checks for prerequisite discharge.
 *
 * Same harness as tests/concepts-logic.mjs and for the same reason: the module is
 * TypeScript, so it is transpiled to CommonJS in a temp dir with the project's own
 * `typescript` devDependency and required from there. This works only because
 * lib/queries/discharge.ts imports nothing at all — which is precisely why the
 * traversal was split out of knowledge-graph.ts, whose runtime `import { supabase }`
 * puts it out of reach.
 *
 * WHAT IS COVERED: the three bounds that make rewriting a date tolerable
 * (extend-only, never past the dependent, and that ordering the two clamps the
 * other way round would shorten), distance decay, the visited-set over a cycle —
 * which is load-bearing since migration 65 permits cycles — shortest-distance
 * crediting when a node is reachable by two paths, the depth cap, and that an
 * unmastered middle node takes no credit without severing the chain behind it.
 *
 * WHAT IS NOT HERE: the database half. dischargePrerequisites issues queries and
 * is covered by nothing; its risk is two selects and a loop of updates, and the
 * decision it defers to is what is tested here.
 *
 * Run: node tests/discharge-logic.mjs        (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'discharge-logic-'))

function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  // --rootDir at lib/, matching tests/concepts-logic.mjs, so the output keeps a
  // queries/ subdirectory instead of tsc collapsing a single input to the root.
  execFileSync(process.execPath, [
    tsc, join('lib', 'queries', 'discharge.ts'),
    '--outDir', outDir,
    '--module', 'commonjs',
    '--target', 'es2020',
    '--moduleResolution', 'node',
    '--esModuleInterop',
    '--skipLibCheck',
    '--rootDir', join(FRONTEND, 'lib'),
  ], { cwd: FRONTEND, stdio: 'inherit' })
}

build()
const require_ = createRequire(import.meta.url)
const { planDischarge } = require_(join(outDir, 'queries', 'discharge.js'))

let failures = 0
function check(name, cond, detail) {
  if (cond) { console.log(`  ok   ${name}`) }
  else { console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); failures++ }
}

const DAY = 86400_000
const NOW = Date.UTC(2026, 0, 10)          // fixed; no Date.now() in assertions
const iso = ms => new Date(ms).toISOString()
const days = n => n * DAY

/** Chain: 1 <- 2 <- 3 <- 4 <- 5  (1 is the deepest prerequisite, 5 the dependent) */
const CHAIN = [
  { from_node: 1, to_node: 2 },
  { from_node: 2, to_node: 3 },
  { from_node: 3, to_node: 4 },
  { from_node: 4, to_node: 5 },
]
const mastered = (id, nextMs) => ({ id, next_review_at: iso(nextMs), mastered: true })

console.log('\ndistance decay')
{
  // intervalDays 16, decay 0.5 → d1 = 8d, d2 = 4d, d3 = 2d, d4 = 1d.
  // All prerequisites currently due immediately, ceiling far away.
  const writes = planDischarge({
    startId: 5,
    edges: CHAIN,
    candidates: [1, 2, 3, 4].map(id => mastered(id, NOW)),
    intervalDays: 16,
    dependentNextReviewAt: iso(NOW + days(16)),
    now: NOW,
  })
  const at = d => writes.find(w => w.distance === d)
  check('credits all four levels', writes.length === 4, `got ${writes.length}`)
  check('d1 gets half the interval (8d)', at(1)?.newNextReviewAt === iso(NOW + days(8)), at(1)?.newNextReviewAt)
  check('d2 gets a quarter (4d)', at(2)?.newNextReviewAt === iso(NOW + days(4)), at(2)?.newNextReviewAt)
  check('d3 gets an eighth (2d)', at(3)?.newNextReviewAt === iso(NOW + days(2)), at(3)?.newNextReviewAt)
  check('d4 gets a sixteenth (1d)', at(4)?.newNextReviewAt === iso(NOW + days(1)), at(4)?.newNextReviewAt)
  check('nearest prerequisite is node 4', at(1)?.nodeId === 4, String(at(1)?.nodeId))
  check('start node is never credited', !writes.some(w => w.nodeId === 5))
}

console.log('\nbound 1: extend only, never shorten')
{
  // Node 4 is already scheduled 30 days out; credit would put it at 8 days.
  const writes = planDischarge({
    startId: 5, edges: CHAIN,
    candidates: [mastered(4, NOW + days(30))],
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(100)), now: NOW,
  })
  check('a further-out review is left alone', writes.length === 0, JSON.stringify(writes))
}

console.log('\nbound 2: never past the dependent')
{
  // Credit would be 8 days, but the dependent is due in 3 — so cap at 3.
  const writes = planDischarge({
    startId: 5, edges: CHAIN,
    candidates: [mastered(4, NOW)],
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(3)), now: NOW,
  })
  check('clamped to the dependent', writes[0]?.newNextReviewAt === iso(NOW + days(3)), writes[0]?.newNextReviewAt)
}

console.log('\nthe two clamps compose in the right order')
{
  // Already 30 days out, dependent due in 3. Clamping to the ceiling FIRST would
  // pull it back from 30 to 3 — a shortening, and the bug the comment warns of.
  const writes = planDischarge({
    startId: 5, edges: CHAIN,
    candidates: [mastered(4, NOW + days(30))],
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(3)), now: NOW,
  })
  check('beyond-ceiling review is NOT pulled back', writes.length === 0, JSON.stringify(writes))
}

console.log('\ncycles terminate and credit once (migration 65 permits them)')
{
  // 1 <-> 2 mutual, plus 2 <- 3 dependent.
  const edges = [
    { from_node: 1, to_node: 2 },
    { from_node: 2, to_node: 1 },
    { from_node: 2, to_node: 3 },
  ]
  const writes = planDischarge({
    startId: 3, edges,
    candidates: [mastered(1, NOW), mastered(2, NOW)],
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(100)), now: NOW,
  })
  check('terminates', true)
  check('each cycle member credited exactly once',
    writes.filter(w => w.nodeId === 1).length === 1 && writes.filter(w => w.nodeId === 2).length === 1,
    JSON.stringify(writes))
  check('node 2 at distance 1', writes.find(w => w.nodeId === 2)?.distance === 1)
  check('node 1 at distance 2', writes.find(w => w.nodeId === 1)?.distance === 2)
}

console.log('\nself-cycle through the start node cannot credit the start')
{
  const edges = [{ from_node: 2, to_node: 1 }, { from_node: 1, to_node: 2 }]
  const writes = planDischarge({
    startId: 1, edges,
    candidates: [mastered(1, NOW), mastered(2, NOW)],
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(100)), now: NOW,
  })
  check('start excluded even though a cycle returns to it', !writes.some(w => w.nodeId === 1), JSON.stringify(writes))
  check('the other member still credited', writes.some(w => w.nodeId === 2))
}

console.log('\ndiamond: shortest distance wins')
{
  // 1 is a prerequisite of both 2 and 3; both feed 4. Node 1 is reachable at
  // distance 2 by either path and must be credited once, at 2.
  const edges = [
    { from_node: 1, to_node: 2 }, { from_node: 1, to_node: 3 },
    { from_node: 2, to_node: 4 }, { from_node: 3, to_node: 4 },
  ]
  const writes = planDischarge({
    startId: 4, edges,
    candidates: [1, 2, 3].map(id => mastered(id, NOW)),
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(100)), now: NOW,
  })
  const one = writes.filter(w => w.nodeId === 1)
  check('node 1 credited once', one.length === 1, JSON.stringify(one))
  check('at distance 2', one[0]?.distance === 2, String(one[0]?.distance))
}

console.log('\ndepth cap')
{
  const edges = []
  for (let i = 1; i < 12; i++) edges.push({ from_node: i, to_node: i + 1 })
  const candidates = []
  for (let i = 1; i <= 12; i++) candidates.push(mastered(i, NOW))
  const writes = planDischarge({
    startId: 12, edges, candidates,
    intervalDays: 1024, dependentNextReviewAt: iso(NOW + days(5000)), now: NOW,
  })
  check('stops at maxDepth (4)', writes.length === 4, `got ${writes.length}`)
  check('deepest credited distance is 4', Math.max(...writes.map(w => w.distance)) === 4)
}

console.log('\nunmastered nodes take no credit but do not sever the chain')
{
  const writes = planDischarge({
    startId: 5, edges: CHAIN,
    candidates: [
      { id: 4, next_review_at: iso(NOW), mastered: false },   // middle, unmastered
      mastered(3, NOW),
      mastered(2, NOW),
    ],
    intervalDays: 16, dependentNextReviewAt: iso(NOW + days(100)), now: NOW,
  })
  check('unmastered node 4 not written', !writes.some(w => w.nodeId === 4), JSON.stringify(writes))
  check('node 3 behind it still credited', writes.some(w => w.nodeId === 3 && w.distance === 2))
  check('node 2 further behind still credited', writes.some(w => w.nodeId === 2 && w.distance === 3))
}

console.log('\ndegenerate input')
{
  check('no edges → no writes',
    planDischarge({ startId: 1, edges: [], candidates: [mastered(2, NOW)], intervalDays: 16, dependentNextReviewAt: iso(NOW + days(9)), now: NOW }).length === 0)
  check('unparseable dependent date → no writes',
    planDischarge({ startId: 5, edges: CHAIN, candidates: [mastered(4, NOW)], intervalDays: 16, dependentNextReviewAt: 'not a date', now: NOW }).length === 0)
  check('zero interval → nothing to credit',
    planDischarge({ startId: 5, edges: CHAIN, candidates: [mastered(4, NOW)], intervalDays: 0, dependentNextReviewAt: iso(NOW + days(9)), now: NOW }).length === 0)
}

rmSync(outDir, { recursive: true, force: true })
console.log(failures === 0 ? '\nAll discharge checks passed.\n' : `\n${failures} check(s) FAILED.\n`)
process.exit(failures === 0 ? 0 : 1)
