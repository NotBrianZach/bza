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
    join('lib', 'concepts', 'offerings.ts'),
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
const offerings = req(join(outDir, 'concepts', 'offerings.js'))
const { conceptsInOffering, relatedConcepts, conceptHref } = offerings
/*
 * `tasks.js` is not in `entries` and is emitted anyway, because offerings.ts
 * now imports `isPractisable` from it and tsc follows imports. Required here
 * rather than added to the list, so the list keeps naming what this harness is
 * ABOUT — and so that if offerings ever stops needing it, this require fails
 * loudly instead of the practisable assertions below going vacuous.
 */
const { isPractisable } = req(join(outDir, 'concepts', 'tasks.js'))

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
/*
 * Stated as a two-step chain, because authoring `variables-and-expressions`
 * moved this gate down a step rather than removing it.
 *
 * `gatingPrerequisitesOf` returns the NEAREST teachable layer, not the whole
 * chain. While a letter standing for a number was mapped-only, the walk looked
 * through it and reported the arithmetic directly; now that it has material it
 * gates in its own right and is what polynomial arithmetic names. The original
 * assertion read `g.includes('order-of-operations')` and went red on exactly
 * that, correctly — the claim was the right one in the wrong shape.
 *
 * The durable claim is that the route from polynomial arithmetic down to the
 * arithmetic is unbroken and made entirely of material a learner can go and
 * practise. That survives any number of concepts being authored in between,
 * which the immediate-gate form does not.
 */
t('polynomial arithmetic gates down to order of operations and signed numbers', (() => {
  const g = gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic')
  if (!g.includes('variables-and-expressions')) return false
  const below = gatingPrerequisitesOf(MATHEMATICS, 'variables-and-expressions')
  return below.includes('order-of-operations') && below.includes('negative-numbers')
})(), `${gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic').join(', ')}`
  + ` → ${gatingPrerequisitesOf(MATHEMATICS, 'variables-and-expressions').join(', ')}`)
t('and the whole arithmetic chain is still beneath it, every step of it teachable',
  ['variables-and-expressions', 'order-of-operations', 'negative-numbers', 'integer-arithmetic',
    'place-value']
    .every(id => claimableChainFor(MATHEMATICS, 'polynomial-arithmetic').includes(id)),
  claimableChainFor(MATHEMATICS, 'polynomial-arithmetic').join(', '))
t('every gate named is a concept the learner can actually go and practise',
  ['exponent-rules', 'polynomial-arithmetic', 'combining-rational'].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).every(p => isTeachable(MATHEMATICS, p))))
t('place value is a root of the whole map, and was not teachable before',
  roots(MATHEMATICS).includes('place-value') && isTeachable(MATHEMATICS, 'place-value'))
t('the authored arithmetic ids appear exactly once each in the composed concept list',
  ['place-value', 'integer-arithmetic', 'order-of-operations', 'negative-numbers', 'divisibility',
    'fraction-arithmetic', 'prime-factorisation', 'gcd-and-lcm']
    .every(id => MATHEMATICS.concepts.filter(c => c.id === id).length === 1))
t('and they carry their own subject, not the area they left',
  MATHEMATICS.concepts.filter(c => c.subjectId === 'arithmetic-foundations').length === 8)
/*
 * The cross-boundary example moved up one level when `prime-factorisation` was
 * promoted, and the replacement is deliberately the node that used to sit
 * BESIDE it rather than another arbitrary one.
 *
 * `prime-factorisation` was the illustration here while it was a map node
 * needing an authored concept. It is authored now, so the same claim has to be
 * made about something still on the map — and `decimal-representation` names
 * both `fraction-arithmetic` and `prime-factorisation` in its own `needs`,
 * which makes it one node resting on two different promotions. That is the
 * strongest available form of "the edge survived the move".
 *
 * The edge the promotion DID strand — `divisibility → prime-factorisation`,
 * which the node itself declared — is asserted below, because it now has to be
 * carried by the subject rather than by the area.
 */
t('the nodes that used to need them still do, across the file boundary',
  prerequisitesOf(MATHEMATICS, 'absolute-value').includes('negative-numbers')
  && prerequisitesOf(MATHEMATICS, 'decimal-representation').includes('fraction-arithmetic')
  && prerequisitesOf(MATHEMATICS, 'decimal-representation').includes('prime-factorisation'),
  prerequisitesOf(MATHEMATICS, 'decimal-representation').join(', '))
t('and a promoted node\'s own needs were restated inside the subject, not dropped',
  prerequisitesOf(MATHEMATICS, 'prime-factorisation').includes('divisibility'),
  prerequisitesOf(MATHEMATICS, 'prime-factorisation').join(', '))
t('so prime factorisation is teachable and gates what the map says it gates',
  isTeachable(MATHEMATICS, 'prime-factorisation')
  && gatingPrerequisitesOf(MATHEMATICS, 'gcd-and-lcm').includes('prime-factorisation'),
  gatingPrerequisitesOf(MATHEMATICS, 'gcd-and-lcm').join(', '))
/*
 * `gcd-and-lcm` was the illustration above while it was the mapped node
 * resting on an authored one; it is authored itself now, so the claim is made
 * in the form the promotion left behind. The edge it declared on the map
 * (`needs: ['prime-factorisation']`) and the one the area used to declare on
 * its behalf (`links: gcd-and-lcm → fraction-arithmetic`) both moved into the
 * subject's own edge list, so the composed map must still show the gcd sitting
 * between the two of them, with the whole of it teachable.
 *
 * `euclidean-algorithm` is the node still on the map that needs the gcd, which
 * makes it the surviving example of a mapped node resting on authored material
 * across a file boundary — and the node is in atlas-structures.ts, which the
 * promotion did not touch.
 */
t('the gcd was promoted and kept both its edges, in both directions',
  isTeachable(MATHEMATICS, 'gcd-and-lcm')
  && prerequisitesOf(MATHEMATICS, 'gcd-and-lcm').includes('prime-factorisation')
  && prerequisitesOf(MATHEMATICS, 'fraction-arithmetic').includes('gcd-and-lcm'),
  `${prerequisitesOf(MATHEMATICS, 'gcd-and-lcm').join(', ')} → gcd-and-lcm → `
  + `${dependentsOf(MATHEMATICS, 'gcd-and-lcm').join(', ')}`)
t('and the mapped node above it still reaches it across the file boundary',
  prerequisitesOf(MATHEMATICS, 'euclidean-algorithm').includes('gcd-and-lcm')
  && gatingPrerequisitesOf(MATHEMATICS, 'euclidean-algorithm').includes('gcd-and-lcm'),
  gatingPrerequisitesOf(MATHEMATICS, 'euclidean-algorithm').join(', '))

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
  /*
   * `fraction-arithmetic` MUST now appear, and the flip is the point.
   *
   * This assertion read `!chain.includes('fraction-arithmetic')` while the
   * endpoint was mapped-only: the walk passed THROUGH it to the arithmetic
   * below and could not stop on it, because a concept with no material has
   * nothing to claim. Authoring it did not add this edge — the edge was always
   * in `ALGEBRA_FOUNDATIONS.links` — it gave the edge something to gate with.
   *
   * So the arithmetic underneath must still be reachable (it is the same walk)
   * AND the fractions concept is now a claimable step in its own right.
   */
  return chain.includes('fraction-arithmetic')
    && chain.includes('divisibility') && chain.includes('integer-arithmetic')
})(), chainFor('combining-rational').join(', '))
t('and the new gate it bites with is itself practisable', (() => {
  // The invariant that makes tightening acceptable: a learner who meets this
  // gate can go and do something about it. A gate naming a concept with no
  // problems would be a wall.
  const g = gatingPrerequisitesOf(MATHEMATICS, 'combining-rational')
  return g.includes('fraction-arithmetic') && isTeachable(MATHEMATICS, 'fraction-arithmetic')
})(), gatingPrerequisitesOf(MATHEMATICS, 'combining-rational').join(', '))
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
/*
 * The claim here is about what polynomial arithmetic does NOT gate on, so the
 * `FN_IDS` half is the load-bearing one and is unchanged. The positive half
 * now reads down the chain rather than at the immediate gate, for the reason
 * given where that gate is asserted above: `variables-and-expressions` was
 * authored between the two and `gatingPrerequisitesOf` stops at the nearest
 * teachable layer.
 */
t('the algebra subjects gate downwards onto arithmetic, and never onto functions', (() => {
  const g = gatingPrerequisitesOf(MATHEMATICS, 'polynomial-arithmetic')
  const chain = claimableChainFor(MATHEMATICS, 'polynomial-arithmetic')
  return chain.includes('order-of-operations') && chain.includes('negative-numbers')
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

// ---------------------------------------------------------------------------
/*
 * Theorems in play, linked to the graph — lib/concepts/offerings.ts.
 *
 * The thing being guarded is not "does it find matches" but "does it only claim
 * what it can establish". A trail that confidently mislabels teaches the learner
 * that the graph is meaningless, which is a worse outcome than an empty trail.
 */
// ---------------------------------------------------------------------------

group('a theorem in play, placed in the graph')

const thm = (title, body = '') => ({
  medium: 'theorem', id: title.toLowerCase().replace(/\s+/g, '-'), title,
  attribution: null, framing: null, origin: 'catalogued', sourceUrl: null, meta: {},
  perceptible: { kind: 'text', body },
})

t('a quadratic formula lands on factoring a quadratic',
  conceptsInOffering(MATHEMATICS, thm('Quadratic formula')).some(c => /factoring/i.test(c.name)))
t('a logarithm lands on what a logarithm is',
  conceptsInOffering(MATHEMATICS, thm('Logarithm')).some(c => /logarithm/i.test(c.name)))
t('matrix multiplication lands on the matrix concepts',
  conceptsInOffering(MATHEMATICS, thm('Matrix multiplication')).length >= 1)
t('a non-theorem medium is never placed', (() => {
  const song = { ...thm('Quadratic formula'), medium: 'music' }
  return conceptsInOffering(MATHEMATICS, song).length === 0
})())
/*
 * Was 'Pythagorean theorem', which the atlas now recognises — that assertion
 * was encoding the registry's sparsity rather than a property of the code.
 * Replaced with a title that is genuinely outside mathematics, which is the
 * thing actually worth guarding: the trail must stay empty for an offering the
 * registry knows nothing about, instead of reaching for the nearest word.
 */
t('a theorem the atlas has no concept for places nothing',
  conceptsInOffering(MATHEMATICS, thm('Hadwiger–Nelson problem')).length === 0)
t('an untitled offering places nothing rather than matching everything',
  conceptsInOffering(MATHEMATICS, thm('')).length === 0)

group('the title is the subject, and the extract is not')
/*
 * Measured, not assumed. The scope patterns are generous on purpose — the right
 * trade when filtering a search, the wrong one when labelling a theorem, where a
 * false positive is a confident claim about what something is ABOUT.
 *
 * Each of these is a real leak that matching the whole text produced.
 */
/*
 * Both of these now match the right concept, which they did not before the
 * registry was populated. The assertion that matters is unchanged and is the
 * one originally intended: the WRONG concept stays out, however much the
 * extract talks about it.
 */
t('"Derivative" is not about "what a function is", however often its extract says function',
  !conceptsInOffering(MATHEMATICS, thm(
    'Derivative',
    'The derivative of a function of a real variable measures the sensitivity to change of the function value.',
  )).some(c => c.id === 'what-a-function-is'))
t('and it does land on the derivative itself',
  conceptsInOffering(MATHEMATICS, thm('Derivative')).some(c => c.id === 'derivative-definition'))
t('"Eigenvalues and eigenvectors" is not about factoring, however often it says factor',
  !conceptsInOffering(MATHEMATICS, thm(
    'Eigenvalues and eigenvectors',
    'An eigenvector of a linear transformation is a nonzero vector that changes by a scalar factor.',
  )).some(c => /factor/.test(c.id)))
t('and a long extract cannot add matches to a title that has them', (() => {
  const bare = conceptsInOffering(MATHEMATICS, thm('Logarithm'))
  const verbose = conceptsInOffering(MATHEMATICS, thm(
    'Logarithm',
    'In mathematics, the logarithm is the inverse function to exponentiation, related to polynomials, ' +
    'vectors, matrices, probability, factoring and the Cartesian plane.',
  ))
  return bare.length === verbose.length
})())

group('related concepts: one hop, labelled, and honest about problems')

const trail = relatedConcepts(MATHEMATICS, thm('Quadratic formula'))
t('a matched theorem has a trail', trail.length > 0)
t('the matched concept comes first and is labelled "about"', trail[0]?.relation === 'about')
t('every entry names a real concept in the atlas',
  trail.every(c => MATHEMATICS.concepts.some(x => x.id === c.id)))
t('nothing is listed twice', new Set(trail.map(c => c.id)).size === trail.length)
t('every relation is one of the four kinds',
  trail.every(c => ['about', 'rests on', 'leads to', 'contained in'].includes(c.relation)))
t('the trail is capped', relatedConcepts(MATHEMATICS, thm('Quadratic formula'), 3).length <= 3)
t('an unmatched theorem has no trail',
  relatedConcepts(MATHEMATICS, thm('Hadwiger–Nelson problem')).length === 0)
/*
 * The rule this file exists for. The atlas is mostly mapped and unwritten, so a
 * link promising problems where none are authored would send the learner to an
 * empty panel and read as the practice engine being broken.
 */
t('teachable agrees with isTeachable for every entry',
  trail.every(c => c.teachable === isTeachable(MATHEMATICS, c.id)))
t('the trail does contain at least one unteachable concept, so the split is live',
  relatedConcepts(MATHEMATICS, thm('Quadratic formula'), 20).some(c => !c.teachable))
/*
 * `practisable` is carried alongside, and the link reads THAT one.
 *
 * `teachable` is "has knowledge points" and was what the link and the "N with
 * problems" count both used — a claim about problems settled by material. The
 * two agree today; they did not for the three logarithm concepts, which is
 * exactly the trail a theorem titled "Logarithm" produces.
 *
 * Asserted against `isPractisable` itself rather than against a count, for the
 * reason the practisable group in tests/concepts-logic.mjs gives: a pinned size
 * makes authoring more problems look like a regression.
 */
t('every entry carries practisable as a boolean',
  trail.every(c => typeof c.practisable === 'boolean'))
t('practisable agrees with isPractisable for every entry',
  trail.every(c => c.practisable === isPractisable(MATHEMATICS, c.id)))
t('nothing is practisable without being teachable',
  relatedConcepts(MATHEMATICS, thm('Quadratic formula'), 20)
    .every(c => !c.practisable || c.teachable))
t('a practisable concept links to practice',
  conceptHref({ id: 'x', practisable: true }).includes('tab=practice'))
t('one with no problems links to the graph instead, where there is something to see',
  conceptHref({ id: 'x', practisable: false }).includes('tab=concepts'))
t('the id is encoded, since it reaches the URL',
  conceptHref({ id: 'a b', practisable: true }).includes('a%20b'))

// ---------------------------------------------------------------------------
/*
 * Authored patterns on mapped nodes — `MapNode.match`.
 *
 * Bulk authoring needs a guard, and "does the pattern exist" is not one. Three
 * invariants, each catching a different way a hand-written regex goes wrong:
 *
 *  1. It matches its own node's name. Catches typos and a pattern that was
 *     written against prose rather than a title.
 *  2. A real article title resolves to the RIGHT concept. This is the only test
 *     that knows whether the registry is useful, and it is a table of titles an
 *     encyclopaedia actually uses rather than of names this file chose.
 *  3. It does not match titles it has no business matching. Over-broad is the
 *     dominant failure — the patterns here are tested against a title, so
 *     /functions/ would claim every article with "function" in its name.
 */
// ---------------------------------------------------------------------------

group('promoting a node out of the map keeps its edges')
/*
 * The generalised form of a bug this file has already seen once. `needs` lives
 * on the map node, so authoring a concept and deleting the node takes the edge
 * with it — and the authored concept becomes a ROOT of mathematics, drawn as
 * somewhere the subject begins. That happened to `function-concept` and was
 * noticed only by looking at the graph.
 *
 * Asserted over every authored concept rather than the ones it has bitten, so
 * the next promotion is covered before anybody makes it.
 */
const AUTHORED_IDS = new Set(ONTOLOGIES.flatMap(o => o.concepts.map(c => c.id)))
const atlasRoots = roots(MATHEMATICS)
/**
 * The one authored concept that is SUPPOSED to be a root.
 *
 * `place-value` is where arithmetic begins and arithmetic is the floor of the
 * map — it is `ONTOLOGIES[0]`'s first concept precisely because, as that array's
 * comment puts it, "arithmetic genuinely is met first". So it has nothing behind
 * it by design, and this assertion found it the moment it was written.
 *
 * Named rather than excluded by a rule, because "has no prerequisites" is the
 * symptom shared by the legitimate bottom of the map and by a concept whose edge
 * was lost in a promotion. Only a human can tell those apart, so the list says
 * which one this is.
 */
const AUTHORED_ROOTS = ['place-value']
t('no authored concept is a root of the composed map, bar the floor of arithmetic',
  atlasRoots.filter(id => AUTHORED_IDS.has(id)).every(id => AUTHORED_ROOTS.includes(id)),
  atlasRoots.filter(id => AUTHORED_IDS.has(id)).join(', '))
t('and that exception is real, so it is not dead text',
  AUTHORED_ROOTS.every(id => atlasRoots.includes(id)))
t('the map does have roots, so the check is not vacuous', atlasRoots.length > 0)
/*
 * The two promotions this was written alongside, named — the assertion above
 * would also pass if they had never been authored at all.
 */
for (const id of ['completing-the-square', 'quadratic-formula']) {
  t(`${id} is authored, teachable and still gated`,
    AUTHORED_IDS.has(id)
    && isTeachable(MATHEMATICS, id)
    && prerequisitesOf(MATHEMATICS, id).length > 0,
    prerequisitesOf(MATHEMATICS, id).join(', '))
}
t('the quadratic formula kept the surd prerequisite that crosses into the map',
  prerequisitesOf(MATHEMATICS, 'quadratic-formula').includes('roots-and-irrationals'))
t('and everything that depended on it still does',
  dependentsOf(MATHEMATICS, 'quadratic-formula').length > 0,
  dependentsOf(MATHEMATICS, 'quadratic-formula').join(', '))

group('every checked concept really carries a pattern')
/*
 * "The pattern matches its own node's name" was the first invariant here and it
 * was wrong — it failed on 40 nodes and on four authored concepts, and every
 * one of those was a false alarm.
 *
 * A node's `name` is a curriculum label and the pattern targets an
 * encyclopaedia title; they are different vocabularies on purpose. "Pythagoras"
 * is the right name for a syllabus entry and "Pythagorean theorem" is what the
 * article is called. "Triangles" is plural and the article is not. Requiring the
 * two to agree would force the curriculum to be named after Wikipedia, which is
 * backwards.
 *
 * What remains checkable structurally is the thing `fidelityMismatches` already
 * says: a concept claiming to be checked must have something to check with. The
 * real quality test is the title table below, which knows what the patterns are
 * *for*.
 */
const checkedNodes = MATHEMATICS.concepts.filter(c => c.fidelity === 'checked')
t('there are authored patterns to check', checkedNodes.length > 20)
t('every checked concept carries a pattern', checkedNodes.every(c => !!c.scope.match))
t('and no guided one does',
  MATHEMATICS.concepts.filter(c => c.fidelity === 'guided').every(c => !c.scope.match))
t('a recognised-but-unwritten node says so, rather than claiming nothing checks it',
  MATHEMATICS.concepts
    .filter(c => c.fidelity === 'checked' && c.knowledgePoints.length === 0)
    .every(c => !!c.caveat && !/nothing checks/.test(c.caveat)))

group('real article titles land on the right concept')
/*
 * The table is titles as an encyclopaedia writes them, because that is what the
 * `theorem` medium serves. `null` means "nothing in the atlas should claim
 * this" — those rows are as load-bearing as the positive ones, since a registry
 * that matches everything is worth less than one that matches nothing.
 */
const TITLES = [
  ['Pythagorean theorem', 'pythagoras'],
  ['Bayes\' theorem', 'bayes-theorem'],
  ['Central limit theorem', 'central-limit-theorem'],
  ['Mean value theorem', 'mean-value-theorem'],
  ['Fundamental theorem of calculus', 'fundamental-theorem'],
  ['Chain rule', 'chain-rule'],
  ['Taylor series', 'taylor-series'],
  ['Fourier series', 'fourier-series'],
  ['Eigenvalues and eigenvectors', 'eigenvalues'],
  ['Singular value decomposition', 'singular-value-decomposition'],
  ['Gaussian elimination', 'gaussian-elimination'],
  ['Euclidean algorithm', 'euclidean-algorithm'],
  ['Modular arithmetic', 'modular-arithmetic'],
  ['Chinese remainder theorem', 'chinese-remainder'],
  ['Quadratic reciprocity', 'quadratic-reciprocity'],
  ['Galois theory', 'galois-theory'],
  ['Residue theorem', 'residue-theorem'],
  ['Markov chain', 'markov-chains'],
  ['Law of large numbers', 'law-of-large-numbers'],
  ['Maximum likelihood estimation', 'maximum-likelihood'],
  ['Linear regression', 'linear-regression'],
  ['Mathematical induction', 'mathematical-induction'],
  ['Binomial theorem', 'binomial-theorem'],
  ['Law of sines', 'law-of-sines-cosines'],
  ['Euler\'s formula', 'eulers-formula'],
  ['Conic section', 'conic-sections'],
  ['Intermediate value theorem', 'intermediate-value-theorem'],
  ['Squeeze theorem', 'squeeze-theorem'],
  ['L\'Hôpital\'s rule', 'lhopital'],
  ['Integration by parts', 'integration-by-parts'],
  ['Lagrange multiplier', 'lagrange-multipliers'],
  ['Green\'s theorem', 'greens-stokes-divergence'],
  ['Laplace transform', 'laplace-transform'],
  ['Cauchy sequence', 'cauchy-sequences'],
  ['Bolzano–Weierstrass theorem', 'bolzano-weierstrass'],
  ['Compact space', 'compactness'],
  ['Fundamental group', 'homotopy-and-fundamental-group'],
  ['Hypothesis testing', 'hypothesis-testing'],
  ['Confidence interval', 'confidence-intervals'],
  ['Analysis of variance', 'anova-and-design'],
  /*
   * Inflected titles, as their own rows.
   *
   * "Hypothesis testing" was matching nothing because the pattern ended in
   * `test\b`, and `\b` cannot fall inside "testing". That trap belongs to every
   * pattern whose last word takes a suffix in the title people actually use, so
   * the plurals and gerunds are tested rather than assumed.
   */
  ['Hypothesis testing', 'hypothesis-testing'],
  ['Permutations and combinations', 'counting-principles'],
  ['Partial derivatives', 'partial-derivatives'],
  ['Eigenvalue', 'eigenvalues'],
  ['Manifolds', 'manifolds'],
  ['Conic sections', 'conic-sections'],
  ['Radian measure', 'radians'],
  ['Separation of variables', 'separable-equations'],
  ['Diagonalizable matrix', 'diagonalisation'],
  ['Homology (mathematics)', 'homology'],
  // Bare words that four nodes could each claim. Anchoring the pattern to the
  // article title is what keeps "Sequence" off the arithmetic one and
  // "Continuous function" off the three rigorous ones.
  ['Sequence', 'sequences'],
  ['Continuous function', 'continuity'],
  ['Sine wave', 'trig-graphs'],
]

for (const [title, expected] of TITLES) {
  const o = thm(title)
  const got = conceptsInOffering(MATHEMATICS, o)
  const ids = got.map(c => c.id)
  t(`"${title}" → ${expected}`, ids.includes(expected),
    ids.length ? `got ${ids.join(', ')}` : 'matched nothing')
}

group('patterns are not over-broad')
/*
 * Each of these is a title that a tempting-but-lazy pattern would have claimed.
 * The measured leaks from the first version of this feature are in
 * tests/correlate-logic.mjs; these guard the authored ones.
 */
const MUST_NOT = [
  // "Function" is in a dozen node names, and a pattern on the bare word would
  // make this article about all of them. `functions-formally` is NOT forbidden
  // here — it is the concept whose article this is, and the first version of
  // this row forbade it, which was the test being wrong rather than the
  // pattern. What must stay out is the specialisation.
  ['Function (mathematics)', ['functions-of-several-variables', 'multivariable-chain-rule']],
  // Geometry's congruence and number theory's congruences are different ideas
  // that share a word.
  ['Congruence (geometry)', ['linear-congruences', 'modular-arithmetic']],
  // "Series" likewise.
  ['Taylor series', ['fourier-series', 'power-series', 'infinite-series']],
  // A named theorem must not be claimed by the general area it sits in.
  ['Bayes\' theorem', ['hypothesis-testing', 'bayesian-inference']],
  ['Pythagorean theorem', ['pythagorean-identity']],
  ['Sequence', ['arithmetic-sequences', 'geometric-sequences', 'cauchy-sequences']],
  ['Continuous function', ['rigorous-continuity', 'uniform-continuity']],
]
for (const [title, forbidden] of MUST_NOT) {
  const ids = conceptsInOffering(MATHEMATICS, thm(title)).map(c => c.id)
  const hit = forbidden.filter(f => ids.includes(f))
  t(`"${title}" is not claimed by ${forbidden.join(', ')}`, hit.length === 0,
    hit.length ? `claimed by ${hit.join(', ')}` : '')
}
/*
 * A ceiling on how many concepts one title may be "about". Four is already
 * generous — a theorem about more than four things at once is a pattern set
 * that has stopped discriminating, which is the failure that makes the trail
 * read as noise rather than as structure.
 */
for (const [title] of TITLES) {
  const n = conceptsInOffering(MATHEMATICS, thm(title)).length
  if (n <= 4) continue
  t(`"${title}" matches at most four concepts`, false, `matched ${n}`)
}
t('no title in the table matches more than four concepts',
  TITLES.every(([title]) => conceptsInOffering(MATHEMATICS, thm(title)).length <= 4))

console.log('\nrecognition coverage')
console.log(`  ${checkedNodes.length} of ${MATHEMATICS.concepts.length} concepts can be recognised from a title`)
// "material", not "problems", and the wording stays careful even though the
// two agree today. This counts knowledge points; whether a task stands behind
// one is a question about TASKS, which this harness cannot read — see the
// practisable group in tests/concepts-logic.mjs, which can. Three concepts
// were material-only until `exactLog` made the logarithm tasks rulable.
console.log(`  ${MATHEMATICS.concepts.filter(c => c.knowledgePoints.length > 0).length} have material written`)

rmSync(outDir, { recursive: true, force: true })
console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length > 0) process.exit(1)
