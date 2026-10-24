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
  teachingOrder, claimableChainFor, dependentsOf, allPrerequisitesOf,
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

/**
 * AUTHORING ARITHMETIC TIGHTENED THE GATE, AND THIS IS WHERE THAT IS CHECKED.
 *
 * It belongs here rather than in concepts-logic.mjs because the gates run
 * through `algebra-foundations.links`, and those edges exist only in the
 * composed map.
 *
 * Before ontology-arithmetic.ts, `polynomial-arithmetic` and `exponent-rules`
 * were introducible on a cold account: everything behind them was mapped-only,
 * so `gatingPrerequisitesOf` looked through the lot and returned nothing. The
 * first thing /learn could serve was expanding a product of binomials. Now the
 * five arithmetic concepts are teachable and therefore gate.
 *
 * This is the test that notices if a later edit un-authors, renames or
 * re-mapped one of the five — the symptom would be the algebra subjects
 * quietly becoming entry points again, which looks like nothing at all from
 * the outside.
 */
group('authoring arithmetic tightened the gate on the algebra subjects')

const COLD = {}
t('exponent rules now gate on integer arithmetic',
  gatingPrerequisitesOf(MATHEMATICS, 'exponent-rules').includes('integer-arithmetic'),
  gatingPrerequisitesOf(MATHEMATICS, 'exponent-rules').join(', '))
t('polynomial arithmetic now gates on order of operations and signed numbers', (() => {
  const g = gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic')
  return g.includes('order-of-operations') && g.includes('negative-numbers')
})(), gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic').join(', '))
t('every gate named is a concept the learner can actually go and practise',
  ['exponent-rules', 'polynomial-arithmetic', 'combining-rational'].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).every(p => isTeachable(MATHEMATICS, p))))
t('place value is a root of the whole map, and was not teachable before',
  roots(MATHEMATICS).includes('place-value') && isTeachable(MATHEMATICS, 'place-value'))
t('the five authored ids appear exactly once each in the composed concept list',
  ['place-value', 'integer-arithmetic', 'order-of-operations', 'negative-numbers', 'divisibility']
    .every(id => MATHEMATICS.concepts.filter(c => c.id === id).length === 1))
t('and they carry their own subject, not the area they left',
  MATHEMATICS.concepts.filter(c => c.subjectId === 'arithmetic-foundations').length === 5)
t('the nodes that used to need them still do, across the file boundary',
  prerequisitesOf(MATHEMATICS, 'absolute-value').includes('negative-numbers')
  && prerequisitesOf(MATHEMATICS, 'prime-factorisation').includes('divisibility'))

// ---------------------------------------------------------------------------

/**
 * `claimableChainFor` — what one "I already know this" covers.
 *
 * Checked on the composed map because that is the ontology the claims route
 * walks, and the cross-subject reach is the entire point: a chain confined to
 * one subject would claim none of the arithmetic beneath an algebra concept,
 * which is exactly the part somebody saying "I know this" means.
 */
group('a chain claim walks down, across subjects, and only over material')

const chainFor = id => claimableChainFor(MATHEMATICS, id)

t('the concept itself heads its own chain', chainFor('partial-fractions-linear')[0] === 'partial-fractions-linear')
t('every concept in a chain is teachable — an unclaimable row is never proposed',
  MATHEMATICS.concepts.every(c => chainFor(c.id).every(id => isTeachable(MATHEMATICS, id))))

/**
 * DOWNWARDS. The direction is the safety property: claiming a root must not
 * assert knowledge of everything built on it.
 */
t('a chain contains no dependent of its own concept', (() => {
  const chain = new Set(chainFor('integer-arithmetic'))
  return dependentsOf(MATHEMATICS, 'integer-arithmetic').every(d => !chain.has(d))
})())
t('claiming place value claims only place value — nothing rests beneath it',
  chainFor('place-value').length === 1)
/**
 * Stated as "every teachable concept except itself" rather than a literal
 * count, so authoring a fifth subject does not fail an assertion that was
 * never about the number. The claim is about DIRECTION: place value is the
 * root of the whole map, so a downward walk from it reaches nothing, however
 * much is written above.
 */
t('and does NOT reach any of the teachable concepts above it', (() => {
  const teachable = MATHEMATICS.concepts.filter(c => isTeachable(MATHEMATICS, c.id)).length
  return chainFor('place-value').length === 1 && teachable > 1
})(), `${MATHEMATICS.concepts.filter(c => isTeachable(MATHEMATICS, c.id)).length} teachable, chain=${chainFor('place-value').length}`)

/**
 * The cross-subject reach, named concept by concept rather than counted. These
 * are the edges that only exist in the composed map, via
 * `algebra-foundations.links`.
 */
t('exponent rules reach down into arithmetic', (() => {
  const chain = chainFor('exponent-rules')
  return chain.includes('integer-arithmetic') && chain.includes('place-value')
})(), chainFor('exponent-rules').join(', '))
t('combining rational expressions reaches arithmetic through the fractions link', (() => {
  const chain = chainFor('combining-rational')
  // `fraction-arithmetic` is the link's own endpoint and is mapped-only, so it
  // must NOT appear — but the walk has to pass THROUGH it to the arithmetic
  // below, which is the behaviour `gatingPrerequisitesOf` could not give us.
  return !chain.includes('fraction-arithmetic')
    && chain.includes('divisibility') && chain.includes('integer-arithmetic')
})(), chainFor('combining-rational').join(', '))
t('a chain spans more than one subject, which is why rows are filed per concept',
  new Set(chainFor('partial-fractions-linear')
    .map(id => MATHEMATICS.concepts.find(c => c.id === id).subjectId)).size > 1,
  [...new Set(chainFor('partial-fractions-linear')
    .map(id => MATHEMATICS.concepts.find(c => c.id === id).subjectId))].join(', '))

/**
 * A chain on a mapped-only node is empty rather than partial.
 *
 * `integration-partial-fractions` has nothing written for it, so the node
 * itself is dropped — but everything it rests on is authored, so an
 * unteachable-aware walk still has plenty to return. Asserting the node is
 * absent while its ancestors are present is what distinguishes "filter the
 * list" from "refuse the walk".
 */
t('a mapped-only node is dropped from its own chain but its ancestors are not', (() => {
  const chain = chainFor('integration-partial-fractions')
  return !chain.includes('integration-partial-fractions')
    && chain.includes('partial-fractions-linear')
})(), chainFor('integration-partial-fractions').join(', '))

t('no chain contains a duplicate', MATHEMATICS.concepts.every(c => {
  const chain = chainFor(c.id)
  return new Set(chain).size === chain.length
}))
t('every chain terminates — the map is acyclic and the walk carries a seen set',
  MATHEMATICS.concepts.every(c => chainFor(c.id).length <= MATHEMATICS.concepts.length))

/**
 * The chain is prerequisite-closed over teachable concepts.
 *
 * The property that makes it correct: if a concept is in the chain, everything
 * teachable that IT rests on is in the chain too. A walk that missed a branch
 * would leave a claimed concept gated behind an unclaimed one, so the learner
 * would press the button and still be blocked — the failure mode that looks
 * like the feature not working at all.
 */
t('a chain is closed under teachable prerequisites', MATHEMATICS.concepts.every(c => {
  const chain = new Set(chainFor(c.id))
  return [...chain].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).every(p => chain.has(p)))
}))

// ---------------------------------------------------------------------------

/**
 * AUTHORING ABOVE THE ALGEBRA GATED NOTHING ANYBODY CAN PRACTISE.
 *
 * The first version of this group asserted that it gated nothing AT ALL, and
 * that was wrong — the test is what found it. `graphs-of-functions` rests on
 * `domain-and-range`, so making that teachable gates the graph node and
 * transitively every one of the ~170 nodes above it, which is most of the map.
 *
 * The claim that survives is narrower and is the one that matters to a
 * learner: everything that gained a gate is mapped-only, with no task to
 * serve, so no session changes. Asserted over TEACHABLE concepts, which is
 * exactly the set that can appear in an assembly.
 *
 * Stated as a property over every concept rather than a spot-check, so it
 * keeps holding as more is authored — and it will start failing honestly the
 * day somebody authors `graphs-of-functions` without meaning to gate the
 * algebra, which is the kind of mistake worth a loud failure.
 */
group('authoring functions gated nothing anybody can practise')

const FN_IDS = new Set(
  MATHEMATICS.concepts.filter(c => c.subjectId === 'functions-and-inverses').map(c => c.id),
)
/**
 * Stated against the subjects that EXISTED when functions was authored.
 *
 * The first version asserted that no teachable concept anywhere gates on
 * functions, and it went red the moment `matrices-and-determinants` was
 * authored — because matrices rests on `function-concept` and
 * `function-composition` deliberately, by links written on purpose. The test
 * was right to fail; the claim was just the wrong shape. "Nothing teachable
 * depends on this" is a fact about a moment, and any later subject built on
 * functions falsifies it while doing exactly what it should.
 *
 * The durable claim is about what came BEFORE: authoring functions must not
 * have reached back and gated the arithmetic or the two algebra syllabi,
 * because those are what people were already practising. Material authored
 * afterwards resting on functions is the map working.
 */
const PRE_EXISTING = ['arithmetic-foundations', 'rational-expressions', 'exponents-and-logarithms']
const regressed = MATHEMATICS.concepts
  .filter(c => PRE_EXISTING.includes(c.subjectId))
  .filter(c => gatingPrerequisitesOf(MATHEMATICS, c.id).some(p => FN_IDS.has(p)))

t('the subject contributes four concepts to the map', FN_IDS.size === 4, `${FN_IDS.size}`)
t('nothing that existed before it gained a gate on it',
  regressed.length === 0, regressed.map(c => c.id).join(', '))
t('the gates it created reach mapped nodes and later subjects, never backwards', (() => {
  const gained = MATHEMATICS.concepts
    .filter(c => !FN_IDS.has(c.id))
    .filter(c => gatingPrerequisitesOf(MATHEMATICS, c.id).some(p => FN_IDS.has(p)))
  return gained.length > 0 && gained.every(c => !PRE_EXISTING.includes(c.subjectId))
})(), 'expected gates on mapped nodes and on matrices, and none on the three older subjects')
t('the algebra subjects gate exactly as they did — on arithmetic, not functions', (() => {
  const g = gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic')
  return g.includes('order-of-operations') && g.includes('negative-numbers')
    && g.every(p => !FN_IDS.has(p))
})(), gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic').join(', '))

/**
 * The other direction: the subject is connected to what is below it. A
 * syllabus authored above the map but joined to nothing would be practisable
 * from a cold account, which would make it a second entry point rather than a
 * continuation.
 */
/**
 * A non-empty gating set of TEACHABLE concepts is exactly "not introducible on
 * a cold account" — `introducible` is every gate at or above the mastery
 * floor, and on an empty strength table every one of them is at zero. Asserted
 * that way rather than by calling the scheduler, which this harness does not
 * build.
 */
t('but functions itself IS gated, reaching down into arithmetic', (() => {
  const g = gatingPrerequisitesOf(MATHEMATICS, 'function-concept')
  return g.length > 0 && g.every(p => isTeachable(MATHEMATICS, p))
})(), gatingPrerequisitesOf(MATHEMATICS, 'function-concept').join(', '))

t('the nodes left in the functions area still reach the authored ones',
  prerequisitesOf(MATHEMATICS, 'graphs-of-functions').includes('domain-and-range'),
  prerequisitesOf(MATHEMATICS, 'graphs-of-functions').join(', '))
t('and a chain from a graph node now reaches real material', (() => {
  const chain = claimableChainFor(MATHEMATICS, 'rational-functions')
  return chain.includes('domain-and-range') && chain.includes('function-concept')
})(), claimableChainFor(MATHEMATICS, 'rational-functions').join(', '))

// ---------------------------------------------------------------------------

/**
 * VECTORS WENT UNDERNEATH TEACHABLE MATERIAL, AND THAT IS THE POINT.
 *
 * Functions and matrices were authored above the algebra and gated only
 * mapped-only nodes. This subject is the first since arithmetic to go BELOW
 * something people can already practise: `matrices-and-maps` rests on
 * `vectors-and-spans` by a link written when matrices was authored, so making
 * vectors teachable puts a real gate under a real subject.
 *
 * Asserted rather than assumed, because the whole value of the link is that it
 * starts gating the day the material exists — and a silent failure here looks
 * like nothing at all: matrices would simply stay open and nobody would learn
 * that vectors came first.
 */
group('vectors gated matrices, which is what authoring underneath means')

const VEC_IDS = new Set(
  MATHEMATICS.concepts.filter(c => c.subjectId === 'vectors-and-independence').map(c => c.id),
)
t('the subject contributes three concepts', VEC_IDS.size === 3, `${VEC_IDS.size}`)
t('matrices now gates on vectors, not through them',
  gatingPrerequisitesOf(MATHEMATICS, 'matrices-and-maps').includes('vectors-and-spans'),
  gatingPrerequisitesOf(MATHEMATICS, 'matrices-and-maps').join(', '))
t('and the gate it names is teachable, so it is somewhere to go',
  gatingPrerequisitesOf(MATHEMATICS, 'matrices-and-maps').every(p => isTeachable(MATHEMATICS, p)))

/**
 * The same backwards check the functions group makes: authoring must not reach
 * back and gate the subjects that existed before it.
 */
const BEFORE_VECTORS = [
  'arithmetic-foundations', 'rational-expressions', 'exponents-and-logarithms',
  'functions-and-inverses',
]
t('nothing authored before it gained a gate on it', MATHEMATICS.concepts
  .filter(c => BEFORE_VECTORS.includes(c.subjectId))
  .every(c => gatingPrerequisitesOf(MATHEMATICS, c.id).every(p => !VEC_IDS.has(p))),
  MATHEMATICS.concepts
    .filter(c => BEFORE_VECTORS.includes(c.subjectId))
    .filter(c => gatingPrerequisitesOf(MATHEMATICS, c.id).some(p => VEC_IDS.has(p)))
    .map(c => c.id).join(', '))

/**
 * NO CYCLE THROUGH THE CROSS-CHECK.
 *
 * `the-cross-check` IS the 2×2 determinant and says so, but no prerequisite
 * edge was drawn to `determinant` — one would close a loop through
 * `matrices-and-maps` and `matrix-multiplication`, and `teachingOrder` returns
 * null on a cyclic ontology rather than a partial order, so every subject
 * would lose its ordering to record a piece of foreshadowing.
 *
 * The acyclicity assertion at the top of this file would catch the cycle; this
 * names the specific edge somebody will one day be tempted to add.
 */
t('linear-independence does not depend on the determinant',
  !allPrerequisitesOf(MATHEMATICS, 'linear-independence').includes('determinant'),
  allPrerequisitesOf(MATHEMATICS, 'linear-independence').join(', '))
t('and the teaching order still exists, so nothing has cycled',
  teachingOrder(MATHEMATICS) !== null)

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
