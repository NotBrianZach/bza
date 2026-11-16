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

/*
 * THE FLOOR. Do not lower it and do not delete it: it is the only thing
 * between this map and a scatter of one-node areas, and an area is the unit a
 * learner is shown a region of mathematics in.
 *
 * It has a known blind spot, which is worth recording HERE rather than only in
 * the group that had to work around it: this compares nodes remaining, so an
 * area that drained from fifteen to five by having its content authored reads
 * identically to five somebody sketched and abandoned. Two areas hit the floor
 * that way and were merged into their neighbours instead — see
 * atlas-foundations.ts, and the budget group further down, which asserts that
 * the merges actually bought the room they were for. Counting
 * nodes-plus-departures against the floor would tell the two cases apart and
 * is the alternative that was NOT taken; if a later drained area wants it, that
 * is a change to this line, not a reason to raise or drop the threshold.
 */
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
    'fraction-arithmetic', 'prime-factorisation', 'gcd-and-lcm', 'roots-and-irrationals',
    'decimal-representation', 'real-number-line']
    .every(id => MATHEMATICS.concepts.filter(c => c.id === id).length === 1))
t('and they carry their own subject, not the area they left',
  MATHEMATICS.concepts.filter(c => c.subjectId === 'arithmetic-foundations').length === 11)
/*
 * This cross-boundary example has now moved up twice, and the reason is worth
 * stating once rather than re-deriving each time: the illustration has to be a
 * node STILL ON THE MAP that names an authored concept in its own `needs`, so
 * every promotion of the current exemplar retires it.
 *
 * `prime-factorisation` was the first. It was replaced by
 * `decimal-representation`, which named both `fraction-arithmetic` and
 * `prime-factorisation` — one node resting on two separate promotions, the
 * strongest available form of "the edge survived the move".
 *
 * `decimal-representation` is itself authored now, so the claim moved again,
 * and `real-number-line` was the successor that kept the two-promotion form
 * intact: it declared `needs: ['roots-and-irrationals', 'decimal-representation']`
 * and both of those were authored concepts in a different file. It was also
 * the last node of the former `NUMBER_AND_ARITHMETIC` that could play this
 * role on two edges, which is itself a reading of how far that area had been
 * written out before it was merged into `algebra-foundations`.
 *
 * AND IT HAS BEEN PROMOTED IN TURN, SO THE TWO-EDGE FORM IS GONE FROM THIS
 * SUBJECT WITH NO SUCCESSOR — which the sentence above predicted and is worth
 * stating as an outcome rather than leaving as a gap somebody fills with a
 * wrong example. Nothing still on the map names two authored arithmetic
 * concepts in its own `needs`: `percent` names `ratio-and-rate`, which is a
 * map node, alongside `decimal-representation`; `scientific-notation` and
 * `linear-inequalities` each name exactly one. So the pair below is now two
 * ONE-edge cases, and the two-promotion form is asserted where it still
 * exists — in the shape the promotion left behind, two groups down, where
 * `real-number-line` has to be teachable with BOTH of its edges restated
 * inside its new subject.
 *
 * They are still worth two assertions rather than one. A bug in
 * `composeAtlas`'s edge resolution could resolve an edge into an area that
 * kept its node and drop one into an area that did not, and these two differ
 * on exactly that.
 */
t('the nodes that used to need them still do, across the file boundary',
  prerequisitesOf(MATHEMATICS, 'absolute-value').includes('negative-numbers')
  && prerequisitesOf(MATHEMATICS, 'linear-inequalities').includes('real-number-line'),
  `${prerequisitesOf(MATHEMATICS, 'absolute-value').join('/')} | `
  + prerequisitesOf(MATHEMATICS, 'linear-inequalities').join('/'))
/*
 * The edges INTO the promoted decimals, declared by nodes that stayed. This is
 * the case that needed no `links` entry at all — see the removal note in
 * atlas-foundations.ts — so it is the one most likely to be broken silently by
 * a change to edge resolution, since nothing in the area file mentions it.
 *
 * It was three nodes and is two: `real-number-line` was the third and is an
 * authored concept now, so its edge is no longer an into-edge across a file
 * boundary at all. It is checked below instead, as one of the pair that came
 * down off the map with it. A list of surviving into-edges is a list of future
 * stranded edges, and this is the second time this group has had to shorten
 * one.
 */
t('and the two nodes that still need the promoted decimals both reach it',
  ['percent', 'scientific-notation'].every(id =>
    prerequisitesOf(MATHEMATICS, id).includes('decimal-representation')),
  ['percent', 'scientific-notation']
    .map(id => `${id}: ${prerequisitesOf(MATHEMATICS, id).join('/')}`).join(' | '))
t('and the decimals\' own needs were restated inside the subject, not dropped',
  prerequisitesOf(MATHEMATICS, 'decimal-representation').includes('fraction-arithmetic')
  && prerequisitesOf(MATHEMATICS, 'decimal-representation').includes('prime-factorisation'),
  prerequisitesOf(MATHEMATICS, 'decimal-representation').join(', '))
t('so the decimals are teachable and gate what the map says they gate',
  isTeachable(MATHEMATICS, 'decimal-representation')
  && gatingPrerequisitesOf(MATHEMATICS, 'scientific-notation').includes('decimal-representation'),
  gatingPrerequisitesOf(MATHEMATICS, 'scientific-notation').join(', '))
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

/**
 * `real-number-line`, the eleventh promotion out of the number half, asserted
 * in the form the promotion left behind — the same shape as the gcd above.
 *
 * It is the first concept in this subject to be reached by a route the merges
 * opened: it was an "area-floor casualty" for three promotions running,
 * because `number-and-arithmetic` was at the floor and could release nothing.
 * So this group is also the only evidence the merge did what it was for, as
 * opposed to being correctly argued. The budget assertions further down say
 * the floor WOULD hold; these say one promotion actually happened.
 *
 * Both of its own edges landed inside its new subject, which is the cheap
 * shape and the third in a row here, so no `links` entry exists anywhere to
 * carry either of them. That makes them exactly the edges a careless edit
 * deletes without trace: nothing in atlas-foundations.ts mentions them except
 * a comment.
 */
t('the real line was promoted and kept both of its edges, in both directions',
  isTeachable(MATHEMATICS, 'real-number-line')
  && prerequisitesOf(MATHEMATICS, 'real-number-line').includes('roots-and-irrationals')
  && prerequisitesOf(MATHEMATICS, 'real-number-line').includes('decimal-representation')
  && prerequisitesOf(MATHEMATICS, 'linear-inequalities').includes('real-number-line'),
  `${prerequisitesOf(MATHEMATICS, 'real-number-line').join(', ')} → real-number-line → `
  + `${dependentsOf(MATHEMATICS, 'real-number-line').join(', ')}`)
/*
 * And the gate it tightened, which is the reason this node was worth taking
 * ahead of the other five that were ready.
 *
 * `cartesian-plane` is authored, in ontology-vectors.ts, and it names
 * `real-number-line` through `EUCLIDEAN_GEOMETRY.links` rather than through
 * its own `needs` — the edge could not follow it into the vectors syllabus.
 * While this end was an empty node, `gatingPrerequisitesOf` walked straight
 * through it to the nearest teachable ancestors two steps below. It now stops
 * here. That is a gate appearing in the MIDDLE of a written chain, which no
 * previous promotion in this subject produced, and it happened without
 * anybody editing the plane or the link.
 */
t('and the plane now gates on the real line itself rather than through it',
  gatingPrerequisitesOf(MATHEMATICS, 'cartesian-plane').includes('real-number-line')
  && gatingPrerequisitesOf(MATHEMATICS, 'cartesian-plane')
    .every(p => isTeachable(MATHEMATICS, p)),
  gatingPrerequisitesOf(MATHEMATICS, 'cartesian-plane').join(', '))
/*
 * The `links` entry that carries that edge is still a `links` entry, and the
 * REASON it is has changed without its home changing — which is the rot this
 * file's notes keep catching one promotion late. It used to be there because
 * this end was an unwritten map node with no ontology to belong to; it is
 * there now because both ends are authored in subjects that do not contain
 * each other. Asserted as a property rather than described, so that a future
 * author who decides it has become an ordinary `needs` and deletes it fails
 * here instead of silently making `composeAtlas` emit the edge twice.
 */
t('…and that edge is still carried by a link, because the two ends are in different subjects',
  (AREAS.find(a => a.id === 'euclidean-geometry').links ?? [])
    .some(l => l.from === 'real-number-line' && l.to === 'cartesian-plane')
  && areaOf(MATHEMATICS, 'real-number-line') === 'arithmetic-foundations'
  && areaOf(MATHEMATICS, 'cartesian-plane') === 'vectors-and-independence',
  `${areaOf(MATHEMATICS, 'real-number-line')} -> ${areaOf(MATHEMATICS, 'cartesian-plane')}`)

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
t('the subject contributes four concepts', VEC_IDS.size === 4, `${VEC_IDS.size}`)
t('matrices now gates on vectors, not through them',
  gatingPrerequisitesOf(MATHEMATICS, 'matrices-and-maps').includes('vectors-and-spans'),
  gatingPrerequisitesOf(MATHEMATICS, 'matrices-and-maps').join(', '))
t('and the gate it names is teachable, so it is somewhere to go',
  gatingPrerequisitesOf(MATHEMATICS, 'matrices-and-maps').every(p => isTeachable(MATHEMATICS, p)))

/**
 * THE PLANE WAS PROMOTED INTO THIS SUBJECT, AND IT TIGHTENED THE GATE AGAIN.
 *
 * `cartesian-plane` was a node of `coordinate-geometry` and is now the first
 * concept of this ontology. The count above is the assertion that catches the
 * collision half of that move — `atlasProblems` would reject the node if it had
 * been left behind, and a fifth concept here would mean somebody added one
 * without reading this group.
 *
 * What is asserted below is the half a count cannot see. Before the promotion
 * `plane-vectors` gated on `roots-and-irrationals` and `decimal-representation`,
 * because `gatingPrerequisitesOf` looked through the unwritten plane and the
 * unwritten real line to the nearest teachable ancestors. It should now stop at
 * the plane, which is both nearer and correct — and the edge it stops on is the
 * one that moved out of `coordinate-geometry.links` and into this ontology, so
 * this is also the check that the move did not simply delete it.
 */
t('plane-vectors gates on the plane itself, not through it to the arithmetic',
  gatingPrerequisitesOf(MATHEMATICS, 'plane-vectors').includes('cartesian-plane'),
  gatingPrerequisitesOf(MATHEMATICS, 'plane-vectors').join(', '))
t('and the plane is still joined to the arithmetic underneath it, by the two links that replaced it', (() => {
  const below = allPrerequisitesOf(MATHEMATICS, 'cartesian-plane')
  return below.includes('real-number-line') && below.includes('negative-numbers')
})(), allPrerequisitesOf(MATHEMATICS, 'cartesian-plane').join(', '))
/*
 * The nodes that stayed in `coordinate-geometry` declared their own edges to
 * the plane, so those survive the promotion untouched. Asserted because the
 * symmetric case is the documented trap: the edges the plane itself declared
 * did NOT survive, and had to be rewritten as `links`.
 */
t('the nodes left in the coordinate area still reach the promoted plane',
  prerequisitesOf(MATHEMATICS, 'distance-and-midpoint').includes('cartesian-plane')
  && prerequisitesOf(MATHEMATICS, 'plane-transformations').includes('cartesian-plane'))

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
 * The authored concepts that are SUPPOSED to be roots.
 *
 * `place-value` is where arithmetic begins and arithmetic is the floor of the
 * map — it is `ONTOLOGIES[0]`'s first concept precisely because, as that array's
 * comment puts it, "arithmetic genuinely is met first". So it has nothing behind
 * it by design, and this assertion found it the moment it was written.
 *
 * `points-lines-angles` is the second, and it is the case the list was built
 * for. It was a root of the map BEFORE it was authored: the node carried no
 * `needs`, because the undefined terms and the first angle facts rest on
 * nothing earlier in mathematics. So nothing was lost in its promotion, and
 * the assertion going red was the check doing its job — asking a human which
 * of the two kinds of rootless concept this is. The answer is on record in
 * ontology-geometry.ts, including why no edge down to `integer-arithmetic` was
 * invented to make the figure tidier.
 *
 * Named rather than excluded by a rule, because "has no prerequisites" is the
 * symptom shared by the legitimate bottom of the map and by a concept whose edge
 * was lost in a promotion. Only a human can tell those apart, so the list says
 * which ones these are.
 */
const AUTHORED_ROOTS = ['place-value', 'points-lines-angles']
t('no authored concept is a root of the composed map, bar the two floors on record',
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

/**
 * SIX NODES WERE PROMOTED OUT OF THIS AREA — FOUR OF THEM THE CHEAPEST KIND
 * THE ATLAS HAS, AND TWO OF THEM THE KIND THAT ENDED THE FIRST RUN OF THEM.
 *
 * `points-lines-angles`, `triangle-basics`, `congruence`, `similarity`,
 * `pythagoras` and `quadrilaterals-and-polygons` were the first six nodes of
 * `euclidean-geometry` and are now the six concepts of `plane-geometry`. The
 * assertions above already cover the collision half of all six moves —
 * `shippedAtlasProblems` would name any node that had been left behind — and
 * the rootless half, by naming the angle facts in `AUTHORED_ROOTS`.
 *
 * What is asserted here is where each promotion's stranded edges went, because
 * that is the part that varied:
 *
 *   The angle facts stranded NOTHING. The node declared no `needs` at all, so
 *   there was nothing to move, and the one edge into it belonged to
 *   `triangle-basics`, which was still on the map.
 *
 *   The triangles then stranded exactly that edge — it was the promoted node's
 *   own `needs` — and it went to `PLANE_GEOMETRY.edges` rather than to this
 *   area's `links`, because by then BOTH endpoints were concepts of that
 *   subject. An area declaring it would be asserting a relation between two
 *   concepts it no longer contains, and `areaOntology` would filter it back
 *   out of the area view anyway.
 *
 *   `congruence` repeated that case exactly, which is why the cheap shape could
 *   be called a pattern rather than a coincidence of two nodes. Its own `needs`
 *   was `['triangle-basics']`, by then already a concept of `plane-geometry`,
 *   so the stranded edge was internal the moment it was stranded and went to
 *   the same list.
 *
 *   `similarity` BROKE THE PATTERN, and this group previously asserted the
 *   emptiness that it broke. The node declared two `needs`: `congruence`, which
 *   was already a concept and so went to `PLANE_GEOMETRY.edges` like the two
 *   above, and `ratio-and-rate`, which was then a node of
 *   `NUMBER_AND_ARITHMETIC` and is a node of `algebra-foundations` now, those
 *   two areas having merged — a map node either way. An authored ontology may
 *   only name concepts it
 *   contains, so the second one could not follow the first and came back here
 *   as this area's first `links` entry.
 *
 *   `pythagoras` DID IT AGAIN, which is what turns `similarity` from an
 *   awkward one-off into the pattern. Two `needs` again: `similarity`, by then
 *   a concept, went to `PLANE_GEOMETRY.edges`, and `roots-and-irrationals`
 *   came back here as the second `links` entry.
 *
 *   `quadrilaterals-and-polygons` WENT BACK TO THE CHEAP CASE, which is why
 *   the heading above says four and two rather than three and then the rest.
 *   Its own `needs` was `['congruence']` and nothing else, `congruence` was
 *   already a concept of `plane-geometry`, so the single stranded edge is
 *   internal there and went to `PLANE_GEOMETRY.edges` like the three cheap ones
 *   before it. This area's `links` therefore needed no entry and gave none up,
 *   which is what the ordered-pair assertion below now also holds against a
 *   sixth promotion rather than a fifth.
 *
 *   It was, however, the first promotion here that was NOT directly above the
 *   last — it is the second child of `congruence`, taken three promotions after
 *   the first one was. So cheapness is a property of where a departing node's
 *   prerequisites LIVE and not of the branch being walked upward in order,
 *   which the run of three had made easy to conflate.
 *
 *   `pythagoras`'s reason for not following differs from `ratio-and-rate`'s,
 *   and that is the distinction the assertion below is written to hold.
 *   `ratio-and-rate` is an unwritten map node, so it has no ontology to live
 *   in at all. `roots-and-irrationals` is fully authored — in
 *   `arithmetic-foundations`. An ontology's edges may only name concepts it
 *   CONTAINS, so belonging to a different subject fails that test exactly as
 *   being a skeleton does. `links` is therefore about which FILE an endpoint
 *   is in, not about whether it was written, and the two entries are asserted
 *   as an ordered pair so that distinction stays on the record.
 *
 *   It also has the opposite CONSEQUENCE, which gets its own assertion. The
 *   `ratio-and-rate` link gates nothing, because the gating walk passes
 *   through a node with no material. This one gates, because its endpoint has
 *   three knowledge points — the first `links` entry in this area to change
 *   what a learner must demonstrate.
 *
 * The assertion therefore had to CHANGE rather than merely be extended, and it
 * is worth being explicit that this is not the test having been wrong. "No
 * links after three departures" was true, was load-bearing, and would have
 * caught a link added for symmetry. What it also encoded, without saying so,
 * was that the branch was being authored strictly upward from its root one node
 * at a time — and that stopped being true at the first promoted node with a
 * prerequisite outside the line. So what is asserted now is the sharper claim:
 * this area declares exactly TWO links, they are the two cross-file edges
 * `similarity` and `pythagoras` stranded, in that order, and nothing else has
 * crept in beside them.
 */
const EUCLID = AREAS.find(a => a.id === 'euclidean-geometry')
const DEPARTED = [
  'points-lines-angles', 'triangle-basics', 'congruence', 'similarity', 'pythagoras',
  'quadrilaterals-and-polygons',
]
t('the area no longer declares any of the six, and each carries its own subject',
  DEPARTED.every(id =>
    EUCLID.nodes.every(n => n.id !== id) && areaOf(MATHEMATICS, id) === 'plane-geometry'),
  DEPARTED.map(id => `${id}:${areaOf(MATHEMATICS, id)}`).join(' '))
/*
 * Two links now, and the fifth promotion added the second for a reason that is
 * NOT the first one's — which is why they are asserted as an ordered pair
 * rather than by a count.
 *
 * `ratio-and-rate` could not go into `PLANE_GEOMETRY.edges` because it is an
 * unwritten map node. `roots-and-irrationals` is fully authored and still could
 * not, because it is authored in `arithmetic-foundations` and an ontology may
 * only name concepts it CONTAINS. Both land in `links`, by different routes, so
 * a test that only counted them would not record that `links` is about which
 * FILE an endpoint is in rather than about whether it was written.
 *
 * FOUR NOW, AND THE MERGE WITH `COORDINATE_GEOMETRY` ADDED THE LAST TWO. They
 * were that area's own entries, both running into `cartesian-plane`, and the
 * merge's job was to decide whether either had stopped being a `links` entry —
 * an entry whose two ends end up in the SAME area has become an ordinary
 * `needs` edge, and leaving it would make `composeAtlas` emit that edge twice.
 * Neither had: `cartesian-plane` is an authored concept of the vectors
 * syllabus and is in neither half of the merged area, so both still have
 * exactly one home. Asserted as an ordered list of four so that a merge
 * dropping one, or collapsing one it should not have, is named rather than
 * counted.
 */
const EUCLID_LINKS = (EUCLID.links ?? []).map(l => `${l.from}->${l.to}`).join(' ')
t('the area asks for exactly the four cross-file edges it has been handed, in order',
  EUCLID_LINKS === 'ratio-and-rate->similarity roots-and-irrationals->pythagoras '
    + 'real-number-line->cartesian-plane negative-numbers->cartesian-plane'
  && (EUCLID.links ?? []).every(l => !!l.because),
  EUCLID_LINKS)
t('and the two the merge brought over still resolve in the composed map',
  prerequisitesOf(MATHEMATICS, 'cartesian-plane').includes('real-number-line')
  && prerequisitesOf(MATHEMATICS, 'cartesian-plane').includes('negative-numbers'),
  prerequisitesOf(MATHEMATICS, 'cartesian-plane').join(', '))
t('and `expandEdges` now stamps them with the area that absorbed them',
  MATHEMATICS.edges.filter(e =>
    e.to === 'cartesian-plane' && e.kind === 'prerequisite')
    .every(e => e.promotedBy === 'atlas:euclidean-geometry'),
  MATHEMATICS.edges.filter(e => e.to === 'cartesian-plane')
    .map(e => `${e.from}:${e.promotedBy}`).join(' '))
/*
 * And the edges they rehomed are really in the composed map, which the `links`
 * shape alone does not establish — a link naming an id nothing resolves would
 * sit in the file looking correct. This is the half that would catch the edge
 * being silently dropped, which is the failure the whole rehoming exists to
 * prevent.
 */
t('so similarity still rests on ratio-and-rate in the composed map, across the file boundary',
  prerequisitesOf(MATHEMATICS, 'similarity').includes('ratio-and-rate'),
  prerequisitesOf(MATHEMATICS, 'similarity').join(', '))
t('and pythagoras still rests on roots-and-irrationals, across a subject boundary this time',
  prerequisitesOf(MATHEMATICS, 'pythagoras').includes('roots-and-irrationals'),
  prerequisitesOf(MATHEMATICS, 'pythagoras').join(', '))
/*
 * The difference between the two links, asserted rather than only described.
 * `ratio-and-rate` has no material, so the gating walk passes straight through
 * it and that link gates nothing. `roots-and-irrationals` does, so this one
 * gates — the first `links` entry in this area to change what a learner has to
 * demonstrate. Worth holding, because the easiest way to lose it is to decide
 * the two entries are interchangeable.
 */
t('and that one GATES, unlike the other link, because its endpoint has material',
  gatingPrerequisitesOf(MATHEMATICS, 'pythagoras').includes('roots-and-irrationals')
  && !gatingPrerequisitesOf(MATHEMATICS, 'similarity').includes('ratio-and-rate'),
  `pythagoras:[${gatingPrerequisitesOf(MATHEMATICS, 'pythagoras').join(' ')}] `
  + `similarity:[${gatingPrerequisitesOf(MATHEMATICS, 'similarity').join(' ')}]`)
/*
 * The interference `similarity` also stranded, asserted separately because its
 * loss is the only stranding here that would NOT have shown up as a missing
 * gate: `interferes_with` constrains selection rather than introduction order,
 * so dropping it would have quietly freed the scheduler to introduce the two
 * most confusable concepts in the subject together.
 */
t('and the confusedWith it stranded survived as a real interference, with its reason',
  MATHEMATICS.edges.some(e =>
    e.kind === 'interferes_with' && !!e.rationale
    && ((e.from === 'similarity' && e.to === 'congruence')
      || (e.from === 'congruence' && e.to === 'similarity'))))
t('both edges between them survived their promotions, rehomed rather than lost',
  prerequisitesOf(MATHEMATICS, 'triangle-basics').includes('points-lines-angles')
  && prerequisitesOf(MATHEMATICS, 'congruence').includes('triangle-basics'),
  `${prerequisitesOf(MATHEMATICS, 'triangle-basics').join(', ')} | `
  + `${prerequisitesOf(MATHEMATICS, 'congruence').join(', ')}`)
/*
 * Authoring tightens the gate, which is the claim every promotion makes and
 * the first of these made from zero. `triangle-basics` was gated by NOTHING:
 * `gatingPrerequisitesOf` looked through the unwritten angle node and found no
 * teachable ancestor behind it, because there was none — the node was a root.
 * So the whole of school geometry was introducible on a cold account.
 *
 * The second promotion moved the same gate up for the three nodes that rest on
 * the triangles, and that is the half asserted below. `congruence`,
 * `area-and-perimeter` and `law-of-sines-cosines` each named `triangle-basics`
 * in their own `needs` while it was empty, so the walk passed through it and
 * landed back on the angle facts. Each now has two concepts to demonstrate,
 * and none of those three edges was touched to make it happen.
 */
t('the triangles are gated by the angle facts rather than by nothing at all',
  gatingPrerequisitesOf(MATHEMATICS, 'triangle-basics').join(',') === 'points-lines-angles',
  gatingPrerequisitesOf(MATHEMATICS, 'triangle-basics').join(', '))
t('and what rests on the triangles is now gated by them, not through them',
  ['congruence', 'area-and-perimeter', 'law-of-sines-cosines'].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).includes('triangle-basics')),
  ['congruence', 'area-and-perimeter', 'law-of-sines-cosines']
    .map(id => `${id}:[${gatingPrerequisitesOf(MATHEMATICS, id).join(' ')}]`).join(' '))
/*
 * The third promotion did the same thing for the four nodes that rest on
 * `congruence`. Each named it in their own `needs` while it was an empty node,
 * so the gating walk passed straight through and landed on the triangles; each
 * now has `congruence` itself to demonstrate. None of those four edges was
 * touched, which is the edge rule working for the third time.
 *
 * Two of the four are no longer map nodes — `similarity` and
 * `quadrilaterals-and-polygons` have since been promoted themselves — and the
 * claim is asserted over all four anyway, deliberately. A promotion restates
 * the departing node's `needs` inside the subject it joins, so the gate has to
 * survive the edge changing owner, and that is precisely the step where it
 * would be lost. The list is the four nodes that rested on `congruence`, not
 * the subset that happens to still be mapped.
 */
t('and what rests on congruence is now gated by it, not through it',
  ['geometric-proof', 'similarity', 'quadrilaterals-and-polygons', 'isometries-and-symmetry']
    .every(id => gatingPrerequisitesOf(MATHEMATICS, id).includes('congruence')),
  ['geometric-proof', 'similarity', 'quadrilaterals-and-polygons', 'isometries-and-symmetry']
    .map(id => `${id}:[${gatingPrerequisitesOf(MATHEMATICS, id).join(' ')}]`).join(' '))
/*
 * The fourth promotion moved the gate for just one node, and it is the smallest
 * fan-out of the four: `pythagoras` is the only node in the area that names
 * `similarity` in its `needs`. Asserted anyway, because one is the count at
 * which a dropped edge is easiest to miss — the three-node and four-node cases
 * above would each have left an obvious hole.
 */
t('and what rests on similarity is now gated by it, not through it',
  gatingPrerequisitesOf(MATHEMATICS, 'pythagoras').includes('similarity'),
  gatingPrerequisitesOf(MATHEMATICS, 'pythagoras').join(', '))
/*
 * The fifth promotion moved the gate for one node again — `circles` is the only
 * node left in the area that names `pythagoras` in its `needs`. Asserted for
 * the reason the one-node case above is: a single dropped edge is the easiest
 * kind to miss.
 *
 * Its three other dependents are not checked here because they are elsewhere:
 * `right-triangle-trig` is in this area's chain above `circles`,
 * `distance-and-midpoint` is in `coordinate-geometry` and
 * `diophantine-equations` in `number-theory`. The composed-map assertion above
 * already covers that the edges resolve across file boundaries.
 */
t('and what rests on pythagoras is now gated by it, not through it',
  gatingPrerequisitesOf(MATHEMATICS, 'circles').includes('pythagoras'),
  gatingPrerequisitesOf(MATHEMATICS, 'circles').join(', '))
/*
 * The sixth promotion moved the gate for one node again, and this one is worth
 * asserting for a second reason on top of the single-dependent one.
 *
 * `area-and-perimeter` is the only node anywhere in the atlas that names
 * `quadrilaterals-and-polygons` in its `needs`, and it names `triangle-basics`
 * as well — which has gated it since the second promotion, and is why this gate
 * was PARTLY live already. So the thing that changed is not that the node
 * acquired a gate but that the walk stopped looking through half of its pair,
 * and a test that only asked "is it gated by something" would have passed
 * before and after. Both halves are named.
 */
t('and what rests on the polygons is now gated by them, alongside the triangles it already had',
  gatingPrerequisitesOf(MATHEMATICS, 'area-and-perimeter').includes('quadrilaterals-and-polygons')
  && gatingPrerequisitesOf(MATHEMATICS, 'area-and-perimeter').includes('triangle-basics'),
  gatingPrerequisitesOf(MATHEMATICS, 'area-and-perimeter').join(', '))
t('all six promoted concepts are teachable in the composed map, with their material intact',
  DEPARTED.every(id => isTeachable(MATHEMATICS, id) && isPractisable(MATHEMATICS, id)),
  DEPARTED.filter(id => !isTeachable(MATHEMATICS, id) || !isPractisable(MATHEMATICS, id)).join(', '))
/*
 * The area's own root walks upward as the branch is authored. It was the
 * triangles after the first promotion and `congruence` after the second, and
 * the third replaced that single root with the FOUR nodes that rested on it.
 *
 * So the invariant is not "one root that moves up" — that is what it looked
 * like for two promotions, and it was a coincidence of those nodes each having
 * a single dependent in the area. Promoting a node fans the roots out to
 * everything in the area that stood on it. What is actually invariant, and
 * what is asserted here, is that the area's roots are exactly the remaining
 * nodes whose prerequisites have all left it: the area view keeps naming its
 * own boundary, however many nodes that boundary runs through.
 */
const euclidRoots = roots(areaOntology(EUCLID))
t('the area viewed alone shows exactly the nodes whose prerequisites have all left it',
  euclidRoots.slice().sort().join(',') === EUCLID.nodes
    .filter(n => (n.needs ?? []).every(p => EUCLID.nodes.every(m => m.id !== p)))
    .map(n => n.id).sort().join(','),
  euclidRoots.join(', '))
/*
 * Named membership rather than a count, and the fourth and fifth promotions are
 * each a reason why that matters — in opposite ways.
 *
 * The fourth swapped `similarity` out of this set for `pythagoras`, so the set
 * went from four members to four DIFFERENT members. A test written as
 * `length === 4` would have passed without noticing that every claim it was
 * making about the boundary had changed.
 *
 * The fifth then did what no promotion here had done and SHRANK it, to three:
 * `pythagoras` left and nothing replaced it, because the node resting on it is
 * `circles` and `circles` has a second prerequisite, `geometric-proof`, still
 * inside the area and still gating it. So a departing node promotes its
 * dependents to roots only when it was the last of their prerequisites in the
 * area — the four-way fan-out after `congruence` was a special case, since all
 * four of those nodes rested on `congruence` alone. A count would have flagged
 * this one, having missed the fourth; the named set catches both.
 */
/*
 * The sixth promotion then SUBSTITUTED, which is the fourth's shape rather
 * than the fifth's, and having both outcomes in the record is what makes the
 * rule legible: `quadrilaterals-and-polygons` left and `area-and-perimeter`
 * took its place, so three roots before and three after with different
 * membership — the exact case a `length === 3` would have passed blind, and the
 * second time this set has turned over without changing size.
 *
 * It replaced it because the departing node was the LAST of
 * `area-and-perimeter`'s prerequisites inside the area: its other one is
 * `triangle-basics`, gone since the second promotion. That is the same rule the
 * fifth promotion demonstrated from the other side, when `circles` did NOT
 * join because `geometric-proof` was still here to gate it from inside. Both
 * halves are asserted below, since a rule with one worked example in the suite
 * is a rule the next edit can satisfy by accident.
 */
/*
 * THE MERGE WITH `COORDINATE_GEOMETRY` THEN DOUBLED THE SET, from three to
 * six, which is the third distinct thing that can happen to it and the first
 * caused by something other than a promotion.
 *
 * The three synthetic members are unchanged — `area-and-perimeter`,
 * `geometric-proof` and `isometries-and-symmetry` — so the substitution the
 * sixth promotion made is still asserted, as the subset claim below. The three
 * that arrived are the analytic nodes every one of whose prerequisites is
 * outside the merged area: `distance-and-midpoint` needs `cartesian-plane` and
 * `pythagoras`, `plane-transformations` needs `cartesian-plane` and
 * `congruence`, and `dot-product-geometry` needs `plane-vectors` and
 * `right-triangle-trig` — four authored concepts and two nodes in other areas,
 * none of them here.
 *
 * `three-dimensional-coordinates` did NOT arrive as a root, and that is the
 * merge's point rather than an omission: it needs `solid-geometry`, which used
 * to be in a different area and is now in this one, so it is held back from
 * inside exactly as `circles` is by `geometric-proof`. The same rule the fifth
 * promotion demonstrated, this time produced by a merge instead of a
 * departure.
 */
t('and after the sixth promotion the three synthetic roots are still the SUBSTITUTED set',
  ['area-and-perimeter', 'geometric-proof', 'isometries-and-symmetry']
    .every(id => euclidRoots.includes(id))
  && !euclidRoots.includes('quadrilaterals-and-polygons'),
  euclidRoots.join(', '))
t('and the merge doubled the set to six, by named membership and never by count',
  euclidRoots.slice().sort().join(',')
  === 'area-and-perimeter,distance-and-midpoint,dot-product-geometry,geometric-proof,'
    + 'isometries-and-symmetry,plane-transformations',
  euclidRoots.join(', '))
t('while three-dimensional-coordinates is held back from inside by the solids, which the merge brought into the same area',
  EUCLID.nodes.some(n => n.id === 'three-dimensional-coordinates'
    && (n.needs ?? []).includes('solid-geometry'))
  && EUCLID.nodes.some(n => n.id === 'solid-geometry')
  && !euclidRoots.includes('three-dimensional-coordinates'),
  (EUCLID.nodes.find(n => n.id === 'three-dimensional-coordinates')?.needs ?? []).join(', '))
t('and area-and-perimeter joined it because the polygons were its last prerequisite in the area',
  (EUCLID.nodes.find(n => n.id === 'area-and-perimeter')?.needs ?? [])
    .every(p => EUCLID.nodes.every(m => m.id !== p)),
  (EUCLID.nodes.find(n => n.id === 'area-and-perimeter')?.needs ?? []).join(', '))
t('while circles is still held back from it by geometric-proof, which is why the fifth SHRANK the set',
  EUCLID.nodes.some(n => n.id === 'circles' && (n.needs ?? []).includes('geometric-proof'))
  && EUCLID.nodes.some(n => n.id === 'geometric-proof')
  && !euclidRoots.includes('circles'),
  (EUCLID.nodes.find(n => n.id === 'circles')?.needs ?? []).join(', '))
t('and the departed nodes are not roots of it, because they are not in it',
  euclidRoots.every(id => !DEPARTED.includes(id)),
  euclidRoots.join(', '))

// ---------------------------------------------------------------------------

/**
 * TWO AREAS WERE MERGED AWAY, AND THE STUB FLOOR IS WHY.
 *
 * `number-and-arithmetic` went into `algebra-foundations` and
 * `coordinate-geometry` into `euclidean-geometry`. Both merges are argued in
 * atlas-foundations.ts, above the node lists of the two surviving areas. What
 * is asserted here is the thing prose cannot: that nothing was lost.
 *
 * The three things a merge can silently drop, in increasing order of how long
 * it would take anybody to notice:
 *
 *  1. A node. `shippedAtlasProblems` catches one DUPLICATED, which a careless
 *     merge would do; a node simply deleted leaves no trace at all. So the
 *     moved ids are named, and checked to appear exactly once each.
 *  2. A `links` entry whose two ends now sit in the same area. It has become
 *     an ordinary `needs` edge and must be deleted, or `composeAtlas` emits
 *     the edge twice — which it does not check for, and which no other
 *     assertion in this file would see.
 *  3. A `confusedWith`. `expandEdges` turns each into an `interferes_with`,
 *     and interference constrains SELECTION rather than gating — so losing one
 *     keeps every suite green while quietly freeing the scheduler to introduce
 *     the two most confusable concepts in a subject together. That is the
 *     stranding worth an assertion of its own, and it gets one below even
 *     though both merges turned out to have none to strand: an absence nobody
 *     checked is indistinguishable from a loss.
 */
group('the two merges moved every node and dropped no edge')

t('the two drained areas are gone from the map',
  !AREAS.some(a => a.id === 'number-and-arithmetic' || a.id === 'coordinate-geometry'),
  AREAS.map(a => a.id).join(', '))

/*
 * `real-number-line` arrived here with the other four and has since been
 * authored out again, so it is no longer a node of this area and cannot be
 * checked as one — the first id to leave this table. Removed rather than
 * special-cased: the table's job is "every node the merge moved is still a
 * node of the area that absorbed it", and a concept is not a node. Its arrival
 * is still covered, by the assertion two groups up that it carries the
 * arithmetic subject and appears exactly once in the composed list — which
 * would catch a bulk move having dropped it, since a dropped node could not
 * then have been promoted out of one.
 */
const MOVED = {
  'algebra-foundations': [
    'absolute-value', 'ratio-and-rate', 'percent', 'scientific-notation',
  ],
  'euclidean-geometry': [
    'distance-and-midpoint', 'lines-in-the-plane', 'circles-analytic', 'conic-sections',
    'dot-product-geometry', 'three-dimensional-coordinates', 'parametric-curves',
    'plane-transformations', 'loci-and-regions',
  ],
}
for (const [areaId, ids] of Object.entries(MOVED)) {
  const area = AREAS.find(a => a.id === areaId)
  t(`all ${ids.length} nodes arrived in ${areaId}, once each and carrying its subject`,
    ids.every(id =>
      area.nodes.filter(n => n.id === id).length === 1
      && MATHEMATICS.concepts.filter(c => c.id === id).length === 1
      && areaOf(MATHEMATICS, id) === areaId),
    ids.map(id => `${id}:${areaOf(MATHEMATICS, id)}`).join(' '))
}

/*
 * The edges that used to cross the two dissolved boundaries, named one by one.
 *
 * Every one of them is declared by a node that was already inside one of the
 * two merging areas, so the edge rule says none should have needed touching —
 * which is exactly why they are the ones worth naming. An edge nobody had to
 * think about is the edge a bulk move deletes.
 */
const SURVIVING = [
  ['negative-numbers', 'absolute-value'],
  ['real-number-line', 'linear-inequalities'],
  ['ratio-and-rate', 'word-problems'],
  ['ratio-and-rate', 'percent'],
  ['absolute-value', 'absolute-value-equations'],
  ['decimal-representation', 'scientific-notation'],
  ['circles', 'circles-analytic'],
  ['cartesian-plane', 'distance-and-midpoint'],
  ['congruence', 'plane-transformations'],
  ['linear-inequalities', 'loci-and-regions'],
  ['solid-geometry', 'three-dimensional-coordinates'],
]
t('every edge across the two dissolved boundaries is still in the composed map',
  SURVIVING.every(([from, to]) => prerequisitesOf(MATHEMATICS, to).includes(from)),
  SURVIVING.filter(([from, to]) => !prerequisitesOf(MATHEMATICS, to).includes(from))
    .map(([f, x]) => `${f}->${x}`).join(', '))
/*
 * Four of them stopped crossing anything, which is what a merge is FOR — and
 * the last of the four is the one that clears the deadlock rather than merely
 * surviving it. `three-dimensional-coordinates` was blocked without its own
 * area ever being near the floor, because it waits on `solid-geometry` in the
 * area that HAD run out of room. Both ends are in one area now.
 *
 * THREE, SINCE `real-number-line` WAS AUTHORED, and the direction of that is
 * worth getting right rather than reading as a loss. The merge made
 * `real-number-line → linear-inequalities` internal to one area; the promotion
 * took the lower end out of every area, because an authored concept is not a
 * node of one. So the edge crosses a file boundary again and is resolved by
 * `composeAtlas` instead of by `areaOntology` — which is the merge's gain
 * being SPENT on exactly what it was bought for, not reversed. It is still in
 * `SURVIVING` above, where the claim is only that the edge exists.
 */
const NOW_INTERNAL = [
  ['ratio-and-rate', 'word-problems'],
  ['circles', 'circles-analytic'],
  ['solid-geometry', 'three-dimensional-coordinates'],
]
t('and three of them are internal to one area now, the solids and three dimensions among them',
  NOW_INTERNAL.every(([from, to]) => areaOf(MATHEMATICS, from) === areaOf(MATHEMATICS, to)),
  NOW_INTERNAL.map(([f, x]) =>
    `${f}@${areaOf(MATHEMATICS, f)} -> ${x}@${areaOf(MATHEMATICS, x)}`).join(' | '))

/*
 * Hazard 2 in its general form, asserted over the whole atlas rather than over
 * the merged areas alone. `links` exists for an edge NEITHER of whose owners is
 * a node of the area; an entry that has drifted inside one is a duplicate edge
 * waiting to happen, and a merge is precisely when it would drift.
 */
const internalLinks = AREAS.flatMap(a => {
  const own = new Set(a.nodes.map(n => n.id))
  return (a.links ?? []).filter(l => own.has(l.from) && own.has(l.to))
    .map(l => `${a.id}: ${l.from}->${l.to}`)
})
t('no `links` entry has both of its ends inside its own area', internalLinks.length === 0,
  internalLinks.join(' | '))

const dupes = (() => {
  const count = new Map()
  for (const e of MATHEMATICS.edges) {
    const k = `${e.from}|${e.to}|${e.kind}`
    count.set(k, (count.get(k) ?? 0) + 1)
  }
  return [...count].filter(([, n]) => n > 1).map(([k, n]) => `${k} x${n}`)
})()
t('and the composed graph holds no edge twice', dupes.length === 0, dupes.join(' | '))

/*
 * The interference inventory. Stated as a property over every `confusedWith`
 * on the map rather than as a count, so it keeps holding as more are authored
 * — a count would have to be edited by whoever adds the next one, and an
 * assertion somebody has to edit is an assertion somebody will edit wrongly.
 */
const declaredInterference = AREAS.flatMap(a =>
  a.nodes.flatMap(n => (n.confusedWith ?? []).map(c => ({ from: n.id, to: c.id }))))
t('every confusedWith on the map became an interferes_with edge carrying its reason',
  declaredInterference.length > 0 && declaredInterference.every(d =>
    MATHEMATICS.edges.some(e => e.kind === 'interferes_with' && !!e.rationale
      && e.from === d.from && e.to === d.to)),
  declaredInterference.filter(d => !MATHEMATICS.edges.some(e =>
    e.kind === 'interferes_with' && e.from === d.from && e.to === d.to))
    .map(d => `${d.from}~${d.to}`).join(' '))
const ALGEBRA = AREAS.find(a => a.id === 'algebra-foundations')
const algebraInterference = ALGEBRA.nodes
  .flatMap(n => (n.confusedWith ?? []).map(c => `${n.id}~${c.id}`)).join(' ')
t('the merged algebra area declares exactly one, and both of its ends were already in it',
  algebraInterference === 'linear-inequalities~linear-equations'
  && ['linear-inequalities', 'linear-equations']
    .every(id => areaOf(MATHEMATICS, id) === 'algebra-foundations'),
  `${algebraInterference} | linear-equations@${areaOf(MATHEMATICS, 'linear-equations')}`)
t('and the merged geometry area declares none, which is why that merge stranded none',
  EUCLID.nodes.every(n => !(n.confusedWith ?? []).length),
  EUCLID.nodes.filter(n => (n.confusedWith ?? []).length).map(n => n.id).join(' '))

/**
 * THE MERGED ALGEBRA AREA'S OWN ROOTS, BY NAME — AN ASSERTION THAT WAS CLAIMED
 * AND DID NOT EXIST.
 *
 * atlas-foundations.ts has been saying, above this area's node list, that the
 * root set is "asserted by NAMED membership" in this file. It was not. The
 * named check was written for `euclidean-geometry` (see the group further
 * down) and never for this area, so the comment was true of the sibling and
 * read as true of itself. The `real-number-line` promotion is what surfaced
 * it: that node WAS a root of the area, the set went from eight to seven, and
 * nothing here would have noticed.
 *
 * `areaOntology` keeps only edges internal to the area, so a root here means
 * "every prerequisite of this node has been authored out from under it" rather
 * than "nothing comes before it in mathematics". That is why the set grows and
 * shrinks as authoring proceeds, and why it must be checked by membership: a
 * promotion substitutes into it when the departing node was the LAST in-area
 * prerequisite of a dependent, and shrinks it otherwise, so the size can stay
 * put while every claim changes.
 *
 * Seven, and `real-number-line` is absent for a reason the set itself records:
 * `linear-inequalities` rests on it and did NOT take its place, because its
 * other prerequisite `linear-equations` is still a node here and still gates
 * it from inside.
 */
t('the merged algebra area has exactly these seven roots, and the promoted real line is not among them',
  roots(areaOntology(ALGEBRA)).slice().sort().join(' ')
    === 'absolute-value binomial-theorem complex-numbers linear-equations radical-equations '
      + 'ratio-and-rate scientific-notation',
  roots(areaOntology(ALGEBRA)).slice().sort().join(' '))
t('and linear-inequalities did not become one, because linear-equations still gates it from inside',
  ALGEBRA.nodes.some(n => n.id === 'linear-inequalities'
    && (n.needs ?? []).includes('real-number-line')
    && (n.needs ?? []).includes('linear-equations'))
  && ALGEBRA.nodes.some(n => n.id === 'linear-equations')
  && !roots(areaOntology(ALGEBRA)).includes('linear-inequalities'))

// ---------------------------------------------------------------------------

/**
 * THE DEADLOCK THE MERGES EXISTED TO BREAK, ASSERTED AS A BUDGET.
 *
 * "No area is a stub" above is the check, it is unchanged, and it must stay
 * unchanged — it is the only thing between this map and a scatter of one-node
 * areas. What was wrong was never the check but the map: two areas had drained
 * to the point where the concepts the unfinished journeys still need could not
 * be authored without tripping it, so authoring kept choosing against them and
 * recording them as "area-floor casualties" instead.
 *
 * So the claim worth holding is not "the floor passes today" — it passed
 * before the merges too, which is exactly why the deadlock was invisible to
 * this suite. It is that the floor will STILL pass once every concept the two
 * unfinished journeys need has been written. That is the deadlock being gone
 * rather than postponed, and it is the only real test of this change.
 *
 * The table is named membership deliberately. It rots the moment a concept is
 * authored (the id stops being a node of its area) or renamed, and the first
 * assertion in each pair fails loudly on that rather than going vacuous —
 * which is what a bare `length` comparison here would do.
 */
group('promoting every remaining route concept still clears the stub floor')

const STUB_FLOOR = 5
const ROUTE_STILL_UNWRITTEN = {
  'algebra-foundations': [
    'ratio-and-rate', 'linear-equations', 'systems-of-linear-equations',
  ],
  'euclidean-geometry': [
    'geometric-proof', 'area-and-perimeter', 'circles', 'circle-measure', 'solid-geometry',
    'dot-product-geometry', 'three-dimensional-coordinates',
  ],
  trigonometry: ['right-triangle-trig'],
  'linear-algebra': ['gaussian-elimination'],
}
for (const [areaId, ids] of Object.entries(ROUTE_STILL_UNWRITTEN)) {
  const area = AREAS.find(a => a.id === areaId)
  t(`${areaId}: every route concept named is really an unwritten node of it`,
    !!area && ids.every(id =>
      area.nodes.some(n => n.id === id) && !isTeachable(MATHEMATICS, id)),
    ids.filter(id => !area?.nodes.some(n => n.id === id) || isTeachable(MATHEMATICS, id))
      .join(', '))
  t(`${areaId}: ${area.nodes.length} nodes less the ${ids.length} still to author `
    + `leaves ${area.nodes.length - ids.length}, clear of the floor`,
    area.nodes.length - ids.length >= STUB_FLOOR,
    `${area.nodes.length} - ${ids.length} = ${area.nodes.length - ids.length} < ${STUB_FLOOR}`)
}

/*
 * The five that were blocked before the merges, named individually. The
 * per-area sums above would still pass if one of these had quietly been moved
 * somewhere roomy for the wrong reason, or authored by accident, so each is
 * checked on its own and its area is printed either way.
 *
 * ONE OF THE FIVE HAS SINCE BEEN WRITTEN, which is the outcome this group was
 * waiting for and not a failure of it. `real-number-line` is an authored
 * concept of `arithmetic-foundations` now, so it is in no area and the
 * headroom question stops applying to it — it is asserted in the group above
 * instead, as a promotion that happened. Splitting the list in two rather
 * than dropping the id is deliberate: "it was blocked and is now written" and
 * "it was blocked and is now merely unblocked" are different claims, and
 * collapsing them would lose the only record that the merge has been cashed
 * in once rather than only argued for.
 */
const WAS_BLOCKED_NOW_WRITTEN = ['real-number-line']
const WAS_BLOCKED = [
  'ratio-and-rate', 'circle-measure', 'solid-geometry', 'three-dimensional-coordinates',
]
t('the one previously blocked concept that has since been authored is really authored, and out of every area',
  WAS_BLOCKED_NOW_WRITTEN.every(id =>
    isTeachable(MATHEMATICS, id) && !AREAS.some(a => a.nodes.some(n => n.id === id))),
  WAS_BLOCKED_NOW_WRITTEN.map(id =>
    `${id}:${isTeachable(MATHEMATICS, id) ? 'written' : 'UNWRITTEN'}@`
    + `${AREAS.find(a => a.nodes.some(n => n.id === id))?.id ?? 'no area'}`).join(' '))
t('each of the four still-unwritten ones sits in an area with headroom',
  WAS_BLOCKED.every(id => {
    const area = AREAS.find(a => a.nodes.some(n => n.id === id))
    if (!area || isTeachable(MATHEMATICS, id)) return false
    return area.nodes.length - (ROUTE_STILL_UNWRITTEN[area.id] ?? []).length >= STUB_FLOOR
  }),
  WAS_BLOCKED.map(id => {
    const area = AREAS.find(a => a.nodes.some(n => n.id === id))
    return `${id}:${area?.id ?? 'MISSING'}(${area?.nodes.length ?? 0})`
  }).join(' '))
/*
 * And the other thing "blocked" meant. A concept whose prerequisites are all
 * authored is mechanically ready to write, and the floor was the ONLY thing
 * stopping these two — ontology-geometry.ts says so three promotions running.
 * So they have to be ready now, or the merge did not do what it was for.
 *
 * `real-number-line` was the first of the pair and has been written, so what
 * is asserted of it here is the stronger thing: that its prerequisites are
 * still authored AND it is now one of them for something else. `ratio-and-rate`
 * is still only ready, which is the state the whole group is about.
 */
t('ratio-and-rate is still mechanically ready — every prerequisite authored',
  prerequisitesOf(MATHEMATICS, 'ratio-and-rate').length > 0
  && prerequisitesOf(MATHEMATICS, 'ratio-and-rate')
    .every(p => isTeachable(MATHEMATICS, p)),
  `ratio-and-rate:[${prerequisitesOf(MATHEMATICS, 'ratio-and-rate')
    .map(p => `${p}${isTeachable(MATHEMATICS, p) ? '*' : ''}`).join(' ')}]`)
t('and the real line went past ready into written, so it gates rather than being gated',
  isTeachable(MATHEMATICS, 'real-number-line')
  && prerequisitesOf(MATHEMATICS, 'real-number-line')
    .every(p => isTeachable(MATHEMATICS, p))
  && dependentsOf(MATHEMATICS, 'real-number-line').length > 0,
  `[${prerequisitesOf(MATHEMATICS, 'real-number-line').join(' ')}] → real-number-line → `
  + `[${dependentsOf(MATHEMATICS, 'real-number-line').join(' ')}]`)

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
