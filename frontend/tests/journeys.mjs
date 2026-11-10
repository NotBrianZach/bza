#!/usr/bin/env node
/**
 * Checks on learning journeys — both halves, because they fail differently.
 *
 * A journey is two things at once: a hand-authored document that refers to
 * concepts by string id, and a resolver that turns a destination into an
 * ordered path with progress on it. The document fails by typo and the
 * resolver fails by logic, so both are covered here rather than trusting the
 * atlas suite to notice a journey pointing at nothing.
 *
 * The logic half runs against a SYNTHETIC graph. That is deliberate: the real
 * atlas moves, and an assertion like "this journey has nine steps" would be a
 * test of today's content rather than of the walk. The content assertions are
 * the ones that must hold for ANY content — every id resolves, every
 * destination is teachable, every milestone is on its own route.
 *
 * Run: node tests/journeys.mjs      (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'journeys-'))

/**
 * Same tolerant build as tests/atlas.mjs, for the same reason.
 *
 * tsc exits non-zero because `types.ts` and `registry.ts` import
 * `@/lib/correlate/scope` for a type and the alias is not configured in this
 * bare invocation. The import is `import type`, so it is erased from the emit
 * and nothing is missing. Only an absent emit is fatal, which the require
 * below would report.
 */
function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [
      tsc,
      join('lib', 'concepts', 'journeys.ts'),
      join('lib', 'concepts', 'atlas.ts'),
      join('lib', 'concepts', 'ontology.ts'),
      join('lib', 'concepts', 'registry.ts'),
      join('lib', 'concepts', 'offerings.ts'),
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

const J = req(join(outDir, 'concepts', 'journeys.js'))
const { MATHEMATICS } = req(join(outDir, 'concepts', 'atlas.js'))
const R = req(join(outDir, 'concepts', 'registry.js'))

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

const FLOOR = 0.8

// ═══════════════════════════════════════════════════════════════════════════
// The document: the shipped journeys against the real atlas
// ═══════════════════════════════════════════════════════════════════════════

test('the shipped journeys have no editorial faults', () => {
  const problems = J.journeyProblems(MATHEMATICS, J.JOURNEYS)
  assert(problems.length === 0, `\n    ${problems.join('\n    ')}`)
})

test('every journey ends somewhere a learner can arrive', () => {
  // The one that makes a journey a goal rather than a gesture. A destination
  // with no knowledge points can never be completed by anybody.
  for (const j of J.JOURNEYS) {
    assert(R.isTeachable(MATHEMATICS, j.destination), `${j.id} ends at unteachable ${j.destination}`)
  }
})

test('every journey resolves to at least two steps', () => {
  // One step is not a path. If a destination's chain collapses to itself the
  // journey is a single problem set wearing a narrative.
  for (const j of J.JOURNEYS) {
    const r = J.resolveJourney(MATHEMATICS, j, [], FLOOR)
    assert(r.total >= 2, `${j.id} resolved to ${r.total} step(s)`)
  }
})

test('the shipped set spans short and long', () => {
  // The ask was short AND medium term goals. A list where everything is a
  // fourteen-step commitment has no short term in it, and that is a content
  // regression a count catches and prose does not.
  const lengths = J.JOURNEYS.map(j => J.resolveJourney(MATHEMATICS, j, [], FLOOR).total)
  assert(Math.min(...lengths) <= 4, `nothing short: shortest is ${Math.min(...lengths)}`)
  assert(Math.max(...lengths) >= 8, `nothing substantial: longest is ${Math.max(...lengths)}`)
})

test('milestones appear in the resolved steps, in order', () => {
  // `journeyProblems` checks a milestone is on the route; this checks it
  // actually surfaces, which is a different failure — a milestone attached to
  // a step the resolver dropped would silently vanish from the UI.
  for (const j of J.JOURNEYS) {
    const r = J.resolveJourney(MATHEMATICS, j, [], FLOOR)
    const found = r.steps.filter(s => s.milestone).map(s => s.conceptId)
    for (const m of j.milestones) {
      assert(found.includes(m.conceptId), `${j.id}: milestone ${m.conceptId} did not surface`)
    }
    // The last milestone should be the destination, or the arc ends before
    // the journey does.
    eq(j.milestones[j.milestones.length - 1].conceptId, j.destination,
      `${j.id}: last milestone should be the destination`)
  }
})

test('steps respect prerequisite order', () => {
  // The promise the derived path makes. If a step appeared before something it
  // rests on, the journey would be unwalkable in the order it printed.
  for (const j of J.JOURNEYS) {
    const r = J.resolveJourney(MATHEMATICS, j, [], FLOOR)
    const at = new Map(r.steps.map((s, i) => [s.conceptId, i]))
    for (const s of r.steps) {
      for (const p of R.prerequisitesOf(MATHEMATICS, s.conceptId)) {
        if (!at.has(p)) continue
        assert(at.get(p) < at.get(s.conceptId),
          `${j.id}: ${p} comes after ${s.conceptId} but gates it`)
      }
    }
  }
})

test('the unwritten stretch of each route is reported', () => {
  // 34 of 291 concepts are written, so most routes cross unwritten ground and
  // the number must be available to say. A journey reporting zero unwritten
  // concepts across a long route would mean the count had stopped working.
  const totals = J.JOURNEYS.map(j => J.resolveJourney(MATHEMATICS, j, [], FLOOR).unwrittenOnPath)
  assert(totals.every(n => Number.isInteger(n) && n >= 0), 'unwrittenOnPath must be a count')
  assert(totals.some(n => n > 0), 'no journey crosses unwritten ground — the count is probably broken')
})

// ═══════════════════════════════════════════════════════════════════════════
// The resolver, over a synthetic graph
// ═══════════════════════════════════════════════════════════════════════════

const kp = id => ({
  id: `${id}-kp`, conceptId: id, statement: 's', position: 1,
  workedExample: { problem: 'p', subgoals: [], answer: 'a' },
})
/**
 * a → b → m → c, where `m` is mapped-only.
 *
 * Edge direction is `{from: prerequisite, to: the thing it gates}` — see
 * `prerequisitesOf`, which matches on `e.to`. Writing these the other way
 * round builds the graph backwards and every assertion below then tests the
 * reverse walk, which is how this was first got wrong.
 */
const GRAPH = {
  subject: { id: 'synthetic', name: 'Synthetic', covers: '' },
  concepts: [
    { id: 'a', name: 'A', subjectId: 'synthetic', knowledgePoints: [kp('a')] },
    { id: 'b', name: 'B', subjectId: 'synthetic', knowledgePoints: [kp('b')] },
    { id: 'm', name: 'M', subjectId: 'synthetic', knowledgePoints: [] },
    { id: 'c', name: 'C', subjectId: 'synthetic', knowledgePoints: [kp('c')] },
  ],
  edges: [
    { from: 'a', to: 'b', kind: 'prerequisite' },
    { from: 'b', to: 'm', kind: 'prerequisite' },
    { from: 'm', to: 'c', kind: 'prerequisite' },
  ],
}
const SYNTH = {
  id: 'synth', title: 'T', premise: 'P', arc: 'A',
  destination: 'c',
  milestones: [{ conceptId: 'c', label: 'L', promise: 'Pr' }],
}

test('a mapped-only concept is not a step, but is counted as distance', () => {
  // The honesty guard at the centre of the module. `m` has nothing to
  // practise, so offering it as a step promises work that does not exist —
  // but pretending the route does not cross it understates the climb.
  const r = J.resolveJourney(GRAPH, SYNTH, [], FLOOR)
  eq(r.steps.map(s => s.conceptId).join(','), 'a,b,c')
  eq(r.unwrittenOnPath, 1, 'm should be counted as unwritten distance')
})

test('done counts earned strength and never a claim', () => {
  // A journey that counted claims as progress could be completed by pressing
  // buttons. `claimed` is reported, so a caller can show it — but apart.
  const r = J.resolveJourney(GRAPH, SYNTH, [
    { conceptId: 'a', strength: 0.9, introducible: true },
    { conceptId: 'b', strength: 0.1, introducible: true, claimed: true },
    { conceptId: 'c', strength: 0, introducible: false },
  ], FLOOR)
  eq(r.done, 1, 'only a is above the floor')
  eq(r.steps.find(s => s.conceptId === 'b').claimed, true, 'the claim is still reported')
  eq(r.steps.find(s => s.conceptId === 'b').done, false, 'a claim is not progress')
})

test('next is the first unfinished OPEN step', () => {
  const r = J.resolveJourney(GRAPH, SYNTH, [
    { conceptId: 'a', strength: 0.9, introducible: true },
    { conceptId: 'b', strength: 0.2, introducible: true },
    { conceptId: 'c', strength: 0, introducible: true },
  ], FLOOR)
  eq(r.next?.conceptId, 'b')
})

test('next is null when nothing unfinished is open, not the first blocked step', () => {
  // Pointing a learner at a gated concept is worse than pointing nowhere: the
  // scheduler will not serve it, so the suggestion cannot be acted on.
  const r = J.resolveJourney(GRAPH, SYNTH, [
    { conceptId: 'a', strength: 0.9, introducible: true },
    { conceptId: 'b', strength: 0, introducible: false },
    { conceptId: 'c', strength: 0, introducible: false },
  ], FLOOR)
  eq(r.next, null)
  // And the caller can still tell "finished" from "stuck" without guessing.
  eq(r.done, 1)
  eq(r.total, 3)
})

test('a concept absent from the state is unknown, not zero', () => {
  // A journey crossing into an area this session does not cover has steps
  // nobody can act on. Drawing them as "not started" invites a learner to try.
  const r = J.resolveJourney(GRAPH, SYNTH, [
    { conceptId: 'a', strength: 0.9, introducible: true },
  ], FLOOR)
  eq(r.steps.find(s => s.conceptId === 'a').unknown, false)
  eq(r.steps.find(s => s.conceptId === 'c').unknown, true)
})

test('journeyProblems catches a destination that is not in the graph', () => {
  const p = J.journeyProblems(GRAPH, [{ ...SYNTH, destination: 'nope' }])
  assert(p.some(s => /not in the graph/.test(s)), JSON.stringify(p))
  // One sentence, not a cascade of consequences of the same typo.
  eq(p.length, 1, `expected a single problem, got: ${JSON.stringify(p)}`)
})

test('journeyProblems catches an unteachable destination', () => {
  const p = J.journeyProblems(GRAPH, [{
    ...SYNTH, destination: 'm', milestones: [{ conceptId: 'm', label: 'L', promise: 'P' }],
  }])
  assert(p.some(s => /no knowledge points/.test(s)), JSON.stringify(p))
})

test('journeyProblems catches a milestone off the route', () => {
  // `a` is on c's route; a sibling that is not would promise a stage the
  // journey never reaches.
  const p = J.journeyProblems(GRAPH, [{
    ...SYNTH,
    milestones: [{ conceptId: 'b', label: 'L', promise: 'P' }, { conceptId: 'c', label: 'L', promise: 'P' }],
  }])
  eq(p.length, 0, `b IS on the route: ${JSON.stringify(p)}`)

  const graph2 = {
    ...GRAPH,
    concepts: [...GRAPH.concepts, { id: 'z', name: 'Z', subjectId: 'synthetic', knowledgePoints: [kp('z')] }],
  }
  const p2 = J.journeyProblems(graph2, [{
    ...SYNTH,
    milestones: [{ conceptId: 'z', label: 'L', promise: 'P' }, { conceptId: 'c', label: 'L', promise: 'P' }],
  }])
  assert(p2.some(s => /never passes through/.test(s)), JSON.stringify(p2))
})

test('journeyProblems catches a duplicate id and an empty arc', () => {
  const dup = J.journeyProblems(GRAPH, [SYNTH, SYNTH])
  assert(dup.some(s => /defined twice/.test(s)), JSON.stringify(dup))
  const none = J.journeyProblems(GRAPH, [{ ...SYNTH, milestones: [] }])
  assert(none.some(s => /no milestones/.test(s)), JSON.stringify(none))
})

test('byRemaining puts the nearly-finished first and the done last', () => {
  const mk = (id, done, total) => ({ journey: { id }, done, total })
  const out = J.byRemaining([
    mk('finished', 3, 3), mk('long', 0, 10), mk('nearly', 4, 5), mk('mid', 2, 6),
  ]).map(r => r.journey.id)
  eq(out.join(','), 'nearly,mid,long,finished')
})

// ── report ───────────────────────────────────────────────────────────────────

// The real figures, printed every run for the same reason tests/atlas.mjs
// prints coverage: a journey list whose routes are mostly unwritten should say
// so out loud rather than let "six learning journeys" stand unqualified.
console.log('\njourneys:')
for (const j of J.JOURNEYS) {
  const r = J.resolveJourney(MATHEMATICS, j, [], FLOOR)
  console.log(
    `  ${String(r.total).padStart(2)} steps · ${String(r.unwrittenOnPath).padStart(2)} unwritten on route`
    + ` · ${r.areas.length} area(s) — ${j.title}`,
  )
}

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
