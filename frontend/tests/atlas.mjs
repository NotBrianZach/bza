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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
    // probe.ts is tested HERE rather than in concepts-logic.mjs because its
    // material is the COMPOSED atlas. Most `interferes_with` edges arrive from
    // map nodes' `confusedWith` during composeAtlas, so a single authored
    // ontology does not have the edges a probe is built from.
    join('lib', 'concepts', 'probe.ts'),
    // armature.ts imports AREAS from atlas.ts, which is the point of it being
    // here: the region table is checked against the live atlas rather than a
    // snapshot, so a renamed area id fails this harness.
    join('lib', 'concepts', 'armature.ts'),
    // The GM's prompt. Pure, so the prohibitions that keep a narrator from
    // ruling on a learner are assertable rather than merely written down.
    join('lib', 'concepts', 'narrate.ts'),
    // The table's mechanics: tiers, dice, bands. Pure, so the one place a
    // random number enters the engine is testable with the draw injected.
    join('lib', 'concepts', 'rpg.ts'),
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
  teachingOrder, claimableChainFor, dependentsOf, allPrerequisitesOf, conceptById,
} = registry
/*
 * `FUNCTIONS_AND_INVERSES` by name as well as through `ONTOLOGIES`, because the
 * sequences group asserts that a stranded edge is in THAT ontology's own edge
 * list. Reaching it by index would re-break what the expressions-and-equations
 * block learned: a positional reference keeps reading correctly until the
 * registry is reordered, and then asserts the wrong subject in silence.
 *
 * `RATIONAL_EXPRESSIONS` is here for the same reason, added by the nineteenth
 * promotion: its group asserts that the binomial theorem's `encompasses` edge
 * is in THAT ontology's edge list specifically, since that is the edge no
 * `links` entry could have carried and the reason the subject was chosen.
 */
const { ONTOLOGIES, FUNCTIONS_AND_INVERSES: FUNCTIONS, RATIONAL_EXPRESSIONS } = ontology
const offerings = req(join(outDir, 'concepts', 'offerings.js'))
const { conceptsInOffering, relatedConcepts, conceptHref } = offerings
const {
  probesFor, probesAcross, probeContext, probePrompt, probeNudgePrompt,
} = req(join(outDir, 'concepts', 'probe.js'))
const {
  ARMATURE_CENTER, armatureProblems, inwardOf, regionBy, regionCoverage, regionForArea,
  regionForConcept, REGIONS: ARMATURE_REGIONS,
  regions: armatureRegions,
} = req(join(outDir, 'concepts', 'armature.js'))
const {
  SYSTEM: GM_SYSTEM, TABLE_SYSTEM, parseRollExpression, scenePrompt, settingOf,
  splitRollRequest, tablePrompt, unnarratedScene,
} = req(join(outDir, 'concepts', 'narrate.js'))
const {
  BACKGROUNDS, DEFAULT_CHARACTER, MAX_TRAIT, RACES, SIDES, isMade, raceOf, readBand,
  rollFor, sheetFor,
} = req(join(outDir, 'concepts', 'rpg.js'))
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
    'decimal-representation', 'real-number-line', 'ratio-and-rate']
    .every(id => MATHEMATICS.concepts.filter(c => c.id === id).length === 1))
t('and they carry their own subject, not the area they left',
  MATHEMATICS.concepts.filter(c => c.subjectId === 'arithmetic-foundations').length === 12)
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
 * AND IT WAS PROMOTED IN TURN, WHICH LOOKED LIKE THE END OF THE TWO-EDGE FORM
 * AND WAS NOT. This paragraph said the form was "gone from this subject with no
 * successor", and gave its reason: nothing still on the map named two authored
 * arithmetic concepts in its own `needs`, because `percent` named
 * `ratio-and-rate` — then a map node — alongside `decimal-representation`.
 *
 * The twelfth promotion authored `ratio-and-rate`, so `percent` now names two
 * authored arithmetic concepts and IS the successor this paragraph said did not
 * exist. The prediction was sound and its premise expired, which is the normal
 * way a claim about an unfinished map stops being true — so it is corrected
 * rather than deleted, and the two-edge assertion is restored below instead of
 * being left as a gap somebody fills with a wrong example.
 *
 * `scientific-notation` and `linear-inequalities` still name exactly one each,
 * so `percent` is the only node that can play this role.
 *
 * All three are worth asserting rather than one. A bug in `composeAtlas`'s edge
 * resolution could resolve an edge into an area that kept its node and drop one
 * into an area that did not, and these differ on exactly that.
 */
t('the nodes that used to need them still do, across the file boundary',
  prerequisitesOf(MATHEMATICS, 'absolute-value').includes('negative-numbers')
  && prerequisitesOf(MATHEMATICS, 'linear-inequalities').includes('real-number-line'),
  `${prerequisitesOf(MATHEMATICS, 'absolute-value').join('/')} | `
  + prerequisitesOf(MATHEMATICS, 'linear-inequalities').join('/'))
t('and the two-edge form is back: percent rests on two authored arithmetic concepts at once',
  ['ratio-and-rate', 'decimal-representation'].every(id =>
    prerequisitesOf(MATHEMATICS, 'percent').includes(id)
    && isTeachable(MATHEMATICS, id)
    && areaOf(MATHEMATICS, id) === 'arithmetic-foundations')
  && AREAS.find(a => a.id === 'algebra-foundations').nodes.some(n => n.id === 'percent'),
  prerequisitesOf(MATHEMATICS, 'percent')
    .map(id => `${id}@${areaOf(MATHEMATICS, id)}`).join(' '))
/*
 * And the half of that which is easy to lose: `percent` is the DECLARING end
 * and it stayed on the map, so neither edge needed a `links` entry. A promotion
 * costs one only when neither end of an edge is a node of the area — not, as
 * two comments in this codebase used to say, whenever something that stayed
 * depended on the node that left. Asserted because the wrong rule predicts a
 * `links` entry here, and a spurious one would be a duplicate edge waiting to
 * happen.
 */
t('and neither of those edges needed a links entry, since percent itself stayed',
  (AREAS.find(a => a.id === 'algebra-foundations').links ?? [])
    .every(l => l.to !== 'percent'),
  (AREAS.find(a => a.id === 'algebra-foundations').links ?? [])
    .map(l => `${l.from}->${l.to}`).join(' '))
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

/*
 * Seven, not four, and the three it gained all came from a DIFFERENT AREA and
 * from the same FILE — `sequences`, then `sigma-notation`, then
 * `functions-of-several-variables`, the first two nodes of
 * `sequences-and-series` and the third the root node of
 * `multivariable-calculus`, all three in atlas-analysis.ts. The subject's own
 * assertions are all phrased over `FN_IDS` rather than over the `functions`
 * area, so they kept holding through all three; the groups below are what
 * check each promotion.
 *
 * Three of the seven are therefore NOT in the `functions` map area, which is
 * why this number is not a statement about that area's size and never was.
 */
t('the subject contributes seven concepts to the map', FN_IDS.size === 7, `${FN_IDS.size}`)
/*
 * And by NAME, because the count alone cannot say which seven. Three of these
 * were analysis-file nodes and four were written here, and once a node is
 * promoted the composed map stops recording where it came from — `areaOf`
 * reports the SUBJECT for every authored concept, so there is nothing to read
 * the origin off. The names are the only durable form of the claim.
 */
t('and they are these seven, three of them promoted in from the analysis file',
  [...FN_IDS].sort().join(' ')
    === 'domain-and-range function-composition function-concept '
      + 'functions-of-several-variables inverse-functions sequences sigma-notation',
  [...FN_IDS].sort().join(' '))
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
 * THE FIFTH CONCEPT OF `functions-and-inverses` CAME OUT OF ANALYSIS, AND IT
 * IS THE FIRST PROMOTION OUT OF atlas-analysis.ts.
 *
 * `sequences` was the root node of `sequences-and-series`. Every earlier
 * promotion in this build left `atlas-foundations.ts` or `atlas-structures.ts`,
 * so what is new here is only the file; the MOVE rule is the same one, and the
 * note where the node sat writes it out rather than pointing at the
 * foundations file, because a reader arriving at that file first should not
 * have to go looking.
 *
 * Three things are asserted that no existing group covers, and each of them is
 * a documented way for a promotion to lose something silently:
 *
 *  - The stranded edge went to the ONTOLOGY and `links` stayed empty. That is
 *    the cheap case, and it is cheap because both endpoints finished inside
 *    one ontology — not because this area is tidy. Asserted from both ends, so
 *    an edge written in neither place fails here rather than leaving
 *    `arithmetic-sequences` resting on nothing.
 *  - The root set of the area GREW, one to three, because the departing node
 *    was the only in-area prerequisite of all three nodes above it. Checked by
 *    NAMED MEMBERSHIP: `atlas-foundations.ts` records both halves of that rule
 *    firing out of one area, and the whole point of the record is that a size
 *    check passes while every member turns over.
 *  - The anchor on the scope pattern survived the move. The node's
 *    `/^sequence\b/i` is what keeps the article "Sequence" off
 *    `arithmetic-sequences` and `sequence-convergence`, and a promotion that
 *    relaxed it while copying it across would keep the TITLES group below
 *    green — that group asserts the title resolves HERE, and a widened pattern
 *    still would — while silently claiming three other nodes' articles.
 */
group('a sequence is a function on the naturals, so it left analysis for the functions subject')

const SEQ_AREA = AREAS.find(a => a.id === 'sequences-and-series')
/*
 * The three nodes that rested on `sequences` when it was promoted, split by
 * where they are NOW. Two are still nodes of this area; `sigma-notation` has
 * since been promoted into the same subject, so the claim "the node that
 * stayed still owns its edge" is no longer true of it and asserting it over
 * all three would be asserting the wrong thing about the third.
 *
 * Kept as two named lists rather than one, because the edge still exists and
 * still has to be checked — it just moved from a map node's `needs` to the
 * ontology's `EDGES`, which is a different place to look. A single list would
 * have had to drop whichever half it could not express.
 */
const SEQ_DEPENDENTS = ['arithmetic-sequences', 'geometric-sequences']
const SEQ_DEPENDENTS_PROMOTED = ['sigma-notation']

t('the area no longer declares the node, and it carries the functions subject',
  SEQ_AREA.nodes.every(n => n.id !== 'sequences')
  && areaOf(MATHEMATICS, 'sequences') === 'functions-and-inverses',
  `${areaOf(MATHEMATICS, 'sequences')}, `
  + `node here: ${SEQ_AREA.nodes.some(n => n.id === 'sequences')}`)
t('and it is teachable AND practisable — a syllabus entry, not a renamed skeleton',
  isTeachable(MATHEMATICS, 'sequences') && isPractisable(MATHEMATICS, 'sequences'))
/*
 * The floor literal rather than the `STUB_FLOOR` constant, which is declared
 * further down this file and would be in its temporal dead zone here — the same
 * note the trigonometry, geometry and linear-algebra departures carry. The
 * number is restated in the message so a changed floor is visible either way.
 */
t('nine nodes left after the two departures, four clear of the floor',
  SEQ_AREA.nodes.length === 9 && SEQ_AREA.nodes.length - 5 === 4,
  `${SEQ_AREA.nodes.length} nodes, ${SEQ_AREA.nodes.length - 5} of headroom`)

t('its one stranded edge is in the ontology, and this area gave up no links entry',
  FUNCTIONS.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'function-concept' && e.to === 'sequences')
  && (SEQ_AREA.links ?? []).length === 0
  && MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
    && e.from === 'function-concept' && e.to === 'sequences').length === 1,
  `${(SEQ_AREA.links ?? []).length} links, `
  + `${MATHEMATICS.edges.filter(e => e.from === 'function-concept' && e.to === 'sequences').length} `
  + 'composed edge(s)')
/*
 * The duplicate that `composeAtlas` would not notice. One prerequisite edge in
 * the composed map, counted above — a `links` entry added here "for symmetry"
 * beside the ontology edge would emit two, and a duplicate gates exactly like
 * a single one.
 */
t('and nothing was handed back — an empty links list had nothing to collapse',
  !(SEQ_AREA.links ?? []).some(l => l.from === 'sequences' || l.to === 'sequences'))

t('the edges pointing into it survive, declared by the nodes that stayed',
  SEQ_DEPENDENTS.every(id =>
    SEQ_AREA.nodes.some(n => n.id === id && (n.needs ?? []).includes('sequences'))
    && prerequisitesOf(MATHEMATICS, id).includes('sequences')),
  SEQ_DEPENDENTS.map(id => `${id}:${prerequisitesOf(MATHEMATICS, id).join('/')}`).join(' '))
/*
 * And the third one survives too, from its new home. This is the shape a
 * promotion hands to the NEXT promotion out of the same area: the edge did not
 * change — it is still `sequences → sigma-notation` — but the node that
 * declared it is gone, so the declaration had to move into the ontology both
 * ends now live in. Asserted from both ends, as the links claim above is, so
 * an edge written in neither place fails here rather than leaving a concept
 * resting on nothing.
 */
t('and so does the third, re-declared in the ontology after it was promoted too',
  SEQ_DEPENDENTS_PROMOTED.every(id =>
    !SEQ_AREA.nodes.some(n => n.id === id)
    && FUNCTIONS.edges.some(e => e.kind === 'prerequisite'
      && e.from === 'sequences' && e.to === id && !!e.promotedBy)
    && MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
      && e.from === 'sequences' && e.to === id).length === 1),
  SEQ_DEPENDENTS_PROMOTED.map(id =>
    `${id}:${prerequisitesOf(MATHEMATICS, id).join('/')} `
    + `x${MATHEMATICS.edges.filter(e => e.from === 'sequences' && e.to === id).length}`).join(' '))
/*
 * The gate tightening, and BOTH halves are named for the reason the geometry
 * group gives: a test asking only "is it gated by something" would have passed
 * before and after. `geometric-sequences` has had `exponential-functions`
 * since it was written, so it was already gated by teachable material; what
 * changed for all three is that `sequences` itself now appears in the gating
 * set, where the walk used to look straight through it.
 */
t('and all three are now gated BY it, where the walk used to look through it',
  SEQ_DEPENDENTS.concat(SEQ_DEPENDENTS_PROMOTED)
    .every(id => gatingPrerequisitesOf(MATHEMATICS, id).includes('sequences')),
  SEQ_DEPENDENTS.concat(SEQ_DEPENDENTS_PROMOTED)
    .map(id => `${id}:${gatingPrerequisitesOf(MATHEMATICS, id).join('/')}`).join(' '))

/*
 * Named membership, never a count, AND THIS AREA IS NOW THE PROOF OF WHY.
 *
 * The first promotion took the root set 1 → 3: `sequences` was the only root
 * and the only in-area prerequisite of all three nodes above it, so all three
 * took its place at once. A count would have caught that one.
 *
 * The second promotion took it 3 → 3 and changed a member.
 * `sigma-notation` left, and `mathematical-induction` became a root because
 * `sigma-notation` was its only in-area prerequisite — its other `needs`,
 * `geometric-proof`, is geometry's. `infinite-series` did NOT become a root,
 * because it needs `sequence-convergence` as well and that is still here. So
 * the size held while a third of the membership turned over, which is exactly
 * the failure atlas-foundations.ts predicted and the reason this assertion
 * names its members.
 */
t('the area root set held at three while a member turned over',
  roots(areaOntology(SEQ_AREA)).slice().sort().join(' ')
    === 'arithmetic-sequences geometric-sequences mathematical-induction',
  roots(areaOntology(SEQ_AREA)).slice().sort().join(' '))
/*
 * The substitution itself, stated as the reason rather than the outcome: the
 * node that arrived did so because the departing one was its last prerequisite
 * inside the area, and the node that did not arrive has one left.
 */
t('and the substitution happened for the stated reason, not by coincidence',
  (SEQ_AREA.nodes.find(n => n.id === 'mathematical-induction').needs ?? [])
    .every(id => !SEQ_AREA.nodes.some(n => n.id === id))
  && (SEQ_AREA.nodes.find(n => n.id === 'infinite-series').needs ?? [])
    .some(id => SEQ_AREA.nodes.some(n => n.id === id)),
  `induction needs ${SEQ_AREA.nodes.find(n => n.id === 'mathematical-induction').needs.join('/')}, `
  + `series needs ${SEQ_AREA.nodes.find(n => n.id === 'infinite-series').needs.join('/')}`)

/*
 * The stranding no suite catches, asserted as an absence that stays true.
 * `expandEdges` turns `confusedWith` into `interferes_with`, so deleting a node
 * carrying one deletes that edge — and interference constrains SELECTION, not
 * gating, so every suite stays green. This node declared none, and the area's
 * one interference is between two nodes that both STAYED. Asserted together so
 * the next promotion out of either of those two cannot quietly take it.
 */
t('it stranded no interference, and the area\'s one pair is still both on the map',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'sequences' || e.to === 'sequences'))
  && MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && e.from === 'geometric-sequences' && e.to === 'arithmetic-sequences')
  && ['geometric-sequences', 'arithmetic-sequences']
    .every(id => SEQ_AREA.nodes.some(n => n.id === id)),
  MATHEMATICS.edges.filter(e => e.kind === 'interferes_with'
    && SEQ_DEPENDENTS.concat('sequences').some(id => e.from === id || e.to === id))
    .map(e => `${e.from}~${e.to}`).join(' ') || 'none')

/*
 * The pattern survived the move WITH ITS ANCHOR. Asserted as the regex source
 * rather than by testing one title, because the TITLES group below already
 * checks that "Sequence" lands here and would keep passing on a widened
 * pattern — it is the three articles the anchor EXCLUDES that a relaxation
 * would quietly capture, and the anchor is the only thing excluding them.
 */
t('the scope pattern came across anchored, so it still takes only the bare article',
  conceptById(MATHEMATICS, 'sequences').scope.match.source === '^sequence\\b',
  conceptById(MATHEMATICS, 'sequences').scope.match.source)
t('and the subject claims it is checked, which that pattern earns',
  conceptById(MATHEMATICS, 'sequences').fidelity === 'checked')

/*
 * The credit edge, asserted because the comparable one was DELETED rather than
 * restated when `gcd-and-lcm` was promoted — two of its three tasks never
 * touched a factorisation. Here all three substitute a number into a rule, so
 * the claim holds, and asserting it keeps the difference between the two cases
 * on the record rather than in one file's comment.
 */
t('practising a sequence claims credit for the function concept, which every task earns',
  MATHEMATICS.edges.some(e => e.kind === 'encompasses'
    && e.from === 'sequences' && e.to === 'function-concept' && !!e.rationale))

// ---------------------------------------------------------------------------

/**
 * THE SIXTEENTH PROMOTION WENT UP THE SAME AREA, AND IT IS THE FIRST ONE NO
 * JOURNEY ASKED FOR.
 *
 * `sigma-notation` was the node directly above `sequences`. What is new about
 * it, and what each assertion below is for:
 *
 *  - ROUTE DEMAND SELECTED NOTHING. Every journey has read zero unwritten
 *    steps on route since the fourteenth promotion, so the ranking every
 *    earlier promotion used had expired. Asserted here, because a future run
 *    reading these groups top to bottom would otherwise infer that the
 *    promotion order is route order and look for a route that wanted this.
 *  - THE CHEAP `links` CASE REPEATED, AND ONLY BECAUSE OF THE ORDER. Its one
 *    `needs` was `sequences`, which the previous promotion had just moved into
 *    that ontology. Promoted first, the identical `needs` would have pointed
 *    at a map node and cost a `links` entry. Asserted as the counterfactual it
 *    is, by naming the node in this area that still could not avoid one.
 *  - THE ROOT SET HELD AT THREE AND TURNED A MEMBER OVER. That assertion lives
 *    with the first promotion's group above, since it is the same set.
 *  - FIVE DEPENDENTS ACROSS THREE MAP FILES, none of which was edited. This is
 *    the largest dependent set any promotion in this build has had, and it is
 *    the clearest case of the rule that an edge belongs to the node declaring
 *    it: five edges survived a deletion untouched.
 */
group('the sixteenth promotion followed the fifteenth up its own area')

const SIGMA_DEPENDENTS = [
  'mathematical-induction', 'infinite-series', 'riemann-sums',
  'expectation', 'descriptive-statistics',
]

t('it left the area and is a concept of the functions subject, with material',
  !SEQ_AREA.nodes.some(n => n.id === 'sigma-notation')
  && areaOf(MATHEMATICS, 'sigma-notation') === 'functions-and-inverses'
  && isTeachable(MATHEMATICS, 'sigma-notation')
  && isPractisable(MATHEMATICS, 'sigma-notation'),
  `${areaOf(MATHEMATICS, 'sigma-notation')}, `
  + `node here: ${SEQ_AREA.nodes.some(n => n.id === 'sigma-notation')}`)

/*
 * NO JOURNEY WANTED IT, and that premise is NOT asserted here — it is asserted
 * twice already, by `ROUTE_STILL_UNWRITTEN` being empty further down this file
 * and over the journeys themselves in tests/journeys.mjs. Reaching for that
 * table from here would also be a temporal dead zone, since it is declared
 * below. It is written down because a run reading these promotion groups in
 * order would otherwise infer that promotion order is route order and go
 * looking for the route that asked for this one.
 *
 * What replaced route demand, and this part IS checkable here: the node was
 * READY — every one of its `needs` already teachable — which after the
 * fifteenth promotion meant the single edge from `sequences`. Readiness is a
 * fact about the tree and is the half of a selection decision that can be
 * read off it; rulability and dependent count are the other half and live with
 * the material, in tests/concepts-logic.mjs.
 */
t('its one prerequisite was already teachable, which is what made it promotable',
  prerequisitesOf(MATHEMATICS, 'sigma-notation').join(',') === 'sequences'
  && isTeachable(MATHEMATICS, 'sequences'),
  prerequisitesOf(MATHEMATICS, 'sigma-notation').join(','))

/*
 * The counterfactual, by name. `mathematical-induction` is the node this area
 * hands the expensive case to: it needs `geometric-proof`, which is an
 * authored concept of the GEOMETRY subject, so promoting it could not put that
 * edge in whichever ontology received it — an ontology may only name concepts
 * it contains — and the edge would have to become a `links` entry here.
 *
 * Asserted rather than described, because "links stayed empty twice" reads as
 * a property of this area and is a property of two nodes' prerequisites.
 */
t('the links list is still empty, and the node that proves that was luck is still here',
  (SEQ_AREA.links ?? []).length === 0
  && SEQ_AREA.nodes.some(n => n.id === 'mathematical-induction'
    && (n.needs ?? []).includes('geometric-proof'))
  && conceptById(MATHEMATICS, 'geometric-proof')?.subjectId === 'plane-geometry',
  `${(SEQ_AREA.links ?? []).length} links; geometric-proof is `
  + `${conceptById(MATHEMATICS, 'geometric-proof')?.subjectId ?? 'a map node'}`)

/*
 * Five edges that nobody touched. Each is declared by its own node in its own
 * file — two here, one in integral-calculus, two in atlas-uncertainty.ts — and
 * every one of them now gates, where the walk looked through an unwritten node
 * before. The count is in the message and not in the assertion: what matters
 * is that each NAMED dependent still resolves, since an id dropped from this
 * list would shrink the claim silently.
 */
t('all five dependents still rest on it, across three map files and none of them edited',
  SIGMA_DEPENDENTS.every(id => prerequisitesOf(MATHEMATICS, id).includes('sigma-notation')),
  SIGMA_DEPENDENTS.filter(id => !prerequisitesOf(MATHEMATICS, id).includes('sigma-notation'))
    .join(', ') || 'all five')
t('and it gates every one of them now that it has material',
  SIGMA_DEPENDENTS.every(id => gatingPrerequisitesOf(MATHEMATICS, id).includes('sigma-notation')),
  SIGMA_DEPENDENTS.map(id => `${id}:${gatingPrerequisitesOf(MATHEMATICS, id).includes('sigma-notation')}`)
    .join(' '))
/*
 * Exactly one prerequisite edge into it, as the first promotion's group checks
 * for its own: the duplicate `composeAtlas` would not report is a `links` entry
 * added here beside the ontology edge, and a duplicate gates exactly like a
 * single one.
 */
t('exactly one edge into it in the composed map, so nothing was declared twice',
  MATHEMATICS.edges.filter(e => e.kind === 'prerequisite' && e.to === 'sigma-notation').length === 1
  && MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
    && e.to === 'sigma-notation')[0].from === 'sequences',
  MATHEMATICS.edges.filter(e => e.to === 'sigma-notation')
    .map(e => `${e.from}:${e.kind}`).join(' '))
/*
 * It stranded no interference either, and the area's one pair is STILL both on
 * the map — the same absence the first promotion's group asserts, re-asserted
 * because a second departure is a second chance to delete that edge by
 * accident.
 */
t('it stranded no interference, and the area\'s one pair is still intact',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'sigma-notation' || e.to === 'sigma-notation'))
  && MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && e.from === 'geometric-sequences' && e.to === 'arithmetic-sequences'))
/*
 * NO CREDIT EDGE, AND THAT IS THE DECISION. `sequences` claims one because all
 * three of its tasks substitute a position into a rule; two of this concept's
 * three never produce a term of a sequence at all — the constant-term task's
 * term ignores the index by design, and the linearity task is handed a total it
 * never unpacks. Asserted as an ABSENCE, because an `encompasses` added later
 * "for symmetry" would stop `sequences` coming due when it had gone cold, and
 * nothing else in the build would report it.
 */
t('and it claims no credit for sequences, which two of its three tasks would not earn',
  !MATHEMATICS.edges.some(e => e.kind === 'encompasses' && e.from === 'sigma-notation'),
  MATHEMATICS.edges.filter(e => e.from === 'sigma-notation')
    .map(e => `${e.kind}->${e.to}`).join(' '))

// ---------------------------------------------------------------------------

/**
 * THE TWENTY-FIRST PROMOTION TOOK THE SOLE ROOT OF A WHOLE AREA, AND BOTH
 * SETS IT MOVED TURNED OVER WITHOUT CHANGING SIZE.
 *
 * `functions-of-several-variables` was the root node of `multivariable-
 * calculus` in atlas-analysis.ts and is a concept of `functions-and-inverses`.
 * The material is asserted in tests/concepts-logic.mjs; what is here is the
 * area half, and three things about it are new:
 *
 *  - IT IS THE FIRST PROMOTION INTO THIS SUBJECT TO COST A `links` ENTRY. The
 *    fifteenth and sixteenth each had a single `needs` pointing inside the
 *    receiving ontology, and the sigma group above asserts that was ORDER
 *    rather than tidiness. This one has two `needs` and they land in two
 *    different authored subjects, so one edge could go in the ontology and the
 *    other could only come here. That is the case the counterfactual above
 *    named, arriving.
 *  - THE ROOT SET WENT FROM ONE TO ONE AND SHARES NO MEMBER WITH ITSELF.
 *    `functions-of-several-variables` left and `partial-derivatives` arrived,
 *    because the departed node was the last of its prerequisites INSIDE the
 *    area — its other, `chain-rule`, is a node of `differential-calculus`. A
 *    `length === 1` check passes on both sides of that while every claim it
 *    makes goes stale, which is the whole reason these sets are asserted by
 *    NAMED MEMBERSHIP. It is the cleanest demonstration of it in the file: not
 *    a fan-out, not a shrink, a straight substitution at size one.
 *  - AND THE GATE DID THE SAME THING. `gatingPrerequisitesOf` named ten
 *    ancestors of `partial-derivatives` before this promotion and names ten
 *    now, and the only difference is that `three-dimensional-coordinates` has
 *    been replaced by this concept — which HIDES it, being nearer. So the gate
 *    tightened at constant length. `complex-functions` in atlas-structures.ts
 *    did exactly the same, ten to ten. Neither a count nor a direction-of-
 *    change check says anything useful about that, so both are asserted as the
 *    substitution they are.
 */
group('the twenty-first promotion emptied an area\'s root set and refilled it')

const MULTIVAR = AREAS.find(a => a.id === 'multivariable-calculus')

t('it left the area and is a concept of the functions subject, with material',
  !MULTIVAR.nodes.some(n => n.id === 'functions-of-several-variables')
  && areaOf(MATHEMATICS, 'functions-of-several-variables') === 'functions-and-inverses'
  && isTeachable(MATHEMATICS, 'functions-of-several-variables')
  && isPractisable(MATHEMATICS, 'functions-of-several-variables'),
  `${areaOf(MATHEMATICS, 'functions-of-several-variables')}, node here: `
  + `${MULTIVAR.nodes.some(n => n.id === 'functions-of-several-variables')}`)
/*
 * Eleven nodes, which is the floor claim for this area made locally. "No area
 * is a stub" at the top of this file is the check; this records that the floor
 * had nothing to do with the choice, since eleven against five is six more
 * promotions of slack.
 */
t('the area is eleven nodes, six clear of the stub floor that chose nothing here',
  MULTIVAR.nodes.length === 11 && MULTIVAR.nodes.length - 5 === 6,
  `${MULTIVAR.nodes.length} nodes`)
/*
 * BOTH prerequisites were already teachable, which is what READY means and is
 * the half of the selection decision readable off the tree. The other half —
 * that evaluating a rule in two letters is exact rational arithmetic — lives
 * with the material.
 */
t('both its prerequisites were already teachable, which is what made it promotable',
  prerequisitesOf(MATHEMATICS, 'functions-of-several-variables').slice().sort().join(',')
    === 'domain-and-range,three-dimensional-coordinates'
  && prerequisitesOf(MATHEMATICS, 'functions-of-several-variables')
    .every(id => isTeachable(MATHEMATICS, id)),
  prerequisitesOf(MATHEMATICS, 'functions-of-several-variables')
    .map(id => `${id}:${isTeachable(MATHEMATICS, id)}`).join(' '))
/*
 * THE SPLIT, BY NAME AND BY SIDE. One stranded edge could go in the receiving
 * ontology and the other could not, and the rule that decides it is about which
 * FILE an endpoint is in rather than how well authored it is. So: the
 * `domain-and-range` edge is NOT a link here, and the
 * `three-dimensional-coordinates` edge IS — and the second is checked for
 * being the area's only one, because a second appearing later would mean
 * somebody filed an edge here that had a home.
 */
t('the expensive half is this area\'s one link, and the cheap half is not',
  (MULTIVAR.links ?? []).length === 1
  && MULTIVAR.links[0].from === 'three-dimensional-coordinates'
  && MULTIVAR.links[0].to === 'functions-of-several-variables'
  && !!MULTIVAR.links[0].because,
  (MULTIVAR.links ?? []).map(l => `${l.from}->${l.to}`).join(' ') || 'no links')
t('and the two endpoints really are in two different authored subjects, which is why',
  conceptById(MATHEMATICS, 'three-dimensional-coordinates')?.subjectId
    === 'vectors-and-independence'
  && conceptById(MATHEMATICS, 'domain-and-range')?.subjectId === 'functions-and-inverses',
  `3dc in ${conceptById(MATHEMATICS, 'three-dimensional-coordinates')?.subjectId}, `
  + `domain in ${conceptById(MATHEMATICS, 'domain-and-range')?.subjectId}`)
/*
 * Exactly one edge of each into the concept in the composed map. This is the
 * duplicate `composeAtlas` does not report and no other suite checks: `links`
 * never cared whether an endpoint was a node or a concept, so an entry left
 * beside an ontology edge goes on resolving and the graph carries the edge
 * twice. Checked per endpoint rather than as a total, because two edges from
 * one end and none from the other sums to the same number.
 */
t('one edge from each prerequisite and no duplicates, which composeAtlas would not report',
  ['domain-and-range', 'three-dimensional-coordinates'].every(from =>
    MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
      && e.from === from && e.to === 'functions-of-several-variables').length === 1),
  MATHEMATICS.edges.filter(e => e.to === 'functions-of-several-variables')
    .map(e => `${e.from}:${e.kind}`).join(' '))
/*
 * THE ROOT SUBSTITUTION, BY NAMED MEMBERSHIP, and the RULE beside it rather
 * than just the new name: the arrival is a root because the departed node was
 * its last in-area prerequisite, and its other one is in another area
 * entirely. Both halves checked, since "partial-derivatives is the root" is
 * the observation and "this is why" is the claim.
 */
const MULTIVAR_ROOTS = roots(areaOntology(MULTIVAR))
t('the root set is one, and it is the node that was left behind the departed one',
  MULTIVAR_ROOTS.join(',') === 'partial-derivatives',
  MULTIVAR_ROOTS.join(', '))
t('and it became the root because the departed node was its last in-area prerequisite',
  (() => {
    const node = MULTIVAR.nodes.find(n => n.id === 'partial-derivatives')
    const needs = node?.needs ?? []
    return needs.includes('functions-of-several-variables')
      && needs.includes('chain-rule')
      && MULTIVAR.nodes.every(n => n.id !== 'chain-rule')
      && areaOf(MATHEMATICS, 'chain-rule') === 'differential-calculus'
  })(),
  `partial-derivatives needs `
  + `[${(MULTIVAR.nodes.find(n => n.id === 'partial-derivatives')?.needs ?? []).join(' ')}]`)
/*
 * THE GATE SUBSTITUTED AT CONSTANT LENGTH, in both places it reaches. Measured
 * against the pre-promotion tree rather than predicted: both lists were ten and
 * both are ten, and in each the departed node's own prerequisite
 * `three-dimensional-coordinates` has been replaced by this concept, which
 * stands in front of it. Asserted as "this is in and that is out" because
 * neither the size nor the direction of change distinguishes it from nothing
 * having happened. The gate SHRINKING is only the rule when the promoted
 * concept hides farther ancestors than it replaces; here it hides exactly one
 * and the length is unmoved.
 */
for (const id of ['partial-derivatives', 'complex-functions']) {
  const gate = gatingPrerequisitesOf(MATHEMATICS, id)
  t(`${id} now gates on the pair concept instead of through it to the three dimensions`,
    gate.includes('functions-of-several-variables')
    && !gate.includes('three-dimensional-coordinates')
    && gate.length === 10,
    `${gate.length} entries: ${gate.join(', ')}`)
}
/*
 * It stranded no interference and no credit edge of its own, and the ABSENCE is
 * the assertion: `expandEdges` turns a node's `confusedWith` into an
 * `interferes_with`, so deleting a node deletes that edge, and interference
 * constrains SELECTION rather than gating — every suite stays green while the
 * scheduler is quietly freed. The node declared none, checked before the
 * deletion rather than inferred from this passing.
 */
t('it stranded no interference, and claims none in either direction',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'functions-of-several-variables'
      || e.to === 'functions-of-several-variables')),
  MATHEMATICS.edges.filter(e => e.from === 'functions-of-several-variables'
    || e.to === 'functions-of-several-variables')
    .map(e => `${e.from}-${e.kind}->${e.to}`).join(' '))
/*
 * The two edges pointing IN were left alone, which is the rule an edge is owned
 * by the node declaring it. Both are in other files — `partial-derivatives`
 * here and `complex-functions` in atlas-structures.ts — and both now GATE where
 * they pointed at an unwritten node before.
 */
t('both dependents still rest on it, declared at their own ends in two files',
  ['partial-derivatives', 'complex-functions'].every(id =>
    prerequisitesOf(MATHEMATICS, id).includes('functions-of-several-variables')
    && gatingPrerequisitesOf(MATHEMATICS, id).includes('functions-of-several-variables')),
  ['partial-derivatives', 'complex-functions']
    .map(id => `${id}@${areaOf(MATHEMATICS, id)}`).join(' '))
/*
 * And the pattern came across byte-identical, which matters because the
 * over-broad table further down this file names THIS id against the article
 * "Function (mathematics)". A pattern widened to `/\bfunction\b/i` on the way
 * in would claim `function-concept`'s own article, and that table is the only
 * thing that would say so.
 */
t('the scope pattern came across unwidened, so the bare Function article stays elsewhere',
  conceptById(MATHEMATICS, 'functions-of-several-variables').scope.match.source
    === '\\bfunction of several (real )?variables\\b|\\bmultivariable calculus\\b'
  && conceptById(MATHEMATICS, 'functions-of-several-variables').fidelity === 'checked',
  conceptById(MATHEMATICS, 'functions-of-several-variables').scope.match.source)

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
t('the subject contributes eight concepts', VEC_IDS.size === 8, `${VEC_IDS.size}`)
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
 * been left behind, and a NINTH concept here would mean somebody added one
 * without reading this group. It read `=== 4` until the dot product arrived as
 * the fifth, `=== 5` until the three dimensions arrived as the sixth, `=== 6`
 * until the axioms arrived as the seventh and `=== 7` until the dimension
 * arrived as the eighth; the number is edited deliberately on each promotion
 * rather than relaxed to a floor, because the thing it guards against is a
 * concept appearing with no account of where it came from.
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
 * back and gate what existed before it.
 *
 * AND IT HAD THE SAME WRONG SHAPE, CAUGHT THE SAME WAY — by going red on a
 * promotion that was doing exactly what it should. The functions group a few
 * hundred lines up records this already: its first version said no teachable
 * concept anywhere gates on functions, and `matrices-and-determinants`
 * falsified it by resting on `function-concept` deliberately. This one said no
 * concept of these four SUBJECTS gates on a vectors concept, which is the same
 * mistake wearing a narrower scope, and `functions-of-several-variables` broke
 * it at the twenty-first promotion: it is a concept of `functions-and-inverses`
 * and it rests on `three-dimensional-coordinates` by an edge the MAP declared,
 * which is now `MULTIVARIABLE_CALCULUS.links`.
 *
 * A subject is a GROWING SET, so "the subjects that existed before vectors" is
 * not the same set as "the concepts that existed before vectors" and drifts
 * away from it on every promotion into an older subject. Rewriting the list to
 * exclude this one concept would be the one-sided ratchet — an assertion scoped
 * "everything except the newest member", which has to be widened again by
 * whoever lands the next one and says less each time.
 *
 * So the claim is restated over what "reaching back" actually means: a vectors
 * concept may gate one of these only by being its OWN DECLARED prerequisite,
 * never by being found transitively underneath it. That is the fault the
 * original was reaching for — `gatingPrerequisitesOf` walks to the nearest
 * teachable ancestors, so a subject authored beneath an older one shows up in
 * gates nobody wrote — and it holds no matter how much is authored into these
 * four afterwards.
 */
const BEFORE_VECTORS = [
  'arithmetic-foundations', 'rational-expressions', 'exponents-and-logarithms',
  'functions-and-inverses',
]
const reachedBack = MATHEMATICS.concepts
  .filter(c => BEFORE_VECTORS.includes(c.subjectId))
  .filter(c => gatingPrerequisitesOf(MATHEMATICS, c.id)
    .some(p => VEC_IDS.has(p) && !prerequisitesOf(MATHEMATICS, c.id).includes(p)))
t('nothing here gained a gate on it that it did not declare itself',
  reachedBack.length === 0,
  reachedBack.map(c => `${c.id} via `
    + gatingPrerequisitesOf(MATHEMATICS, c.id).filter(p => VEC_IDS.has(p)).join('/')).join(', '))
/*
 * And the one concept that DOES declare one, by name — because the assertion
 * above is satisfied both by a declared gate and by no gate at all, and those
 * are different states. This is the edge that only exists as an area `links`
 * entry, so it is also the check that the twenty-first promotion did not drop
 * it: nothing in either ontology could name it, and `ontologyProblems` on
 * `functions-and-inverses` stays silent whether it is there or not.
 */
t('and the one that declares one is the pair concept, resting on the three dimensions',
  MATHEMATICS.concepts
    .filter(c => BEFORE_VECTORS.includes(c.subjectId))
    .filter(c => prerequisitesOf(MATHEMATICS, c.id).some(p => VEC_IDS.has(p)))
    .map(c => c.id).join(',') === 'functions-of-several-variables'
  && prerequisitesOf(MATHEMATICS, 'functions-of-several-variables')
    .includes('three-dimensional-coordinates'),
  prerequisitesOf(MATHEMATICS, 'functions-of-several-variables').join(', '))

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

/**
 * THE DOT PRODUCT WAS PROMOTED IN AS THE FIFTH, AND THE SUBJECT STOPPED BEING
 * A CHAIN.
 *
 * It rests on `plane-vectors` and on nothing else in this ontology, so the
 * subject branches at its second concept: one arm runs to the span and
 * independence, the other to the product. That is asserted as the BRANCH POINT
 * by name rather than as an ordered walk of the subject, because an ordered
 * string would have passed the new concept hung off `linear-independence`
 * instead — which is a real mistake somebody will make, the cross-check and the
 * dot product being the same four numbers combined two ways, and it would gate
 * the product behind material it never uses.
 *
 * The other `needs` could not come with it. `right-triangle-trig` is authored
 * in `triangle-trigonometry`, and an ontology may only name concepts it
 * contains, so that edge is a `links` entry of `euclidean-geometry` — the area
 * that owned the departing node. Checked here from the composed side: both
 * prerequisites must resolve, exactly once each, with the two of them stamped
 * by different promoters, which is the one observable difference between the
 * edge that went into the ontology and the edge that had to be rehomed.
 */
group('the dot product was promoted into the vectors subject')
const VECTORS = ONTOLOGIES.find(o => o.subject.id === 'vectors-and-independence')
t('it is a concept of this subject and no longer a node of the geometry area',
  VEC_IDS.has('dot-product-geometry')
  && areaOf(MATHEMATICS, 'dot-product-geometry') === 'vectors-and-independence'
  && AREAS.find(a => a.id === 'euclidean-geometry')
    .nodes.every(n => n.id !== 'dot-product-geometry'),
  areaOf(MATHEMATICS, 'dot-product-geometry'))
t('and it has material, which is the half a collision check cannot see',
  isTeachable(MATHEMATICS, 'dot-product-geometry')
  && isPractisable(VECTORS, 'dot-product-geometry'))
/*
 * THE THIRTEENTH PROMOTION CLOSED THE FORK AGAIN, and the half of this
 * assertion that had to change is the half that was about the OTHER branch.
 *
 * The dot product's own parent is unchanged and still asserted by name: it
 * rests on `plane-vectors` and on nothing else here, which is the mistake worth
 * guarding — hanging it off `linear-independence` instead would gate it behind
 * material it never uses, the cross-check and the product being the same four
 * numbers combined two ways.
 *
 * What moved is `vectors-and-spans`. It used to rest on `plane-vectors` alone,
 * and `three-dimensional-coordinates` is now a second parent of it — the edge
 * came home from `linear-algebra.links` when that node was authored into this
 * subject. So the branch that went to the span rejoins the branch that went to
 * the product, two concepts along, and the subject is a diamond rather than a
 * fork.
 *
 * Asserted as a SET and not as an ordered string, for the reason this file
 * keeps restating: the two parents are sorted before comparison, because
 * `prerequisitesOf` returns edge order and an ordered string would turn a
 * reordering of the `EDGES` array into a failure while accepting a parent hung
 * off the wrong concept.
 */
t('the product hangs off plane-vectors, and span now hangs off the product\'s branch as well',
  prerequisitesOf(VECTORS, 'dot-product-geometry').join(' ') === 'plane-vectors'
  && prerequisitesOf(VECTORS, 'vectors-and-spans').slice().sort().join(' ')
    === 'plane-vectors three-dimensional-coordinates'
  && !allPrerequisitesOf(VECTORS, 'dot-product-geometry').includes('linear-independence'),
  `${prerequisitesOf(VECTORS, 'dot-product-geometry').join(', ')}`
  + ` | ${prerequisitesOf(VECTORS, 'vectors-and-spans').join(', ')}`)
/*
 * And the diamond really closes, which is the claim a pair of parent lists
 * cannot make on its own: the two branches out of `plane-vectors` meet at
 * `vectors-and-spans`, so the dot product is now an ANCESTOR of the span rather
 * than a sibling of it, and the subject still has a teaching order.
 */
t('so the product is now upstream of span, and the subject is still acyclic',
  allPrerequisitesOf(VECTORS, 'vectors-and-spans').includes('dot-product-geometry')
  && allPrerequisitesOf(VECTORS, 'vectors-and-spans').includes('three-dimensional-coordinates')
  && teachingOrder(VECTORS) !== null,
  allPrerequisitesOf(VECTORS, 'vectors-and-spans').join(', '))
t('both of its prerequisites resolve in the composed map, once each',
  ['plane-vectors', 'right-triangle-trig'].every(id =>
    prerequisitesOf(MATHEMATICS, 'dot-product-geometry').includes(id)
    && MATHEMATICS.edges.filter(e =>
      e.from === id && e.to === 'dot-product-geometry' && e.kind === 'prerequisite').length === 1),
  prerequisitesOf(MATHEMATICS, 'dot-product-geometry').join(', '))
t('and the two are stamped differently, the rehomed one by the area that owned the node',
  MATHEMATICS.edges.find(e =>
    e.from === 'plane-vectors' && e.to === 'dot-product-geometry')
    ?.promotedBy === 'author:vectors-and-independence'
  && MATHEMATICS.edges.find(e =>
    e.from === 'right-triangle-trig' && e.to === 'dot-product-geometry')
    ?.promotedBy === 'atlas:euclidean-geometry',
  MATHEMATICS.edges.filter(e => e.to === 'dot-product-geometry')
    .map(e => `${e.from}:${e.promotedBy}`).join(' '))
/*
 * The gate it now imposes, and the two it now has.
 *
 * `three-dimensional-coordinates` is the node above it and was gated by
 * `plane-vectors` and `right-triangle-trig` through the unwritten product;
 * `gatingPrerequisitesOf` names NEAREST authored ancestors, so writing the
 * product replaces both with it — the list shrinks while the gate tightens,
 * which is the reading a count gets backwards and the third time this file has
 * had to say so.
 *
 * `solid-geometry` is the other half of that node's gate and is NOT in the
 * list, because it is unwritten and the walk passes straight through it to
 * `circle-measure`. So the entry below is a statement about what is written,
 * not about what the map says, which is exactly the distinction that makes a
 * promotion worth measuring.
 */
t('the three dimensions are now gated by the product itself, two entries replaced by one',
  gatingPrerequisitesOf(MATHEMATICS, 'three-dimensional-coordinates')
    .includes('dot-product-geometry')
  && !gatingPrerequisitesOf(MATHEMATICS, 'three-dimensional-coordinates')
    .includes('plane-vectors')
  && !gatingPrerequisitesOf(MATHEMATICS, 'three-dimensional-coordinates')
    .includes('right-triangle-trig'),
  gatingPrerequisitesOf(MATHEMATICS, 'three-dimensional-coordinates').join(', '))
t('while its own gate is the two concepts it was promoted above',
  gatingPrerequisitesOf(MATHEMATICS, 'dot-product-geometry').slice().sort().join(' ')
    === 'plane-vectors right-triangle-trig',
  gatingPrerequisitesOf(MATHEMATICS, 'dot-product-geometry').join(', '))
/*
 * The stranding no other check sees. `expandEdges` turns a node's
 * `confusedWith` into an `interferes_with`, so deleting a node deletes that
 * edge and every suite stays green — interference constrains SELECTION rather
 * than gating. This node carried none, which is the fact worth recording:
 * asserted so that "there was nothing to strand" is on the record rather than
 * being indistinguishable from "nobody looked".
 */
t('the node stranded no interference, because it declared none',
  !MATHEMATICS.edges.some(e =>
    e.kind === 'interferes_with'
    && (e.from === 'dot-product-geometry' || e.to === 'dot-product-geometry')),
  MATHEMATICS.edges.filter(e => e.kind === 'interferes_with')
    .map(e => `${e.from}~${e.to}`).join(' '))
/*
 * And the three edges pointing INTO it, which are declared by nodes in three
 * different files and must not have been touched. `inner-product-spaces` is in
 * atlas-structures.ts, `gradient-and-directional` in atlas-analysis.ts, and
 * `three-dimensional-coordinates` in atlas-foundations.ts, so this is the
 * widest into-edge check in the file — and the one most likely to be broken by
 * somebody who thought the promotion was a local edit.
 */
t('the edges pointing into it survive, from all three map files',
  ['three-dimensional-coordinates', 'inner-product-spaces', 'gradient-and-directional'].every(id =>
    prerequisitesOf(MATHEMATICS, id).includes('dot-product-geometry')
    && MATHEMATICS.edges.filter(e =>
      e.from === 'dot-product-geometry' && e.to === id).length === 1),
  MATHEMATICS.edges.filter(e => e.from === 'dot-product-geometry')
    .map(e => `${e.to}:${e.kind}`).join(' '))

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
 * TEN NODES WERE PROMOTED OUT OF THIS AREA — EIGHT OF THEM THE CHEAPEST KIND
 * THE ATLAS HAS, AND TWO OF THEM THE KIND THAT ENDED THE FIRST RUN OF THEM.
 *
 * `points-lines-angles`, `triangle-basics`, `congruence`, `similarity`,
 * `pythagoras`, `quadrilaterals-and-polygons`, `area-and-perimeter`,
 * `geometric-proof`, `circles` and `circle-measure` were the first ten nodes of
 * `euclidean-geometry`, and `distance-and-midpoint` joined them at the
 * fourteenth promotion — the first out of this area whose filing was decided by
 * an edge KIND rather than by subject matter, and the first that no journey had
 * asked for. The eleven are now the eleven concepts of `plane-geometry`. The
 * assertions above already cover the collision half of all eleven moves —
 * `shippedAtlasProblems` would name any node that had been left behind — and
 * the rootless half, by naming the angle facts in `AUTHORED_ROOTS`.
 *
 * This sentence read SEVEN until the ninth promotion, having been left behind
 * by the eighth, and it is worth saying so rather than silently renumbering.
 * The count in a prose header is not an invariant: `DEPARTED` below is the
 * list the assertions actually walk, it had eight entries while this paragraph
 * claimed seven, and nothing went red. Two counts in that change set were a
 * promotion behind — this one and the untimed-points total in
 * ontology-geometry.ts — which is the same fault twice and says something about
 * where to look next time: every hand-maintained number in these files that is
 * NOT read by an assertion has drifted at least once.
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
 *   `area-and-perimeter` IS THE CHEAP CASE WITH TWO EDGES, which is a shape
 *   neither of the two above produced and is what settles what "cheap"
 *   measures. It declared `['quadrilaterals-and-polygons', 'triangle-basics']`
 *   and both were already concepts of `plane-geometry`, so both stranded edges
 *   went to `PLANE_GEOMETRY.edges` and this area's `links` needed no entry.
 *   Every cheap promotion before it had ONE `needs` and every expensive one
 *   had two that split, so the list length and the expense had moved together
 *   by coincidence. They are independent: what costs a `links` entry is an
 *   endpoint outside the ontology the node is joining, however many endpoints
 *   there are.
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
 *   `circle-measure` IS THE CHEAP CASE WITH TWO EDGES FOR THE THIRD TIME, so
 *   what `area-and-perimeter` settled about what "cheap" measures now has three
 *   instances rather than one. It declared `['circles', 'area-and-perimeter']`
 *   and both were concepts of `plane-geometry` by the time it left, so both
 *   stranded edges went to `PLANE_GEOMETRY.edges` and this area's `links`
 *   needed no entry.
 *
 *   What that promotion adds to this list is the other direction, which no
 *   promotion here had had to check. A `links` entry whose two ends BOTH finish
 *   inside one ontology has stopped being a cross-file edge and has to be
 *   DELETED, or `composeAtlas` emits the same prerequisite twice — and a
 *   duplicate gates exactly like a single one, so no assertion in this file
 *   would notice. None of the four entries names this node or either of its
 *   parents, so nothing was handed back. The ordered-list assertion below is
 *   what holds that: it would fail on a collapse that should have happened as
 *   loudly as on one that should not have.
 *
 *   It stranded no `confusedWith` either, which is worth a line because that is
 *   the stranding this suite cannot catch. The node declared none, so there was
 *   no `interferes_with` for `expandEdges` to drop. `similarity` is still the
 *   only promotion out of this area that stranded one.
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
  'quadrilaterals-and-polygons', 'area-and-perimeter', 'geometric-proof', 'circles',
  'circle-measure', 'distance-and-midpoint',
]
t('the area no longer declares any of the eleven, and each carries its own subject',
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
/*
 * FIVE NOW, THE ELEVENTH PROMOTION HAVING ADDED ONE — and it is the first
 * entry here whose two ends are both authored, in two subjects neither of
 * which is this area's own.
 *
 * `dot-product-geometry` declared `plane-vectors` and `right-triangle-trig`.
 * The first went into `VECTORS_AND_INDEPENDENCE.edges`, because that is the
 * ontology the node joined and the edge is internal to it. The second could
 * not follow: it is a concept of `triangle-trigonometry`, and an ontology may
 * only name concepts it CONTAINS. So the rule this list has now demonstrated
 * five times is not "links is for edges into unwritten nodes" and not "links is
 * for edges into other subjects" — it is for any edge whose endpoints end up in
 * different FILES, and this is the cleanest case of it, both ends written.
 */
/*
 * SIX NOW, THE TWELFTH PROMOTION HAVING ADDED ONE — and it is the expensive
 * case with nothing left over, which no earlier entry here could show.
 *
 * Every expensive promotion before it declared two `needs` and had one of them
 * stay in a syllabus, so the rule looked like a statement about splitting a
 * list. `solid-geometry` declared ONE, `circle-measure`, and it pointed at a
 * concept of `plane-geometry` while the node became the only concept of
 * `solid-measure` — a tenth subject. So the whole of its stranded edges came
 * here, and the rule is stated at its limit: what decides where a stranded edge
 * goes is which FILE its other endpoint is in, and nothing about how many there
 * were.
 */
/*
 * SEVEN NOW, AND THE THIRTEENTH PROMOTION ADDED BOTH A ROW AND A DELETION —
 * which no earlier promotion did, and is the one shape of edge edit this list
 * could not previously show.
 *
 * `three-dimensional-coordinates` declared two `needs`. `dot-product-geometry`
 * is a concept of the subject the node joined, so that edge went into
 * `VECTORS_AND_INDEPENDENCE.edges`. `solid-geometry` is a concept of
 * `solid-measure`, so that one is the entry added below — the expensive case
 * again, and the second entry in this list with authored material at both ends
 * from the day it was written.
 *
 * The deletion is in atlas-structures.ts rather than here, and it is why this
 * block exists at all: `three-dimensional-coordinates → vectors-and-spans` was
 * a `links` entry of `linear-algebra`, and the promotion put both of ITS ends
 * in one ontology, so that entry had to go. So the rule has a third clause now.
 * A promotion strands the edges on the node's own `needs`; it leaves edges
 * declared at the far end alone; and it can also COLLAPSE a `links` entry
 * somewhere else entirely, by making both of that entry's ends concepts of one
 * file. The first two fail loudly when missed. The third does not — `links`
 * never cared whether an end was a node or a concept, so a stale entry goes on
 * resolving and the composed graph silently carries the edge twice.
 */
/*
 * EIGHT NOW, AND THE FOURTEENTH PROMOTION'S ENTRY EXISTS BECAUSE THIS LIST
 * CANNOT CARRY A KIND — which is a reason none of the seven above it had, and
 * the first time the one-kind limitation has decided where a CONCEPT lives
 * rather than only where an edge does.
 *
 * `distance-and-midpoint` declared `['cartesian-plane', 'pythagoras']` and also
 * `exercises: ['pythagoras']`. Two of those three edges went into
 * `PLANE_GEOMETRY.edges` — the prerequisite on `pythagoras` and the
 * `encompasses` the `exercises` expands to — and the prerequisite on
 * `cartesian-plane` is the entry below, by the familiar route: that concept is
 * authored in `vectors-and-independence` and an ontology may only name concepts
 * it CONTAINS.
 *
 * What is new is the counterfactual. `vectors-and-independence` was the better
 * home on subject matter: it owns `cartesian-plane`, the dot product and the
 * three dimensions, and `plane-geometry`'s `covers` describes a syllabus of
 * figures taken as far as they go without a drawing. Filing it there would have
 * reversed which edge came here — the plane's prerequisite would have been
 * internal and Pythagoras's would have come back — and it would have DROPPED
 * the `encompasses` entirely, because `expandEdges` hard-codes
 * `kind: 'prerequisite'` on every row of this list and an `encompasses` across
 * two files therefore has no home at all. So the filing was decided by this
 * field's shape, and the asymmetry is worth asserting rather than describing:
 * the two kinds are checked separately below, in the places each one had to go.
 *
 * It gates, like the fifth, sixth and seventh and unlike the first four:
 * `cartesian-plane` has three knowledge points.
 */
const EUCLID_LINKS = (EUCLID.links ?? []).map(l => `${l.from}->${l.to}`).join(' ')
t('the area asks for exactly the eight cross-file edges it has been handed, in order',
  EUCLID_LINKS === 'ratio-and-rate->similarity roots-and-irrationals->pythagoras '
    + 'real-number-line->cartesian-plane negative-numbers->cartesian-plane '
    + 'right-triangle-trig->dot-product-geometry circle-measure->solid-geometry '
    + 'solid-geometry->three-dimensional-coordinates '
    + 'cartesian-plane->distance-and-midpoint'
  && (EUCLID.links ?? []).every(l => !!l.because),
  EUCLID_LINKS)
/*
 * The fourteenth promotion's edges, split BY KIND, which no promotion out of
 * this area had done before and which is the only claim that would catch the
 * cheaper filing.
 *
 * Three assertions, because three different things could have gone wrong and
 * only one of them fails loudly on its own. The prerequisite on `pythagoras`
 * had to land in the ontology (a missing gate shows up in the walk). The
 * prerequisite on `cartesian-plane` had to land here (likewise). The
 * `encompasses` had to land in the ontology and could not have landed anywhere
 * else — and its absence shows up as NOTHING, which is why it is checked by
 * name, with its rationale, and counted for duplicates.
 */
t('the departed node\'s two prerequisites went to two different homes, which the stamps record',
  MATHEMATICS.edges.find(e =>
    e.from === 'pythagoras' && e.to === 'distance-and-midpoint' && e.kind === 'prerequisite')
    ?.promotedBy === 'author:plane-geometry'
  && MATHEMATICS.edges.find(e =>
    e.from === 'cartesian-plane' && e.to === 'distance-and-midpoint')
    ?.promotedBy === 'atlas:euclidean-geometry',
  MATHEMATICS.edges.filter(e => e.to === 'distance-and-midpoint')
    .map(e => `${e.from}:${e.kind}:${e.promotedBy}`).join(' '))
t('and its `exercises` survived as an encompasses, which `links` could not have carried at all',
  MATHEMATICS.edges.filter(e =>
    e.from === 'distance-and-midpoint' && e.to === 'pythagoras'
    && e.kind === 'encompasses').length === 1
  && !!MATHEMATICS.edges.find(e =>
    e.from === 'distance-and-midpoint' && e.to === 'pythagoras')?.rationale
  && (EUCLID.links ?? []).every(l => l.from !== 'distance-and-midpoint'),
  MATHEMATICS.edges.filter(e => e.from === 'distance-and-midpoint')
    .map(e => `${e.kind} -> ${e.to}`).join(' | '))
/*
 * And the constraint itself, from the composed graph rather than from the
 * source — because "links carries prerequisite only" is a fact about
 * `expandEdges`, and reading it off the field would only restate that no row
 * has a `kind` property to read.
 *
 * Every link in every area must appear in `MATHEMATICS.edges` as a
 * `prerequisite` and as nothing else. A row that somehow produced an
 * `encompasses` would mean the filing argument above was unnecessary, and this
 * is where that would be discovered.
 */
t('no links row anywhere produces an edge of any kind but prerequisite',
  AREAS.flatMap(a => a.links ?? []).every(l =>
    MATHEMATICS.edges.some(e => e.from === l.from && e.to === l.to && e.kind === 'prerequisite')
    && !MATHEMATICS.edges.some(e =>
      e.from === l.from && e.to === l.to && e.kind !== 'prerequisite')),
  AREAS.flatMap(a => a.links ?? [])
    .filter(l => MATHEMATICS.edges.some(e =>
      e.from === l.from && e.to === l.to && e.kind !== 'prerequisite'))
    .map(l => `${l.from}->${l.to}`).join(' '))
/*
 * The collapsed entry, asserted from both sides — which is the only way to
 * catch it, since neither side fails on its own.
 *
 * `linear-algebra` must no longer name the edge, the ontology must now declare
 * it, and the composed graph must carry it EXACTLY ONCE. That last clause is
 * the real assertion: dropping either of the first two leaves a graph that
 * still contains the edge and still walks correctly, and only the count of
 * duplicates distinguishes "rehomed" from "declared twice".
 */
const LINALG_LINKS = (AREAS.find(a => a.id === 'linear-algebra').links ?? [])
  .map(l => `${l.from}->${l.to}`)
t('the span edge came home: the map no longer declares it and the ontology does',
  !LINALG_LINKS.includes('three-dimensional-coordinates->vectors-and-spans')
  && VECTORS.edges.some(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'vectors-and-spans'
    && e.kind === 'prerequisite' && !!e.rationale),
  LINALG_LINKS.join(' '))
t('and the composed graph carries it exactly once, which is what a stale links entry would break',
  MATHEMATICS.edges.filter(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'vectors-and-spans'
    && e.kind === 'prerequisite').length === 1,
  `${MATHEMATICS.edges.filter(e => e.from === 'three-dimensional-coordinates'
    && e.to === 'vectors-and-spans').length}`)
t('and it is stamped by the author rather than by the area that used to declare it',
  MATHEMATICS.edges.find(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'vectors-and-spans')
    ?.promotedBy === 'author:vectors-and-independence',
  MATHEMATICS.edges.find(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'vectors-and-spans')?.promotedBy)
/*
 * And the new one's two ends, named — because "both ends authored" is not the
 * claim. The claim is that they are authored in two subjects NEITHER of which
 * is reachable from the other's edge list, which is what makes `links` the only
 * home rather than a convenience. `areaOf` returns a subject id for an authored
 * concept, so this reads the filing directly.
 */
t('and the newest one runs between two subjects, which is why it cannot live in either',
  areaOf(MATHEMATICS, 'circle-measure') === 'plane-geometry'
  && areaOf(MATHEMATICS, 'solid-geometry') === 'solid-measure'
  && prerequisitesOf(MATHEMATICS, 'solid-geometry').join(' ') === 'circle-measure'
  && MATHEMATICS.edges.filter(e =>
    e.from === 'circle-measure' && e.to === 'solid-geometry').length === 1,
  `${areaOf(MATHEMATICS, 'circle-measure')} -> ${areaOf(MATHEMATICS, 'solid-geometry')}`)
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
 * THE CONTRAST THESE TWO LINKS USED TO DRAW HAS COLLAPSED, AND THE ASSERTION IS
 * REWRITTEN RATHER THAN DELETED.
 *
 * It used to say that `roots-and-irrationals->pythagoras` GATES while
 * `ratio-and-rate->similarity` does not: the first endpoint had material and
 * the second was a skeleton, so the gating walk passed straight through it.
 * That was true, load-bearing, and is now false in its second half —
 * `ratio-and-rate` is authored, so both links gate.
 *
 * The distinction the pair was really keeping on the record survives intact and
 * is the one asserted above: `links` is about which FILE an endpoint is in, not
 * about whether it was written. `ratio-and-rate` could not go into
 * `PLANE_GEOMETRY.edges` as a skeleton and still cannot as a concept, because
 * it is authored in `arithmetic-foundations` and an ontology may only name
 * concepts it CONTAINS. So the entry never moved, and what changed is only what
 * it costs a learner.
 *
 * What is asserted instead is the stronger thing the promotion made true, and
 * it is the shape that catches a silent regression: BOTH links gate, and
 * `similarity`'s gating set is the same SIZE as before with one member
 * replaced. `fraction-arithmetic` used to appear there, reached through the
 * empty node; `ratio-and-rate` stands in front of it now. A `length === 2`
 * check would have passed before and after while the claim turned over
 * completely, which is why this names the members.
 */
t('both links GATE now, since both endpoints have material',
  gatingPrerequisitesOf(MATHEMATICS, 'pythagoras').includes('roots-and-irrationals')
  && gatingPrerequisitesOf(MATHEMATICS, 'similarity').includes('ratio-and-rate'),
  `pythagoras:[${gatingPrerequisitesOf(MATHEMATICS, 'pythagoras').join(' ')}] `
  + `similarity:[${gatingPrerequisitesOf(MATHEMATICS, 'similarity').join(' ')}]`)
t('and similarity is gated by the ratio instead of through it — same count, one member replaced',
  gatingPrerequisitesOf(MATHEMATICS, 'similarity').slice().sort().join(' ')
    === 'congruence ratio-and-rate',
  gatingPrerequisitesOf(MATHEMATICS, 'similarity').slice().sort().join(' '))
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
/*
 * The seventh promotion moved the gate for one node again — `circle-measure`
 * is `area-and-perimeter`'s only dependent anywhere in the atlas — and it did
 * it in a shape no promotion here has produced before, which is the reason
 * this is two assertions rather than one.
 *
 * Every tightening above ADDED a concept to its dependents' gating sets: the
 * walk used to pass through an empty node and now stops at a real one, so
 * there is one more thing to demonstrate. Here the set got SMALLER, from four
 * to three. Before, the walk looked through this node and collected BOTH of
 * its prerequisites, `quadrilaterals-and-polygons` and `triangle-basics`;
 * now it stops at the node itself, which sits above both of them. One
 * demonstration has replaced two.
 *
 * That is a tighter gate and not a looser one, and the distinction matters
 * because a count would read it the wrong way round. `gatingPrerequisitesOf`
 * names the NEAREST teachable ancestors, so a shorter list means the gate is
 * closer to the thing being gated — mastery of the polygons and the triangles
 * no longer licenses circular measure on its own, since the concept standing
 * between them now has to be demonstrated too. Both halves are asserted: the
 * one that arrived, and the two that stopped being named directly.
 *
 * The other half of `circle-measure`'s pair is untouched BY THAT PROMOTION:
 * `circles` is unwritten, so the walk still passes through it to whatever is
 * nearest behind it — which was `congruence` and `pythagoras` at the time.
 *
 * THE EIGHTH PROMOTION THEN MOVED THAT HALF WITHOUT TOUCHING THE NODE, and it
 * is the most useful thing in this group because it is a gate changing at a
 * distance of two. `circles` needs `geometric-proof` and `pythagoras`;
 * `geometric-proof` was empty, so the walk went straight past it to
 * `congruence` one step further down. Now it stops there. So
 * `circle-measure`'s gating set went from `area-and-perimeter`, `congruence`,
 * `pythagoras` to `area-and-perimeter`, `geometric-proof`, `pythagoras` —
 * three members before and three after, with different membership, and
 * `circle-measure` is two edges away from the concept that was authored.
 *
 * That is the fourth time a set in this file has turned over without changing
 * size, and the first time it happened to a node neither endpoint of the
 * promoted edge. A `length === 3` check would have passed while every claim it
 * made had moved up a step.
 */
t('what rests on area and perimeter still names it after the rehoming, across the file boundary',
  prerequisitesOf(MATHEMATICS, 'circle-measure').includes('area-and-perimeter')
  && prerequisitesOf(MATHEMATICS, 'circle-measure').includes('circles'),
  prerequisitesOf(MATHEMATICS, 'circle-measure').join(', '))
/*
 * THE NINTH PROMOTION SHRANK THAT SET AGAIN, three to TWO, and it is the second
 * shrinkage this one node's gate has produced — which makes `circle-measure`
 * the clearest record in the file of what a tightening looks like from the
 * outside.
 *
 * Its gate has read, in order: four members at the sixth promotion
 * (`congruence`, `pythagoras`, `quadrilaterals-and-polygons`,
 * `triangle-basics`), three at the seventh when `area-and-perimeter` stood in
 * for the last two of those, three again at the eighth with different
 * membership when `geometric-proof` replaced `congruence` from two edges away,
 * and now TWO — `area-and-perimeter` and `circles`, which are exactly its own
 * two prerequisites.
 *
 * So the gate has arrived where a gate is supposed to end up: naming the two
 * concepts the node actually declares and nothing collected from behind them.
 * Four, three, three, two, with the third step changing no size at all. A
 * `length` check would have reported this as a gate eroding by half when what
 * happened is that it stopped reaching past its own prerequisites, and the
 * membership at every step is the only thing that says which.
 *
 * `geometric-proof` leaving this set is the half most likely to be misread, so
 * it is asserted explicitly. It is not a lost edge: the walk used to pass
 * through the unwritten `circles` and collect what lay behind it, and now stops
 * at `circles` itself. `geometric-proof` still gates `circles`, one edge
 * further down, which the assertion below checks in the same breath.
 */
t('and the gate it moved SHRANK the set, by standing in for the two concepts below it',
  gatingPrerequisitesOf(MATHEMATICS, 'circle-measure').slice().sort().join(',')
    === 'area-and-perimeter,circles'
  && isTeachable(MATHEMATICS, 'circles'),
  gatingPrerequisitesOf(MATHEMATICS, 'circle-measure').join(', '))
t('and the ninth tightened it onto exactly its own pair, with nothing left from beneath',
  gatingPrerequisitesOf(MATHEMATICS, 'circle-measure').slice().sort().join(',')
    === prerequisitesOf(MATHEMATICS, 'circle-measure').slice().sort().join(',')
  && !gatingPrerequisitesOf(MATHEMATICS, 'circle-measure').includes('geometric-proof')
  && !gatingPrerequisitesOf(MATHEMATICS, 'circle-measure').includes('pythagoras')
  && gatingPrerequisitesOf(MATHEMATICS, 'circles').includes('geometric-proof'),
  gatingPrerequisitesOf(MATHEMATICS, 'circle-measure').join(', '))
/*
 * THE TENTH PROMOTION SHRANK A GATE FROM TWO TO ONE, which is the third
 * shrinkage in this area and the first to land on a node that is still mapped —
 * so this is the only one of the three whose result can still be read off the
 * area rather than off an authored concept.
 *
 * `solid-geometry` names `circle-measure` and nothing else. While that node was
 * unwritten the walk looked straight through it and collected BOTH of its
 * prerequisites, so the gate read `circles`, `area-and-perimeter`. Now it stops
 * at the node itself: one demonstration has replaced two, and the one is above
 * both of them.
 *
 * A shorter list is a TIGHTER gate, which is the reading a count gets backwards
 * and the reason both halves are named. `gatingPrerequisitesOf` returns the
 * NEAREST teachable ancestors, so fewer members means the gate sits closer to
 * what it gates — mastery of the circle theorems and of area no longer licenses
 * the solids between them, because the concept standing between has to be
 * demonstrated too.
 *
 * `radians` is the same tightening at a distance and in another AREA, which no
 * promotion out of here has produced before: it is a node of `trigonometry`,
 * it names `circle-measure` in its own `needs`, and its gate now names that
 * concept where it used to name `area-and-perimeter`. Eight members before and
 * eight after, with different membership — the fifth time in this file a set
 * has turned over without its size moving.
 *
 * THE TWELFTH PROMOTION MADE THE FIRST HALF OF THAT UNASSERTABLE HERE, AND
 * CORRECTLY SO. The claim was "`solid-geometry`'s gate shrank from two to one",
 * and it was checked against a node that had to really be in this area — which
 * is what made it fail loudly rather than go vacuous when that node was itself
 * promoted. The gate is still exactly `circle-measure`, but a statement about
 * what the MAP gates is not assertable on a concept, so the shrinkage is
 * recorded in the departed group below, where the record of that node now
 * lives.
 *
 * THE THIRTEENTH PROMOTION DID THE SAME THING TO THE REPLACEMENT, which is
 * three promotions running that have made this group's subject unassertable and
 * is worth naming as a pattern rather than patched a third time. The claim was
 * "`three-dimensional-coordinates`'s gate swapped a member without changing
 * size", checked against a node that had to really be in this area — and that
 * node is now a concept of `vectors-and-independence`. The guard worked: it
 * failed loudly with the id printed rather than going vacuous.
 *
 * So the lesson is recorded once here instead of being rediscovered. A gate
 * assertion anchored on a MAP NODE has a life expectancy, because the node
 * being written is the goal. Anchor the claim on what gates it and not on what
 * it gates, or expect to move it every time the thing above it is authored.
 *
 * What replaces it is the same rule read from the other end, where it is
 * stable — and it is the THIRD of the three outcomes, which is what makes the
 * set of them worth keeping. `vectors-and-spans` is an authored concept and its
 * gate used to read `plane-vectors`, `dot-product-geometry`, `solid-geometry`:
 * the walk passed through the unwritten three dimensions and collected both
 * halves of what lay behind them. It now reads `plane-vectors` and the three
 * dimensions themselves. THREE MEMBERS BEFORE AND TWO AFTER — so this
 * promotion tightened a gate by SHRINKING it, where the twelfth tightened one
 * by swapping a member and the tenth shrank one from two to one. A count read
 * as a measure of how gated something is gets this exactly backwards: the list
 * got shorter because the gate moved closer.
 */
t('span is tightened onto the three dimensions, three gate members replaced by two',
  gatingPrerequisitesOf(MATHEMATICS, 'vectors-and-spans').slice().sort().join(' ')
    === 'plane-vectors three-dimensional-coordinates'
  && isTeachable(MATHEMATICS, 'three-dimensional-coordinates'),
  gatingPrerequisitesOf(MATHEMATICS, 'vectors-and-spans').join(', '))
t('and the gate it names is teachable, so the tightening is somewhere to go rather than a wall',
  gatingPrerequisitesOf(MATHEMATICS, 'vectors-and-spans')
    .every(p => isTeachable(MATHEMATICS, p) && isPractisable(MATHEMATICS, p)),
  gatingPrerequisitesOf(MATHEMATICS, 'vectors-and-spans')
    .filter(p => !isPractisable(MATHEMATICS, p)).join(', '))
t('and radians is tightened onto it too, from another area, without its gate changing size',
  gatingPrerequisitesOf(MATHEMATICS, 'radians').includes('circle-measure')
  && !gatingPrerequisitesOf(MATHEMATICS, 'radians').includes('area-and-perimeter')
  && AREAS.find(a => a.id === 'trigonometry').nodes.some(n => n.id === 'radians'),
  gatingPrerequisitesOf(MATHEMATICS, 'radians').join(', '))
t('all ten promoted concepts are teachable in the composed map, with their material intact',
  DEPARTED.every(id => isTeachable(MATHEMATICS, id) && isPractisable(MATHEMATICS, id)),
  DEPARTED.filter(id => !isTeachable(MATHEMATICS, id) || !isPractisable(MATHEMATICS, id)).join(', '))
/*
 * The eighth promotion's gate, and it is the widest fan-out any promotion out
 * of this area has moved — four dependents, two of them in other atlas FILES.
 *
 * `circles` and `non-euclidean-geometry` are here; `mathematical-induction` is
 * a node of `sequences-and-series` and `propositional-logic` of
 * `discrete-mathematics`, and both name `geometric-proof` in their own `needs`
 * while atlas-structures.ts argues at length that the geometry is the real
 * entry point to proof and the logic is the second pass. None of the four
 * edges was touched, because an edge is owned by the node that DECLARES it, and
 * all four stayed. So this assertion is the edge rule working across three
 * separate map files at once, which no previous promotion here has needed.
 *
 * `circles` is the one whose gate actually changes. It has had `pythagoras`
 * since the fifth promotion and the walk was still looking straight through
 * this half of its pair, so this is the partly-live case the sixth promotion
 * recorded for `area-and-perimeter` — both halves named, because a test asking
 * only "is it gated by something" would have passed before and after.
 */
t('and what rests on deductive proof is now gated by it, across three map files',
  ['circles', 'non-euclidean-geometry', 'mathematical-induction', 'propositional-logic']
    .every(id => gatingPrerequisitesOf(MATHEMATICS, id).includes('geometric-proof')),
  ['circles', 'non-euclidean-geometry', 'mathematical-induction', 'propositional-logic']
    .map(id => `${id}:[${gatingPrerequisitesOf(MATHEMATICS, id).join(' ')}]`).join(' '))
/*
 * And `circles` now has both halves of its pair authored, which is the first
 * node in this area for which that is true. Its gating set is therefore exactly
 * its own two prerequisites, with nothing collected from below either of them —
 * the tightest a gate can be. Asserted by named membership rather than by
 * length, for the reason the root set is: a set of two can turn over completely
 * without the count moving.
 */
t('so circles is gated by exactly its own pair, with nothing collected from beneath them',
  gatingPrerequisitesOf(MATHEMATICS, 'circles').slice().sort().join(',')
    === 'geometric-proof,pythagoras'
  && prerequisitesOf(MATHEMATICS, 'circles').slice().sort().join(',')
    === 'geometric-proof,pythagoras',
  gatingPrerequisitesOf(MATHEMATICS, 'circles').join(', '))
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
/*
 * THE SEVENTH PROMOTION THEN SHRANK IT AGAIN, from six to five, which is the
 * fifth promotion's shape reproduced exactly and the fourth distinct thing to
 * happen to this set.
 *
 * `area-and-perimeter` left and nothing replaced it. The node resting on it is
 * `circle-measure`, which did not become a root because its other
 * prerequisite, `circles`, is in this area and still gates it from inside —
 * the same rule, and the same reason, as `circles` itself not joining when
 * `pythagoras` left. Two of the six members asserted below have now come and
 * gone while the set changed size three times, so the only claim worth holding
 * is the named one.
 *
 * The substitution the sixth promotion made is no longer assertable as a
 * membership claim, because the node it substituted IN has itself been
 * promoted out. What survives of it is the shape — one left, one joined,
 * neither of them `quadrilaterals-and-polygons` — and the record of it is in
 * the comments here and in atlas-foundations.ts. Asserting that
 * `area-and-perimeter` is still a root would now be asserting that this
 * promotion did not happen.
 */
/*
 * THE EIGHTH PROMOTION THEN SUBSTITUTED, five to five, which is the fourth
 * turnover and the one that CLOSES the rule rather than illustrating it again.
 *
 * `geometric-proof` left and `circles` took its place, because the departing
 * node was the LAST of `circles`'s prerequisites inside the area — its other
 * one, `pythagoras`, has been gone since the fifth. And `circles` is the node
 * the fifth promotion's own note is built around: it did NOT join the set then,
 * and the reason recorded was that `geometric-proof` was still here to gate it
 * from inside. So both halves of the rule are now demonstrated on ONE node,
 * held back while a prerequisite remained and a root the moment it left, which
 * is stronger evidence than two different nodes showing the two outcomes.
 *
 * Three of the five members asserted below have now come and gone while the set
 * changed size four times. The named claim is the only one worth holding.
 */
/*
 * THE NINTH PROMOTION THEN FANNED IT OUT, five to SEVEN, which is the third
 * promotion's shape and the first time it has recurred — and the recurrence is
 * what turns that outcome from an oddity of `congruence` into the rule's
 * ordinary behaviour.
 *
 * `circles` left and THREE nodes replaced it, because the departing node was
 * the last in-area prerequisite of three of its four dependents at once.
 * `circle-measure`'s other prerequisite `area-and-perimeter` went at the
 * seventh; `constructions` names nothing but `circles`; and
 * `non-euclidean-geometry`'s other prerequisite `geometric-proof` went at the
 * eighth. So two earlier promotions had already stripped the other halves, and
 * this one collected the result — a fan-out is a departure landing on
 * dependents that previous departures left one edge short.
 *
 * `circles-analytic` is the fourth dependent and did not join, which is what
 * keeps this a fan-out of three rather than of four: it also needs
 * `lines-in-the-plane`, still here. Asserted separately below.
 *
 * With this the set has done everything it can do. Across nine promotions and
 * a merge its size has read 1, 1, 4, 4, 3, 3, 6, 5, 5, 7 — two fan-outs, three
 * substitutions, two shrinkages and one doubling — and FOUR of those ten
 * transitions moved membership without moving size. There is no reading of the
 * count that predicts the next value, which is why this is asserted by name and
 * has been since the fourth promotion.
 */
t('none of the sixth, seventh or eighth promotion\'s own nodes is a root of the area any more',
  !euclidRoots.includes('quadrilaterals-and-polygons')
  && !euclidRoots.includes('area-and-perimeter')
  && !euclidRoots.includes('geometric-proof')
  && !euclidRoots.includes('circles')
  && euclidRoots.includes('isometries-and-symmetry'),
  euclidRoots.join(', '))
/*
 * THE TENTH PROMOTION THEN SUBSTITUTED, seven to seven, which is the fifth
 * turnover of this set and the third time it has moved membership without
 * moving size.
 *
 * `circle-measure` left and `solid-geometry` took its place, because the
 * departing node was the last of that node's prerequisites inside the area and
 * in fact its ONLY one. So five of the seven members asserted below have now
 * come and gone while the size has read 1, 1, 4, 4, 3, 3, 6, 5, 5, 7 and 7 —
 * and a `length === 7` check would have passed this promotion while both of the
 * claims that changed went stale. That is the fifth demonstration of why this
 * is asserted by name, and the second consecutive promotion where the count
 * alone says nothing at all.
 */
/*
 * THE ELEVENTH PROMOTION THEN SHRANK IT, seven to six, which is the fifth
 * promotion's shape for the third time and the sixth turnover of this set.
 *
 * `dot-product-geometry` left and nothing replaced it. The node resting on it
 * is `three-dimensional-coordinates`, which did not become a root because its
 * other prerequisite `solid-geometry` is in this area and still gates it from
 * inside — the same rule, and the same reason, as `circles` not joining when
 * `pythagoras` left and `circle-measure` not joining when `area-and-perimeter`
 * did.
 *
 * The departing node is also the first member of this set to have ARRIVED by
 * merge rather than by being authored around: it became a root when
 * `coordinate-geometry` was absorbed, because every one of its prerequisites
 * was outside the merged area, and it has now left as one. The size has read
 * 1, 1, 4, 4, 3, 3, 6, 5, 5, 7, 7 and 6 across twelve transitions, five of
 * which moved membership without moving size.
 */
/*
 * THE TWELFTH PROMOTION THEN SUBSTITUTED, six to six, which is the seventh
 * turnover of this set and the fourth time membership has moved without the
 * size moving at all.
 *
 * `solid-geometry` left and `three-dimensional-coordinates` took its place,
 * because the departing node was the LAST of that node's prerequisites inside
 * the area. The other one, `dot-product-geometry`, left at the eleventh and did
 * NOT promote it then — which the assertion immediately below this group used
 * to be about, and which is the same rule producing the opposite outcome one
 * promotion apart.
 *
 * The size has now read 1, 1, 4, 4, 3, 3, 6, 5, 5, 7, 7, 6 and 6 across
 * thirteen transitions, and TWO of the six claims below changed on this one:
 * the member that left and the member that arrived. A `length === 6` check
 * would have passed on both sides of it, which is the sixth demonstration of
 * why this is asserted by name and the third consecutive promotion where the
 * count alone says nothing.
 */
/*
 * AND THE THIRTEENTH TOOK ONE AWAY WITHOUT PUTTING ANYTHING IN ITS PLACE, which
 * is the eighth turnover and ends a run of three substitutions.
 *
 * `three-dimensional-coordinates` left, and nothing replaced it, because a
 * departing node promotes a dependent to root only when it was the LAST of that
 * dependent's prerequisites INSIDE the area — and this node had no in-area
 * dependents at all. Both of them are elsewhere: `vectors-and-spans` is an
 * authored concept of `vectors-and-independence` and
 * `functions-of-several-variables` is a node of `multivariable-calculus`. So
 * the set simply lost a member.
 *
 * That is the third of the three things a promotion can do to this set, after
 * substituting and after fanning out to several, so the sequence below now
 * contains an instance of each. The size has read 1, 1, 4, 4, 3, 3, 6, 5, 5,
 * 7, 7, 6, 6 and 5 across fourteen transitions — and note that a `length === 5`
 * check would be satisfied by the eighth and ninth entries too, whose
 * membership has nothing in common with this one's.
 */
/*
 * AND THE FOURTEENTH FANNED IT OUT TO SIX, one leaving and TWO arriving, which
 * is the ninth turnover and a shape only the merge has produced here before —
 * and the merge was not a promotion.
 *
 * `distance-and-midpoint` left, and `lines-in-the-plane` and `loci-and-regions`
 * both arrived, because it was the last in-area prerequisite of each of them at
 * once. `lines-in-the-plane` needs it and `linear-functions`, a node of
 * `functions`; `loci-and-regions` needs it and `linear-inequalities`, a node of
 * `algebra-foundations`. So the usual rule produced two substitutions rather
 * than one, and the departing node's own membership was spent at the same time:
 * it had been a root since the merge brought it in.
 *
 * The size has now read 1, 1, 4, 4, 3, 3, 6, 5, 5, 7, 7, 6, 6, 5 and 6 across
 * fifteen transitions. A `length === 6` check would be satisfied by the seventh,
 * twelfth and thirteenth entries, whose membership has nothing in common with
 * this one's — which is the seventh demonstration of why this set is asserted by
 * name, and the first where a single promotion changed THREE of the claims it
 * makes rather than one or two.
 */
t('so the set is six, by named membership and never by count',
  euclidRoots.slice().sort().join(',')
  === 'constructions,isometries-and-symmetry,lines-in-the-plane,'
    + 'loci-and-regions,non-euclidean-geometry,plane-transformations',
  euclidRoots.join(', '))
/*
 * The fan-out asserted as the RULE rather than as two more names, because "two
 * nodes joined" is the observation and "each of them had exactly this node left
 * inside the area" is the claim. Both halves are checked on each arrival: the
 * node is in the area, it still names the departed concept, and its other
 * prerequisite is in no area of the map this one belongs to.
 */
t('and both arrivals had the departed node as their last in-area prerequisite',
  ['lines-in-the-plane', 'loci-and-regions'].every(id => {
    const node = EUCLID.nodes.find(n => n.id === id)
    return !!node
      && (node.needs ?? []).includes('distance-and-midpoint')
      && (node.needs ?? []).every(p => EUCLID.nodes.every(m => m.id !== p))
      && euclidRoots.includes(id)
  }),
  ['lines-in-the-plane', 'loci-and-regions']
    .map(id => `${id}:[${(EUCLID.nodes.find(n => n.id === id)?.needs ?? []).join(' ')}]`).join(' '))
t('and the departed node is gone from the area entirely rather than merely off the root list',
  EUCLID.nodes.every(n => n.id !== 'three-dimensional-coordinates')
  && areaOf(MATHEMATICS, 'three-dimensional-coordinates') === 'vectors-and-independence',
  areaOf(MATHEMATICS, 'three-dimensional-coordinates'))
t('and it was removed rather than replaced because neither of its dependents was in this area',
  ['vectors-and-spans', 'functions-of-several-variables'].every(id =>
    EUCLID.nodes.every(n => n.id !== id)
    && prerequisitesOf(MATHEMATICS, id).includes('three-dimensional-coordinates')),
  ['vectors-and-spans', 'functions-of-several-variables']
    .map(id => `${id}@${areaOf(MATHEMATICS, id)}`).join(' '))
/*
 * The ninth promotion's three-at-once fan-out, with ONE OF THE THREE REMOVED
 * because it has since been authored — and removed rather than left in, because
 * the inner check requires each id to be a node of this area and would have
 * failed loudly. That is the right failure: the claim "this node became a root"
 * stops being assertable here the moment the node stops being in the area at
 * all, exactly as the seventh promotion's did.
 *
 * What survives is the shape, on the two members still in the area:
 * `constructions` names nothing but `circles`, and `non-euclidean-geometry`'s
 * other prerequisite `geometric-proof` went at the eighth. The third,
 * `circle-measure`, is asserted as a promotion that happened in the DEPARTED
 * group above, which is where the record of it now lives.
 */
t('and the ninth promotion\'s fan-out still holds for the two of the three still mapped',
  ['constructions', 'non-euclidean-geometry'].every(id =>
    EUCLID.nodes.some(n => n.id === id
      && (n.needs ?? []).includes('circles')
      && (n.needs ?? []).every(p => EUCLID.nodes.every(m => m.id !== p)))
    && euclidRoots.includes(id))
  && isTeachable(MATHEMATICS, 'circle-measure')
  && EUCLID.nodes.every(n => n.id !== 'circle-measure'),
  ['constructions', 'non-euclidean-geometry']
    .map(id => `${id}:[${(EUCLID.nodes.find(n => n.id === id)?.needs ?? []).join(' ')}]`).join(' '))
/*
 * The replacement for "three-dimensional-coordinates became a root, both of its
 * prerequisites being outside the area", which the THIRTEENTH promotion made
 * unassertable by writing that node — and which was deliberately NOT written as
 * `(EUCLID.nodes.find(...)?.needs ?? []).every(...)`, because that form goes
 * VACUOUSLY TRUE the moment the node leaves the area. It was written with a
 * `.some(...)` requiring the node to be present, so it failed loudly with the
 * node's own `needs` printed. Keeping that shape is the point; see the
 * `area-and-perimeter` note below, where the vacuous version is dissected.
 *
 * What survives the promotion is the half that was never about the node's
 * position in this area: both of the prerequisites it declared are authored
 * concepts, in two subjects of which neither is this one, and the edges it
 * declared therefore split two ways — one into an ontology and one into this
 * area's `links`. That claim is now checked on the CONCEPT rather than on the
 * node, which is where it is stable, and the split is checked by the promoter
 * stamps because that is the one observable difference between the two homes.
 */
t('both of the departed node\'s prerequisites are authored, in two subjects neither of them this area\'s',
  ['dot-product-geometry', 'solid-geometry'].every(id =>
    isTeachable(MATHEMATICS, id)
    && prerequisitesOf(MATHEMATICS, 'three-dimensional-coordinates').includes(id))
  && areaOf(MATHEMATICS, 'dot-product-geometry') === 'vectors-and-independence'
  && areaOf(MATHEMATICS, 'solid-geometry') === 'solid-measure',
  ['dot-product-geometry', 'solid-geometry']
    .map(id => `${id}@${areaOf(MATHEMATICS, id)}`).join(' '))
t('and its two stranded edges went to two different homes, which the promoter stamps record',
  MATHEMATICS.edges.find(e =>
    e.from === 'dot-product-geometry' && e.to === 'three-dimensional-coordinates')
    ?.promotedBy === 'author:vectors-and-independence'
  && MATHEMATICS.edges.find(e =>
    e.from === 'solid-geometry' && e.to === 'three-dimensional-coordinates')
    ?.promotedBy === 'atlas:euclidean-geometry',
  MATHEMATICS.edges.filter(e => e.to === 'three-dimensional-coordinates')
    .map(e => `${e.from}:${e.promotedBy}`).join(' '))
/*
 * The replacement for "area-and-perimeter joined it because the polygons were
 * its last prerequisite in the area", which the seventh promotion made
 * unassertable — and worse than unassertable. Written as
 * `(find(...)?.needs ?? []).every(...)`, that check goes VACUOUSLY TRUE the
 * moment the node stops being in the area, because `every` on an empty list
 * holds. So it would have kept passing while making a claim about a node that
 * is not there, which is the failure mode the named-membership rule above
 * exists to prevent and which an optional-chained lookup reintroduces.
 *
 * What is asserted instead is the same rule at the node that now shows it.
 * That node has changed twice: it was `circle-measure`, held back by `circles`,
 * until the NINTH promotion took `circles` out of the area and made
 * `circle-measure` a root. So this is the second time the held-back-from-inside
 * role has had to be rehomed, and it is the second time the previous holder
 * became the thing it was being held back from.
 *
 * `circles-analytic` is where the rule shows best now, and better than either
 * of the nodes that held the role before it, because it has THREE
 * prerequisites and exactly ONE of them is still in the area.
 * `lines-in-the-plane` is here and gates it from inside; `completing-the-square`
 * is authored in `expressions-and-equations` and `circles` is authored in
 * `plane-geometry`, so two of the three have left and the node is still not a
 * root. Two prerequisites leaving and the node not moving is the rule stated as
 * sharply as this area can state it — a departure promotes its dependents only
 * when it was the LAST in-area prerequisite, and here two departures were not
 * the last.
 *
 * Both halves still need the node and its holder to really be in the area, so
 * neither can go vacuous the way an optional-chained `every` would.
 */
t('and circles-analytic is held back from the set by lines-in-the-plane, which is still in the area',
  EUCLID.nodes.some(n => n.id === 'circles-analytic'
    && (n.needs ?? []).includes('lines-in-the-plane')
    && (n.needs ?? []).includes('circles'))
  && EUCLID.nodes.some(n => n.id === 'lines-in-the-plane')
  && !euclidRoots.includes('circles-analytic'),
  (EUCLID.nodes.find(n => n.id === 'circles-analytic')?.needs ?? []).join(', '))
t('and TWO of its three prerequisites have left the area, which still did not promote it',
  (EUCLID.nodes.find(n => n.id === 'circles-analytic')?.needs ?? [])
    .filter(p => EUCLID.nodes.some(m => m.id === p)).join(',') === 'lines-in-the-plane'
  && (EUCLID.nodes.find(n => n.id === 'circles-analytic')?.needs ?? []).length === 3,
  (EUCLID.nodes.find(n => n.id === 'circles-analytic')?.needs ?? [])
    .filter(p => EUCLID.nodes.some(m => m.id === p)).join(', '))
/*
 * The replacement for "non-euclidean-geometry is held back from inside by
 * circles", which the ninth promotion made false rather than unassertable —
 * that node is a root now, and so is `circle-measure`, and the two of them
 * plus `constructions` are the three-way fan-out that promotion produced.
 *
 * What replaces it is the thing the fan-out revealed, which is that the area's
 * remaining route work is a CHAIN and no longer a set of independent asks. It
 * has since been walked one link: `circle-measure` was the root of it and is
 * authored now, so `solid-geometry` has taken its place at the bottom and
 * `three-dimensional-coordinates` still rests on that. So of the three
 * concepts the two unfinished journeys still need from this area, two are
 * stacked one behind the other and only the bottom one is writable. That is the
 * constraint the merge was argued against — it replaced a floor with a depth —
 * and it is asserted as the chain rather than described, because "is it gated"
 * passes on every link of it.
 *
 * The chain is asserted at its CURRENT bottom rather than at a fixed node, and
 * the vacuity trap is the reason the shape is written this way. "`solid-geometry`
 * needs exactly `circle-measure`" is checked against a node that must really be
 * in the area, so when `solid-geometry` is itself promoted this assertion fails
 * loudly instead of going quietly true on an empty `needs` list — which is what
 * `(find(...)?.needs ?? []).every(...)` did to the seventh promotion's claim.
 *
 * IT DID FAIL LOUDLY, EXACTLY AS WRITTEN, and the chain is now SPENT — which
 * is the claim that replaces it and is a different kind of statement. There is
 * no current bottom left to point at: the area owes ONE node on either
 * unfinished route, both halves of its gate are authored, and it is writable
 * today. So what is asserted is the exhaustion rather than the chain — the one
 * node still owed, and that nothing unwritten stands under it anywhere in the
 * composed map.
 *
 * That last clause is the one doing the work. "Its prerequisites are authored"
 * is a claim about two edges; "nothing unwritten is anywhere beneath it" is a
 * claim about the whole closure, and it is what "the depth has run out" means.
 * It is also the assertion that will fail when this node is promoted, which is
 * correct: the sentence will have nothing left to describe.
 *
 * IT WAS PROMOTED AND THE SENTENCE HAS NOTHING LEFT TO DESCRIBE, which is the
 * predicted ending rather than a break. The thirteenth promotion wrote
 * `three-dimensional-coordinates`, so this area owes NOTHING on either
 * unfinished route — the first time that has been true since the merge.
 *
 * What is asserted in its place is the emptiness, and in the strongest form
 * this file can check without reaching for the journeys: NO node of this area
 * stands beneath any authored concept. A map node that gates something written
 * is a node some learner has to cross to reach material that exists, which is
 * what made `three-dimensional-coordinates` owed in the first place — it gated
 * `vectors-and-spans`. With none left, nothing written anywhere in the build is
 * reachable only through unwritten geometry.
 *
 * It is deliberately NOT the same check as the route table further down. That
 * table names ids by hand; this walks the composed graph, so the two would have
 * to drift together to both be wrong. The journey-level version of the claim —
 * that no destination's route crosses this area any more — is in
 * tests/journeys.mjs, which is the suite that has the journeys.
 */
t('and the area now owes nothing beneath anything written, which the chain was walked to reach',
  EUCLID.nodes.every(n => n.id !== 'three-dimensional-coordinates')
  && isTeachable(MATHEMATICS, 'three-dimensional-coordinates')
  && MATHEMATICS.concepts.filter(c => isTeachable(MATHEMATICS, c.id))
    .flatMap(c => allPrerequisitesOf(MATHEMATICS, c.id))
    .filter(id => EUCLID.nodes.some(n => n.id === id)).length === 0,
  [...new Set(MATHEMATICS.concepts.filter(c => isTeachable(MATHEMATICS, c.id))
    .flatMap(c => allPrerequisitesOf(MATHEMATICS, c.id))
    .filter(id => EUCLID.nodes.some(n => n.id === id)))].join(', '))
t('and the departed nodes are not roots of it, because they are not in it',
  euclidRoots.every(id => !DEPARTED.includes(id)),
  euclidRoots.join(', '))

// ---------------------------------------------------------------------------

/**
 * THE FIRST PROMOTION OUT OF `TRIGONOMETRY`, AND THE FIRST INTO A NEW SUBJECT
 * SINCE THE GEOMETRY.
 *
 * `right-triangle-trig` is authored as `triangle-trigonometry`, a ninth subject
 * ontology holding one concept. Why a new subject rather than an addition to
 * `plane-geometry` is argued in ontology-trigonometry.ts's header; what is
 * checkable here is the structural half, and three of the four things below
 * are claims no previous promotion in this file has been able to make.
 *
 * THE AREA'S ROOT SET WENT FROM ONE MEMBER TO TWO, which is the growth case
 * and the opposite of what "an area gave up a node" sounds like. Inside
 * `areaOntology` an edge reaching outside the area is filtered away, so this
 * area's roots were the nodes with no `needs` INSIDE it — and that was the
 * departing node alone, every other node resting on something here. Removing
 * it promoted both of its in-area dependents. Asserted by named membership for
 * the reason this file gives twice already: a count going 1 → 2 says nothing
 * about which two.
 */
const TRIG = AREAS.find(a => a.id === 'trigonometry')
t('the ratios are gone from the area and carry the new subject',
  TRIG.nodes.every(n => n.id !== 'right-triangle-trig')
  && areaOf(MATHEMATICS, 'right-triangle-trig') === 'triangle-trigonometry'
  && isTeachable(MATHEMATICS, 'right-triangle-trig')
  && isPractisable(MATHEMATICS, 'right-triangle-trig'),
  `${areaOf(MATHEMATICS, 'right-triangle-trig')}`)
t('and the area\'s two roots are the departing node\'s own in-area dependents, by name',
  roots(areaOntology(TRIG)).slice().sort().join(' ') === 'law-of-sines-cosines unit-circle',
  roots(areaOntology(TRIG)).slice().sort().join(' '))
/*
 * The floor literal rather than the `STUB_FLOOR` constant, which is declared
 * further down this file and would be in its temporal dead zone here. The
 * number is restated in the message so a changed floor is visible either way.
 */
t('the area is twelve nodes against a floor of five, so nothing here was floor-bound',
  TRIG.nodes.length === 12 && TRIG.nodes.length - 5 === 7,
  `${TRIG.nodes.length} nodes, ${TRIG.nodes.length - 5} of headroom`)
/*
 * BOTH STRANDED EDGES HAD TO BECOME `links`, AND BOTH OF THEM GATE.
 *
 * The departing node's own `needs` were `similarity` and `pythagoras`, which
 * are concepts of `plane-geometry`. An authored ontology may only name
 * concepts it CONTAINS, so neither could go into `TRIANGLE_TRIGONOMETRY.edges`
 * — the same reason `roots-and-irrationals->pythagoras` had to come to
 * `EUCLIDEAN_GEOMETRY.links` rather than stay in a syllabus. They are declared
 * in the area that OWNED the departing node, which is why `promotedBy` reads
 * `atlas:trigonometry` and not `atlas:euclidean-geometry`.
 *
 * What is new is that this area's `links` list was EMPTY before, and both
 * entries arrived at once and both point at authored concepts with material.
 * `EUCLIDEAN_GEOMETRY`'s first link pointed at an unwritten node and gated
 * nothing for five promotions; these two gate from the moment they exist.
 */
const TRIG_LINKS = (TRIG.links ?? []).map(l => `${l.from}->${l.to}`).join(' ')
t('the area declares exactly the two cross-file edges the promotion stranded, in order',
  TRIG_LINKS === 'similarity->right-triangle-trig pythagoras->right-triangle-trig'
  && (TRIG.links ?? []).every(l => !!l.because),
  TRIG_LINKS)
t('and both resolve in the composed map, stamped with the area that owned the node',
  prerequisitesOf(MATHEMATICS, 'right-triangle-trig').slice().sort().join(' ')
    === 'pythagoras similarity'
  && MATHEMATICS.edges.filter(e =>
    e.to === 'right-triangle-trig' && e.kind === 'prerequisite')
    .every(e => e.promotedBy === 'atlas:trigonometry'),
  MATHEMATICS.edges.filter(e => e.to === 'right-triangle-trig')
    .map(e => `${e.from}:${e.promotedBy}`).join(' '))
/*
 * And the three edges pointing INTO the departed node, which were not touched
 * and must not have been. An edge is owned by the node that DECLARES it, so
 * `unit-circle` and `law-of-sines-cosines` here still name it in their own
 * `needs` and `composeAtlas` resolves both against the authored concept.
 *
 * The third was `dot-product-geometry`'s own `needs`, in another FILE, and it
 * is no longer declared that way: that node has itself been promoted, into
 * `vectors-and-independence`, and the edge was rehomed to
 * `EUCLIDEAN_GEOMETRY.links`. So it still resolves, still exactly once, and
 * still stamped `atlas:euclidean-geometry` — `expandEdges` derives a link's id
 * and promoter identically to a `needs` — which is why this assertion did not
 * have to change while the thing it is about did. That is the case the eleventh
 * promotion added to the record here: "an edge pointing into a departed node is
 * safe" holds only until the node at the other end is promoted too, and when it
 * is, the edge survives by being rewritten rather than by being left alone.
 *
 * Checked for duplication as well as for presence, because the one failure
 * `composeAtlas` does not report is the same edge arriving twice — once from a
 * node's `needs` and once from a `links` entry somebody added "for symmetry".
 */
t('the three edges that pointed into it survive the promotion, once each',
  ['unit-circle', 'law-of-sines-cosines', 'dot-product-geometry'].every(id =>
    prerequisitesOf(MATHEMATICS, id).includes('right-triangle-trig')
    && MATHEMATICS.edges.filter(e =>
      e.from === 'right-triangle-trig' && e.to === id).length === 1),
  MATHEMATICS.edges.filter(e => e.from === 'right-triangle-trig')
    .map(e => `${e.to}:${e.kind}`).join(' '))
t('and the node stranded no interference, which is the loss no other check sees',
  !MATHEMATICS.edges.some(e =>
    e.kind === 'interferes_with'
    && (e.from === 'right-triangle-trig' || e.to === 'right-triangle-trig')),
  MATHEMATICS.edges.filter(e => e.kind === 'interferes_with')
    .map(e => `${e.from}~${e.to}`).join(' '))
/*
 * THE GATE TIGHTENED AND THE LIST GOT SHORTER, WHICH IS THE READING A COUNT
 * GETS BACKWARDS.
 *
 * `gatingPrerequisitesOf` returns the NEAREST teachable ancestors, so a
 * concept authored BETWEEN a dependent and what it used to be gated by
 * replaces two entries with one — and the one is closer to what it gates. The
 * dot product used to be gated by `plane-vectors`, `similarity` and
 * `pythagoras` directly; now the geometry is reached through the ratios, which
 * have to be demonstrated as well. Three members became two and the gate got
 * stricter.
 *
 * `unit-circle` is the same tightening WITHOUT the shrink, and the pair is why
 * both are asserted. Seven members before and seven after: `similarity` left
 * and `right-triangle-trig` arrived, but `pythagoras` stayed, because it is
 * reached by a second route that does not pass through the new concept. So
 * "the list shrinks when the gate tightens" is not a rule either — what holds
 * is only that the membership changes, which is the whole argument for naming
 * members rather than counting them.
 *
 * AND THE SECOND ROUTE HAS SINCE BEEN CLOSED, which is worth amending rather
 * than deleting because the amendment is the same lesson one turn further on.
 * The fourteenth promotion authored `distance-and-midpoint`, which sits on
 * `pythagoras`'s ONLY route up to here — `circles-analytic` through
 * `lines-in-the-plane` — so the walk now stops at it and `pythagoras` drops out
 * after all. Still seven: `pythagoras` left and `distance-and-midpoint`
 * arrived, a second turnover at the same size on the same list.
 *
 * `cartesian-plane` is the member that now plays the role the comment above
 * gave `pythagoras`, and it is a better instance of it: it survives through
 * `linear-functions -> graphs-of-functions`, a branch in a different area
 * entirely, so no promotion out of the geometry can reach it. The claim worth
 * asserting is therefore the one about membership, and the sentence naming
 * WHICH member has the second route has now been wrong once — which is what a
 * claim about a path through unwritten nodes is, since authoring any node on
 * the path changes it.
 */
t('the dot product is now gated by the ratios, its gate shrinking from three to two',
  gatingPrerequisitesOf(MATHEMATICS, 'dot-product-geometry').slice().sort().join(' ')
    === 'plane-vectors right-triangle-trig',
  gatingPrerequisitesOf(MATHEMATICS, 'dot-product-geometry').join(', '))
t('and the oblique-triangle laws too, from three to two, in the departing node\'s own area',
  gatingPrerequisitesOf(MATHEMATICS, 'law-of-sines-cosines').slice().sort().join(' ')
    === 'right-triangle-trig triangle-basics',
  gatingPrerequisitesOf(MATHEMATICS, 'law-of-sines-cosines').join(', '))
t('while the unit circle is tightened onto it with its gate the same size, members swapped twice',
  gatingPrerequisitesOf(MATHEMATICS, 'unit-circle').slice().sort().join(' ')
    === 'cartesian-plane circles completing-the-square distance-and-midpoint '
      + 'domain-and-range linear-equations right-triangle-trig',
  gatingPrerequisitesOf(MATHEMATICS, 'unit-circle').join(', '))
/*
 * The new subject's own identity, which is the one thing a ninth ontology can
 * get wrong that none of the eight before it could.
 *
 * No subject id in the build collides with an AREA id — `plane-geometry`
 * against `euclidean-geometry`, `expressions-and-equations` against
 * `algebra-foundations` — and a collision would put two different things
 * behind one string in `areaOf` and `getOntology`. Naming the subject
 * `trigonometry` would have done exactly that, and would also have claimed the
 * eleven circular nodes that are still mapped.
 */
t('no subject id collides with an area id, which naming this one for the area would have done',
  ONTOLOGIES.every(o => !AREAS.some(a => a.id === o.subject.id)),
  ONTOLOGIES.map(o => o.subject.id).filter(id => AREAS.some(a => a.id === id)).join(', '))
t('and the subject it left behind still holds every circular node it never claimed',
  TRIG.nodes.some(n => n.id === 'unit-circle')
  && TRIG.nodes.some(n => n.id === 'radians')
  && TRIG.nodes.some(n => n.id === 'pythagorean-identity')
  && !isTeachable(MATHEMATICS, 'pythagorean-identity'),
  TRIG.nodes.map(n => n.id).join(' '))

// ---------------------------------------------------------------------------

/**
 * THE TWELFTH PROMOTION, AND THE FIRST OUT OF `EUCLIDEAN_GEOMETRY` TO CREATE A
 * SUBJECT.
 *
 * `solid-geometry` is authored as the only concept of `solid-measure`, a tenth
 * ontology. Why a new subject rather than an addition to `plane-geometry` is
 * argued in ontology-solids.ts's header and is shorter than the ninth
 * subject's argument was, because `plane-geometry` had already declined the
 * node in writing: its `covers` closed with "The solids are the rest and are
 * still mapped only". What is checkable here is the structural half.
 *
 * The group's whole reason to exist separately from the ninth subject's is the
 * collision check below. Everything else here is the same shape as that
 * promotion and is asserted for the same reasons; the naming hazard is new.
 */
const SOLIDS = ONTOLOGIES.find(o => o.subject.id === 'solid-measure')

group('the solids left the geometry area for a tenth subject')
t('the solids are gone from the area and carry the new subject',
  EUCLID.nodes.every(n => n.id !== 'solid-geometry')
  && areaOf(MATHEMATICS, 'solid-geometry') === 'solid-measure'
  && isTeachable(MATHEMATICS, 'solid-geometry')
  && isPractisable(MATHEMATICS, 'solid-geometry'),
  `${areaOf(MATHEMATICS, 'solid-geometry')}`)
/*
 * THE NAMING HAZARD THE NINTH SUBJECT DID NOT HAVE, AND THE ASSERTION THAT DID
 * NOT EXIST FOR IT.
 *
 * The obvious id for this subject was `solid-geometry`, which is the id of the
 * one concept it contains. No earlier subject shipped with its own name on a
 * concept, so nothing in this file would have objected — and the consequence is
 * real rather than stylistic. `areaOf` answers with a SUBJECT id for an
 * authored concept and an AREA id for a map node, so the concept would report
 * itself as its own area, and `getOntology` and `conceptById` would answer
 * about two different things behind one string.
 *
 * Asserted over every subject and every concept rather than over this one, for
 * the reason the area-id version of the check gives: an assertion about the
 * instance that provoked it stops working on the next one.
 */
t('no subject id collides with a CONCEPT id, which naming this one for its concept would have done',
  ONTOLOGIES.every(o => !MATHEMATICS.concepts.some(c => c.id === o.subject.id)),
  ONTOLOGIES.map(o => o.subject.id)
    .filter(id => MATHEMATICS.concepts.some(c => c.id === id)).join(', '))
t('and it still collides with no area id either, which is the half the ninth subject added',
  ONTOLOGIES.every(o => !AREAS.some(a => a.id === o.subject.id))
  && ONTOLOGIES.some(o => o.subject.id === 'solid-measure'),
  ONTOLOGIES.map(o => o.subject.id).filter(id => AREAS.some(a => a.id === id)).join(', '))
/*
 * The floor literal rather than the `STUB_FLOOR` constant, which is declared
 * further down this file and would be in its temporal dead zone here. The
 * number is restated in the message so a changed floor is visible either way.
 */
t('the area is nine nodes against a floor of five, so nothing here was floor-bound',
  EUCLID.nodes.length === 9 && EUCLID.nodes.length - 5 === 4,
  `${EUCLID.nodes.length} nodes, ${EUCLID.nodes.length - 5} of headroom`)
/*
 * THE FOURTEENTH PROMOTION'S TWO DEPENDENTS INSIDE THE AREA, which moved their
 * gating sets in OPPOSITE directions — and that is the whole reason both are
 * asserted rather than one standing for the pair.
 *
 * `lines-in-the-plane` stayed at four: `pythagoras` left, the new concept
 * arrived, and `cartesian-plane` survived through `linear-functions ->
 * graphs-of-functions`, which is a route in the `functions` area. So its gate
 * got stricter with no change of size.
 *
 * `loci-and-regions` went from four to THREE. It names `linear-inequalities`
 * rather than `linear-functions`, and nothing behind that node reaches the
 * plane — so `cartesian-plane` had no second route and dropped out with
 * `pythagoras`, two members replaced by one.
 *
 * Same promotion, same area, two dependents, one list the same length and one
 * shorter. The figure has to be computed on both sides rather than predicted,
 * and the direction is a property of the DEPENDENT's other branches rather than
 * of the promotion.
 */
t('its two in-area dependents moved in opposite directions, one swapping and one shrinking',
  gatingPrerequisitesOf(MATHEMATICS, 'lines-in-the-plane').slice().sort().join(' ')
    === 'cartesian-plane distance-and-midpoint domain-and-range linear-equations'
  && gatingPrerequisitesOf(MATHEMATICS, 'loci-and-regions').slice().sort().join(' ')
    === 'distance-and-midpoint linear-equations real-number-line',
  `lines:[${gatingPrerequisitesOf(MATHEMATICS, 'lines-in-the-plane').join(' ')}] `
  + `loci:[${gatingPrerequisitesOf(MATHEMATICS, 'loci-and-regions').join(' ')}]`)
t('and the dependent in another area gained it too, the edge resolving across the file boundary',
  gatingPrerequisitesOf(MATHEMATICS, 'arc-length-and-surface')
    .includes('distance-and-midpoint')
  && !gatingPrerequisitesOf(MATHEMATICS, 'arc-length-and-surface').includes('pythagoras')
  && prerequisitesOf(MATHEMATICS, 'arc-length-and-surface').includes('distance-and-midpoint'),
  gatingPrerequisitesOf(MATHEMATICS, 'arc-length-and-surface').join(', '))
/*
 * THE WHOLE OF THE STRANDED EDGE HAD TO BECOME A `links` ENTRY, which no
 * earlier promotion out of this area could show.
 *
 * The node declared ONE `needs`, `circle-measure`, and it is a concept of
 * `plane-geometry` — not of the subject the node joined. An ontology may only
 * name concepts it CONTAINS, so it could not go into `SOLID_MEASURE.edges`, and
 * `SOLID_MEASURE.edges` is empty as a result. Every expensive case before this
 * one had a second `needs` that stayed in a syllabus, so the rule read as a
 * statement about splitting a list; here there was nothing to split.
 *
 * The entry itself is asserted in the links group above, in order and with the
 * other five. What is asserted here is the consequence for the ontology: the
 * subject declares no edges at all, and its single concept is therefore its own
 * root — an emptiness that has to be checked, because an edge added there
 * naming `circle-measure` would look right and would make `ontologyProblems`
 * report an unknown endpoint.
 */
t('the new subject declares no edges, so its single concept is its own root',
  SOLIDS.edges.length === 0
  && SOLIDS.concepts.length === 1
  && roots(SOLIDS).join(' ') === 'solid-geometry',
  `${SOLIDS.edges.length} edges, ${SOLIDS.concepts.length} concepts`)
t('and the prerequisite it could not declare resolves once, stamped by the area that owned the node',
  prerequisitesOf(MATHEMATICS, 'solid-geometry').join(' ') === 'circle-measure'
  && MATHEMATICS.edges.filter(e =>
    e.from === 'circle-measure' && e.to === 'solid-geometry'
    && e.kind === 'prerequisite').length === 1
  && MATHEMATICS.edges.find(e =>
    e.from === 'circle-measure' && e.to === 'solid-geometry')
    ?.promotedBy === 'atlas:euclidean-geometry',
  MATHEMATICS.edges.filter(e => e.to === 'solid-geometry')
    .map(e => `${e.from}:${e.promotedBy}`).join(' '))
/*
 * And the two edges pointing INTO the departed node, which were not touched and
 * must not have been. An edge is owned by the node that DECLARES it, so
 * `three-dimensional-coordinates` here and `volumes-of-revolution` in
 * atlas-analysis.ts both still name it in their own `needs`, and `composeAtlas`
 * resolves each against the authored concept across a file boundary.
 *
 * Checked for duplication as well as for presence, because the one failure
 * `composeAtlas` does not report is the same edge arriving twice — once from a
 * node's `needs` and once from a `links` entry somebody added "for symmetry".
 */
t('the two edges that pointed into it survive the promotion, once each and from two map files',
  ['three-dimensional-coordinates', 'volumes-of-revolution'].every(id =>
    prerequisitesOf(MATHEMATICS, id).includes('solid-geometry')
    && MATHEMATICS.edges.filter(e =>
      e.from === 'solid-geometry' && e.to === id).length === 1),
  MATHEMATICS.edges.filter(e => e.from === 'solid-geometry')
    .map(e => `${e.to}:${e.kind}`).join(' '))
t('and the node stranded no interference, which is the loss no other check sees',
  !MATHEMATICS.edges.some(e =>
    e.kind === 'interferes_with'
    && (e.from === 'solid-geometry' || e.to === 'solid-geometry')),
  MATHEMATICS.edges.filter(e => e.kind === 'interferes_with')
    .map(e => `${e.from}~${e.to}`).join(' '))
/*
 * And what the subject does NOT claim, which is the sentence its own name is a
 * refusal of. `solid-measure` rather than a tenth "solid geometry": a solid's
 * incidence structure is not here, and the map still holds the nodes that would
 * carry it. Checked on the one that is nearest and most tempting — the regular
 * polyhedra are not a node of this build at all, so `non-euclidean-geometry` is
 * the node that stands for "a claim about solids that is not about measure",
 * and it is still mapped and still unwritten.
 */
t('and the subject claims none of the solids that are not about measure',
  EUCLID.nodes.some(n => n.id === 'non-euclidean-geometry')
  && !isTeachable(MATHEMATICS, 'non-euclidean-geometry')
  && SOLIDS.concepts.every(c => c.id === 'solid-geometry'),
  SOLIDS.concepts.map(c => c.id).join(' '))

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
 *
 * `ratio-and-rate` is the second id to leave, by the twelfth promotion and for
 * the identical reason, so the algebra row is down to three. The pair that left
 * is exactly the pair ontology-geometry.ts spent three promotions calling the
 * area-floor casualties — so this table shrinking is the merge being used for
 * what it was bought for, and the row reaching zero would mean every node the
 * merge rescued had been written.
 *
 * `dot-product-geometry` is the third id to leave and the first out of the
 * geometry row, so that one is down to eight. It is also the first id to leave
 * this table for a subject other than the one its own area's departures go to:
 * it is a concept of `vectors-and-independence`, not of `plane-geometry`. The
 * table does not care — "is this still a node of the area that absorbed it" is
 * false either way — but it is worth recording here, because this row reaching
 * zero would NOT mean the geometry syllabus had grown by nine.
 *
 * `three-dimensional-coordinates` is the fourth id to leave, by the thirteenth
 * promotion, so the geometry row is down to seven — and it went to
 * `vectors-and-independence` as well, which makes that subject the destination
 * of two of this row's four departures and of neither of the other row's. It is
 * also the id this whole table was bought for: the merge was argued on the
 * ground that this node "sits directly behind `solid-geometry`, so it was
 * blocked transitively by a floor in a different area from its own", and it is
 * the LAST of the five route concepts the merge rescued to be written. So the
 * geometry row has now paid for the merge in full, and what is left in it is
 * eight nodes nothing is waiting on.
 */
const MOVED = {
  'algebra-foundations': [
    'absolute-value', 'percent', 'scientific-notation',
  ],
  /*
   * `distance-and-midpoint` is the fifth id to leave this table, by the
   * fourteenth promotion, so the geometry row is down to six — and it is the
   * third of the five to go to a subject rather than stay a node of the area
   * that absorbed it. It left for `plane-geometry`, which makes that syllabus
   * the destination of two of this row's five departures and the vectors the
   * destination of two more.
   *
   * The row's remaining six are the whole of the coordinate half that is still
   * mapped — slope and the forms of a line, the circle as an equation, the
   * conics, the parametric curves, the transformations and the regions — and
   * none of them is on any route, so this row reaching zero is no longer
   * something the journeys will drive. It would now mean somebody chose to
   * write analytic geometry.
   */
  'euclidean-geometry': [
    'lines-in-the-plane', 'circles-analytic', 'conic-sections',
    'parametric-curves',
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
 *
 * TWO, SINCE `circles` WAS AUTHORED, which is the same event a second time and
 * is now the pattern rather than a one-off. The merge made
 * `circles → circles-analytic` internal to `euclidean-geometry`; the ninth
 * promotion took the lower end into `plane-geometry`, so that edge is
 * cross-file again too.
 *
 * Worth stating plainly because the count here will keep falling and falling is
 * the SUCCESS condition. A merge makes edges internal; authoring makes them
 * cross-file again, because an authored concept belongs to a subject and not to
 * an area. So this list shrinks every time the merge is used for what it was
 * bought for, and it reaching zero would mean every edge the merge rescued now
 * runs into real material. The invariant that does not move is `SURVIVING`
 * above — the edges exist — and that is the one guarding against a bulk move
 * deleting one.
 *
 * ONE, SINCE `ratio-and-rate` WAS AUTHORED, which is the same event a third
 * time and the one the paragraph above was written in anticipation of. The
 * merge made `ratio-and-rate → word-problems` internal to
 * `algebra-foundations`; the twelfth promotion took the lower end into
 * `arithmetic-foundations`, so it is cross-file again and resolved by
 * `composeAtlas`. The list is down to the single solids edge, and that one is
 * the last of the four the merges rescued still waiting on material.
 *
 * ZERO NOW, AND REACHING ZERO IS THE SUCCESS CONDITION THIS COMMENT NAMED IN
 * ADVANCE — so the list is DELETED rather than left as an empty array, for the
 * same reason an area that owes nothing has its row removed from the budget
 * table below: `[]` reads as a list somebody has not got round to filling in.
 *
 * `solid-geometry → three-dimensional-coordinates` was the fourth and last. The
 * merge made it internal to `euclidean-geometry` — that was the whole argument
 * for merging, since the upper end was blocked without its own area ever being
 * near the floor — and the solids are now a concept of `solid-measure`, so the
 * edge is cross-file again and `composeAtlas` resolves it. Every edge the two
 * merges rescued now runs into real material at its lower end, which is the
 * strongest form the evidence for those merges can take and the thing this
 * group was built to be able to say.
 */
const SPENT = [
  ['real-number-line', 'linear-inequalities'],
  ['circles', 'circles-analytic'],
  ['ratio-and-rate', 'word-problems'],
  ['solid-geometry', 'three-dimensional-coordinates'],
]
t('all four the promotions took back out are cross-file again, which is the whole gain spent',
  SPENT.every(([from, to]) => areaOf(MATHEMATICS, from) !== areaOf(MATHEMATICS, to)
    && isTeachable(MATHEMATICS, from)
    && prerequisitesOf(MATHEMATICS, to).includes(from)),
  SPENT.map(([f, x]) =>
    `${f}@${areaOf(MATHEMATICS, f)} -> ${x}@${areaOf(MATHEMATICS, x)}`).join(' | '))
/*
 * And WHY each is cross-file again, which the comparison of two `areaOf` values
 * does not say: the lower end is no longer a node of any area at all. That is
 * what being authored does, and it is the mechanism rather than the symptom —
 * an edge could also go cross-file by somebody moving a node between areas,
 * which would be a map change wearing a promotion's clothes.
 */
t('and each lower end left every area rather than moving between two, which is what authoring does',
  SPENT.every(([from]) => !AREAS.some(a => a.nodes.some(n => n.id === from))),
  SPENT.map(([from]) =>
    `${from}@${AREAS.find(a => a.nodes.some(n => n.id === from))?.id ?? 'no area'}`).join(' '))

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
t('the merged algebra area still declares exactly one', algebraInterference
  === 'linear-inequalities~linear-equations', algebraInterference)
/*
 * IT USED TO ASSERT THAT BOTH ENDS WERE NODES OF THIS AREA, AND THE
 * `linear-equations` PROMOTION FALSIFIED THAT HALF — correctly, so it is split
 * rather than relaxed.
 *
 * The claim was written for the merge, where it was the thing worth saying:
 * neither end had moved between areas, so the merge stranded no interference.
 * It is not a claim that survives authoring, because an authored concept is
 * not a node of ANY area — `areaOf` returns its subject. A sentence about an
 * end being "in the area" is exactly the sentence that rots when the end is
 * promoted, which is the lesson atlas-foundations.ts reaches by four routes.
 *
 * What is durable is in two halves, and both are checked:
 *
 *  - the DECLARING end is still a node here, which is why nothing was
 *    stranded. `expandEdges` turns a `confusedWith` into an
 *    `interferes_with`, so deleting the node that declared one deletes the
 *    edge in silence — interference constrains SELECTION rather than gating,
 *    so every suite stays green while the scheduler is freed to introduce the
 *    two most confusable concepts in the subject together. The promotion took
 *    the OTHER end, so there was nothing to re-home.
 *  - the edge survived into the composed graph with its reason, now joining an
 *    authored concept to a map node.
 *
 * Asserted separately because they fail for different reasons: the first goes
 * red if `linear-inequalities` is itself promoted without the interference
 * being re-declared in the ontology, and the second goes red if edge
 * resolution stops crossing the authored/mapped boundary.
 */
t('and the end that DECLARES it is still a node here, which is why nothing was stranded',
  ALGEBRA.nodes.some(n => n.id === 'linear-inequalities'
    && (n.confusedWith ?? []).some(c => c.id === 'linear-equations')),
  ALGEBRA.nodes.filter(n => (n.confusedWith ?? []).length).map(n => n.id).join(' '))
t('while the other end is authored now, so the edge joins a concept to a node and still holds',
  areaOf(MATHEMATICS, 'linear-equations') === 'expressions-and-equations'
  && isTeachable(MATHEMATICS, 'linear-equations')
  && !AREAS.some(a => a.nodes.some(n => n.id === 'linear-equations'))
  && MATHEMATICS.edges.some(e => e.kind === 'interferes_with' && !!e.rationale
    && e.from === 'linear-inequalities' && e.to === 'linear-equations'),
  `linear-equations@${areaOf(MATHEMATICS, 'linear-equations')}`)
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
 *
 * STILL SEVEN AFTER THE TWELFTH PROMOTION, AND EVERY WORD OF THAT IS THE POINT.
 * `ratio-and-rate` WAS a root of this area and has been authored out; `percent`
 * took its place, because `percent`'s two prerequisites are this concept and
 * `decimal-representation` and both are authored now, so nothing inside the
 * area comes before it. Seven before, seven after, one member different.
 *
 * This is the case the comment above describes as the reason for naming
 * members, happening for real rather than hypothetically: a `length === 7`
 * check would have passed on both sides of a change that replaced one of its
 * seven claims. It is also the opposite outcome from `real-number-line`'s
 * promotion, which shrank the set because the dependent it freed was still
 * gated from inside — so the two promotions out of this area have now
 * demonstrated both behaviours, substitution and shrinkage, and neither is
 * predictable from the departing node alone.
 *
 * NINE AFTER THE SEVENTEENTH PROMOTION, WHICH IS THE THIRD BEHAVIOUR AND THE
 * WIDEST FAN-OUT THIS AREA HAS PRODUCED. `linear-equations` was a root and has
 * been authored out, and THREE nodes took its place at once —
 * `linear-inequalities`, `systems-of-linear-equations` and `word-problems` —
 * because it was the LAST of their prerequisites still inside this area. Their
 * others had already gone: `real-number-line` and `ratio-and-rate` are concepts
 * of `arithmetic-foundations`.
 *
 * So this area has now shown all three outcomes a promotion can have on a root
 * set — shrinkage, one-for-one substitution, and one-for-three fan-out — and
 * together they are the argument for this shape of assertion rather than either
 * simpler one. A `length` check misses the substitution entirely and reports
 * the fan-out as "two more roots"; a check that only verified the departing
 * node had gone would pass on all three while saying nothing about who
 * replaced it.
 *
 * STILL NINE AFTER THE EIGHTEENTH PROMOTION, WITH ONE MEMBER DIFFERENT — the
 * substitution case for the second time, and it took one of the three members
 * the fan-out had just put in. `systems-of-linear-equations` was a root here
 * and is a concept of `expressions-and-equations` now; `nonlinear-systems`
 * takes its place, because that node's two prerequisites are this concept and
 * `quadratic-formula`, and both are authored. Nine before, nine after.
 *
 * Two promotions in a row out of this area have now each changed this list
 * while leaving its length alone or not, in no predictable pattern — which is
 * the practical case for naming members, over and above the argument. There is
 * no way to know which of the three outcomes a promotion will have without
 * computing the set on both sides of it.
 *
 * EIGHT AFTER THE NINETEENTH, WHICH IS SHRINKAGE AND THE CLEANEST CASE OF IT.
 * `binomial-theorem` was a root here and is a concept of `rational-expressions`
 * now. Nothing took its place, and the reason is structural rather than
 * incidental: a node can only substitute into this set by having its last
 * IN-AREA prerequisite authored away, and all three of this node's dependents
 * live in other areas — `power-and-sum-rules`, `counting-principles` and
 * `discrete-distributions`. A departing node with no in-area dependent can
 * therefore only ever shrink this set.
 *
 * So the four promotions since the merge have produced shrinkage, fan-out,
 * substitution and shrinkage, and the causes rather than the order are the
 * thing to read: whether the set grows, holds or shrinks is decided entirely by
 * how many nodes INSIDE this area had the departing node as their last
 * remaining in-area prerequisite — three, then one, then none.
 */
t('the merged algebra area has exactly these eight roots, the binomial having left',
  roots(areaOntology(ALGEBRA)).slice().sort().join(' ')
    === 'absolute-value complex-numbers linear-inequalities '
      + 'nonlinear-systems percent radical-equations scientific-notation word-problems',
  roots(areaOntology(ALGEBRA)).slice().sort().join(' '))
/*
 * The departing node asserted on both halves, which is the shape the comment
 * above argues for: that it has left the root set, AND that nothing replaced
 * it. A check on the first alone would pass on a promotion that silently
 * substituted a node in, and the substitution case is the one this area has
 * already produced twice.
 */
t('and nothing substituted in behind it, because none of its dependents is a node here',
  !roots(areaOntology(ALGEBRA)).includes('binomial-theorem')
  && isTeachable(MATHEMATICS, 'binomial-theorem')
  && dependentsOf(MATHEMATICS, 'binomial-theorem').length === 3
  && dependentsOf(MATHEMATICS, 'binomial-theorem')
    .every(d => !ALGEBRA.nodes.some(n => n.id === d)),
  dependentsOf(MATHEMATICS, 'binomial-theorem').join(' '))
t('and the promoted ratio is no longer one, because it is no longer a node of any area',
  !roots(areaOntology(ALGEBRA)).includes('ratio-and-rate')
  && isTeachable(MATHEMATICS, 'ratio-and-rate')
  && !AREAS.some(a => a.nodes.some(n => n.id === 'ratio-and-rate')),
  `${areaOf(MATHEMATICS, 'ratio-and-rate')}`)
/*
 * THE REPLACEMENT FOR "linear-inequalities DID NOT BECOME ONE", WHICH THIS
 * PROMOTION MADE FALSE RATHER THAN UNASSERTABLE.
 *
 * The old claim was the shrinkage case stated at the node that showed it:
 * `real-number-line` left, `linear-inequalities` rested on it, and it did NOT
 * become a root because `linear-equations` was still here gating it from
 * inside. Every word of that was true and the last clause has stopped being.
 *
 * It is restated as the fan-out rather than deleted, and at all three nodes
 * rather than one, because the rule being checked is about the LAST in-area
 * prerequisite and three different nodes satisfy it for three different
 * reasons — one had two prerequisites of which the other was already authored,
 * one had only ever had this one, and one had two with the other in the
 * arithmetic. Asserting it at a single node would check the rule in only the
 * shape that node happens to have.
 *
 * Each half requires the dependent to really be a node of this area, so none
 * can go vacuously true the way an optional-chained `every` over a missing
 * node would — the trap `euclidean-geometry`'s group records.
 *
 * ONE OF THE THREE HAS SINCE BEEN PROMOTED ITSELF, which is the hazard this
 * comment block keeps naming arriving at its own assertion.
 * `systems-of-linear-equations` is a concept now, so it is not a node of this
 * area, so `ALGEBRA.nodes.find(...)` for it returns undefined — and the
 * `?? []` in the old form of the second check would have made the claim about
 * it VACUOUSLY TRUE rather than red. That is the optional-chained-`every`
 * trap, in the group that was written warning about it, two promotions later.
 *
 * So the list is split rather than shortened. The two that are still nodes are
 * checked as before; the one that left is checked as having left, which is a
 * different and still-true claim about the same event. Shortening the list to
 * two would have lost the record that the fan-out was three wide, and leaving
 * it at three would have passed while asserting nothing about a third of it.
 */
const FANNED_OUT = ['linear-inequalities', 'word-problems']
const FANNED_OUT_SINCE_PROMOTED = 'systems-of-linear-equations'
t('and the nodes that rested on the solve and are still nodes became roots, it being their last in-area gate',
  FANNED_OUT.length === 2 && FANNED_OUT.every(id =>
    ALGEBRA.nodes.some(n => n.id === id && (n.needs ?? []).includes('linear-equations'))
    && roots(areaOntology(ALGEBRA)).includes(id)),
  FANNED_OUT.map(id => `${id}:${roots(areaOntology(ALGEBRA)).includes(id)}`).join(' '))
t('and every prerequisite each of them had is authored now, which is what "last" means here',
  FANNED_OUT.every(id => (ALGEBRA.nodes.find(n => n.id === id)?.needs ?? []).length > 0
    && (ALGEBRA.nodes.find(n => n.id === id)?.needs ?? [])
      .every(p => isTeachable(MATHEMATICS, p))),
  FANNED_OUT.map(id => `${id}: ${(ALGEBRA.nodes.find(n => n.id === id)?.needs ?? [])
    .map(p => `${p}@${areaOf(MATHEMATICS, p)}`).join('+')}`).join(' | '))
/*
 * The third member of the fan-out, asserted as a departure rather than
 * dropped. It really was one of the three — it declared `linear-equations` and
 * nothing else — and it really has gone, into the subject that already held
 * the node it depended on. Both halves are required, so this cannot go
 * vacuously true the way asserting it as a node would.
 */
t('while the third of the three was promoted in its turn, into the subject it depended on',
  !ALGEBRA.nodes.some(n => n.id === FANNED_OUT_SINCE_PROMOTED)
  && isTeachable(MATHEMATICS, FANNED_OUT_SINCE_PROMOTED)
  && areaOf(MATHEMATICS, FANNED_OUT_SINCE_PROMOTED) === 'expressions-and-equations'
  && prerequisitesOf(MATHEMATICS, FANNED_OUT_SINCE_PROMOTED).join(' ') === 'linear-equations',
  `${FANNED_OUT_SINCE_PROMOTED}@${areaOf(MATHEMATICS, FANNED_OUT_SINCE_PROMOTED)}`
  + ` needs ${prerequisitesOf(MATHEMATICS, FANNED_OUT_SINCE_PROMOTED).join('+')}`)
/*
 * And the gate that tightened, which is the half of a promotion no node's own
 * definition shows. While `linear-equations` was mapped-only it made no claim
 * about mastery, so `gatingPrerequisitesOf` looked straight THROUGH it and
 * named `variables-and-expressions`. It gates in its own right now, so all
 * three dependents are one demonstration further from a cold account with no
 * edit to any of them.
 *
 * Stated as the two-step chain for the reason the `polynomial-arithmetic` gate
 * above is: the immediate-gate form goes red whenever another concept is
 * authored in between, and the durable claim is that the route down is
 * unbroken and made of material a learner can go and practise.
 */
t('and the gate on both of those tightened onto the solve, which now stands between them and the reading',
  FANNED_OUT.every(id => {
    const g = gatingPrerequisitesOf(MATHEMATICS, id)
    if (!g.includes('linear-equations')) return false
    return gatingPrerequisitesOf(MATHEMATICS, 'linear-equations')
      .includes('variables-and-expressions')
  }),
  FANNED_OUT.map(id => `${id}: ${gatingPrerequisitesOf(MATHEMATICS, id).join('/')}`).join(' | '))

/**
 * THE NINETEENTH PROMOTION — AND THE FIRST WHOSE TWO `needs` WENT TO TWO
 * DIFFERENT HOMES.
 *
 * `binomial-theorem` declared `needs: ['polynomial-arithmetic',
 * 'exponent-rules']`. It was authored into `rational-expressions`, which
 * contains the first and not the second, so one edge became an ordinary
 * prerequisite in that ontology and the other had to become a `links` entry on
 * the area it left. Every promotion before this one sent all of its stranded
 * edges to a single destination, so the split is what this group is for.
 *
 * The `encompasses` is the part worth asserting hardest, because losing it is
 * SILENT. `links` carries `from`, `to` and `because` and no edge KIND, so a
 * credit edge is expressible only inside an ontology that holds both ends.
 * Had this concept been filed with the exponent rules instead, the
 * prerequisite would still have been expressible as a `links` entry and the
 * `encompasses` would have been expressible nowhere at all — and nothing would
 * have gone red, because `encompasses` affects what comes due rather than what
 * gates. The choice of subject was made on this, so it is checked here.
 */
group('the nineteenth promotion — one node, two edge destinations')
const BINOMIAL_LINKS = (ALGEBRA.links ?? [])
  .filter(l => l.to === 'binomial-theorem' || l.from === 'binomial-theorem')
t('the binomial theorem is authored, and is no longer a node of any area',
  isTeachable(MATHEMATICS, 'binomial-theorem')
  && areaOf(MATHEMATICS, 'binomial-theorem') === 'rational-expressions'
  && !AREAS.some(a => a.nodes.some(n => n.id === 'binomial-theorem')),
  `binomial-theorem@${areaOf(MATHEMATICS, 'binomial-theorem')}`)
t('both of the needs it declared survive in the composed graph',
  ['polynomial-arithmetic', 'exponent-rules'].every(id =>
    prerequisitesOf(MATHEMATICS, 'binomial-theorem').includes(id)
    && isTeachable(MATHEMATICS, id)),
  prerequisitesOf(MATHEMATICS, 'binomial-theorem')
    .map(id => `${id}@${areaOf(MATHEMATICS, id)}`).join(' '))
/*
 * The in-ontology half: both ends are concepts of `rational-expressions`, so
 * the edge belongs there and NOT in `links`. A `links` entry for it would be a
 * second copy of an edge `composeAtlas` already resolves, and a duplicate is
 * not something it notices or any other test catches.
 */
t('the same-subject edge lives in the ontology and not in links',
  RATIONAL_EXPRESSIONS.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'polynomial-arithmetic' && e.to === 'binomial-theorem')
  && !BINOMIAL_LINKS.some(l => l.from === 'polynomial-arithmetic'),
  BINOMIAL_LINKS.map(l => `${l.from}->${l.to}`).join(' '))
/*
 * The cross-subject half. `exponent-rules` is a concept of
 * `exponents-and-logarithms`, so neither ontology may name this edge —
 * `ontologyProblems` would report an unknown endpoint — and `links` is the only
 * home. Asserted from both sides: present as a link with a reason, and absent
 * from both ontologies' own edge lists.
 */
t('the cross-subject edge is a links entry on the area the node left, with a reason',
  BINOMIAL_LINKS.filter(l => l.from === 'exponent-rules').length === 1
  && !!BINOMIAL_LINKS.find(l => l.from === 'exponent-rules')?.because,
  BINOMIAL_LINKS.map(l => `${l.from}->${l.to}`).join(' '))
t('and no ontology declares it, which is why links had to',
  ONTOLOGIES.every(o => !o.edges.some(e =>
    e.from === 'exponent-rules' && e.to === 'binomial-theorem')),
  ONTOLOGIES.filter(o => o.edges.some(e =>
    e.from === 'exponent-rules' && e.to === 'binomial-theorem'))
    .map(o => o.subject.id).join(' '))
/*
 * No per-concept duplicate check here, deliberately. The double-emit this
 * promotion could have caused — leaving a `links` entry in place while also
 * declaring the edge in the ontology — is already caught twice over by the
 * whole-graph assertions near the top of this area's section: `no links entry
 * has both of its ends inside its own area`, and `the composed graph holds no
 * edge twice`. A third copy scoped to one concept would add a maintenance
 * burden and no coverage.
 */
/*
 * The credit edge — the one `links` could not have carried. It is what decided
 * the subject, so a later move of this concept into another ontology should
 * fail here rather than quietly drop it.
 */
t('the encompasses edge is declared, in the ontology, with a rationale',
  RATIONAL_EXPRESSIONS.edges.some(e => e.kind === 'encompasses'
    && e.from === 'binomial-theorem' && e.to === 'polynomial-arithmetic' && !!e.rationale),
  RATIONAL_EXPRESSIONS.edges.filter(e => e.from === 'binomial-theorem')
    .map(e => `${e.kind}->${e.to}`).join(' '))
/*
 * THE GATE, AND WHY THIS ONE IS DIFFERENT FROM EVERY OTHER `links` ENTRY ON
 * THIS AREA. The entries above it were written while one end was an unwritten
 * map node, and `gatingPrerequisitesOf` looks THROUGH an unteachable
 * prerequisite rather than at it — so they stand in the graph and gate nobody.
 * Both ends of this one are authored, so it gates on arrival.
 *
 * Asserted as "names both, and both are teachable" rather than by listing the
 * set, because the gating walk returns NEAREST authored ancestors and a later
 * promotion in between would change the set without breaking the claim.
 */
t('and it gates immediately, both ends being authored — unlike every other link on this area',
  ['polynomial-arithmetic', 'exponent-rules'].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, 'binomial-theorem').includes(id)
    && isTeachable(MATHEMATICS, id)),
  gatingPrerequisitesOf(MATHEMATICS, 'binomial-theorem').join(' '))
/*
 * The three dependents, which are the edges a promotion does NOT touch. All
 * three are declared at the far end, in three different files, so all three
 * resolve through `composeAtlas` untouched. Each half is required, so the claim
 * cannot pass vacuously on a node that has since been promoted away.
 */
const BINOMIAL_DEPENDENTS = ['power-and-sum-rules', 'counting-principles', 'discrete-distributions']
t('its three dependents still declare the edge themselves, in three other areas',
  BINOMIAL_DEPENDENTS.every(id => {
    const area = AREAS.find(a => a.nodes.some(n => n.id === id))
    if (!area || area.id === 'algebra-foundations') return false
    return (area.nodes.find(n => n.id === id).needs ?? []).includes('binomial-theorem')
      && prerequisitesOf(MATHEMATICS, id).includes('binomial-theorem')
  }),
  BINOMIAL_DEPENDENTS.map(id =>
    `${id}@${AREAS.find(a => a.nodes.some(n => n.id === id))?.id}`).join(' '))

/**
 * THE EIGHTEENTH PROMOTION — AND THE FIRST OUT OF THIS AREA WHOSE EFFECT
 * LANDED IN A DIFFERENT AREA'S FILE.
 *
 * `systems-of-linear-equations` is the third concept of
 * `expressions-and-equations`, which makes that subject a chain of three
 * authored in dependency order. Most of what that promotion did is asserted in
 * the groups above, as the root substitution and the departure. What is here is
 * the part neither of those can see.
 *
 * `gaussian-elimination` is a node of `linear-algebra`. It declares
 * `needs: ['matrices-and-maps', 'systems-of-linear-equations']`, so the edge
 * into the promoted concept is owned by a node in atlas-structures.ts and
 * survived this promotion untouched — but what GATES it changed, because the
 * walk used to pass straight through a node with no material and report
 * `linear-equations` instead. So a change to atlas-foundations.ts altered the
 * gate on a node in another file, with no edit to that file and nothing in its
 * text saying so. That is the one shape of consequence a per-area group cannot
 * catch, which is why it is asserted here and across the boundary.
 *
 * IT ALSO NAMES IT UNDER `exercises`, AND THAT EDGE HAS ONLY NOW ACQUIRED
 * SOMETHING TO DO. `expandEdges` turns a node's `exercises` into an
 * `encompasses` edge unconditionally (lib/concepts/atlas.ts), so the edge has
 * existed all along — but `encompasses` is what makes credit computable, and
 * until this promotion its far end was a node with no knowledge points, so
 * there was nothing for the credit to land on. Practising row reduction can
 * now discharge review that would otherwise come due on the systems concept,
 * which is the inefficiency that edge kind exists to prevent.
 *
 * Worth separating from the authored case, because the two look identical and
 * are not. An ontology restating a departed node's `exercises` as its own
 * `encompasses` edge is a claim about what PRACTISING exercises, measured
 * against the tasks that actually exist, and ontology-arithmetic.ts declines
 * one on `gcd-and-lcm` for exactly that reason. A map node's `exercises` is a
 * claim about the mathematics and is expanded for free. So this edge being
 * present is not evidence that the authored-side judgement was made either way.
 */
group('the systems promotion reached across into linear algebra')
const LINALG = AREAS.find(a => a.id === 'linear-algebra')
/*
 * THE NODE THIS GROUP WAS WRITTEN ABOUT HAS SINCE BEEN AUTHORED, so the two
 * assertions that read it off `LINALG.nodes` are gone and what replaced them is
 * the same three claims made against the composed graph instead. That is the
 * shape of maintenance this file keeps performing and it is worth naming: an
 * assertion about a MAP NODE has a shelf life ending at the node's promotion,
 * while the same claim about an EDGE survives it, because the edge outlives the
 * node that declared it if somebody re-homes it.
 *
 * The group is kept rather than deleted because the claim it makes — the
 * systems promotion changed something in a file it did not touch — is still
 * true and is still the only place that crossing is checked.
 */
t('the edges the systems promotion reached across with survive the far node being authored too',
  MATHEMATICS.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'systems-of-linear-equations' && e.to === 'gaussian-elimination')
  && MATHEMATICS.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'matrices-and-maps' && e.to === 'gaussian-elimination'),
  MATHEMATICS.edges.filter(e => e.kind === 'prerequisite' && e.to === 'gaussian-elimination')
    .map(e => `${e.from}@${areaOf(MATHEMATICS, e.from)}`).join(' '))
t('and its gate is the systems rather than the solve, which is what that promotion did to it',
  gatingPrerequisitesOf(MATHEMATICS, 'gaussian-elimination')
    .includes('systems-of-linear-equations')
  && !gatingPrerequisitesOf(MATHEMATICS, 'gaussian-elimination')
    .includes('linear-equations')
  && gatingPrerequisitesOf(MATHEMATICS, 'systems-of-linear-equations')
    .includes('linear-equations'),
  gatingPrerequisitesOf(MATHEMATICS, 'gaussian-elimination').join(', '))
t('and the credit edge survived the promotion of the node that used to declare it',
  MATHEMATICS.edges.some(e => e.kind === 'encompasses'
    && e.from === 'gaussian-elimination' && e.to === 'systems-of-linear-equations')
  && isPractisable(MATHEMATICS, 'systems-of-linear-equations')
  && isPractisable(MATHEMATICS, 'gaussian-elimination'),
  MATHEMATICS.edges.filter(e => e.kind === 'encompasses' && e.from === 'gaussian-elimination')
    .map(e => `${e.to}:practisable=${isPractisable(MATHEMATICS, e.to)}`).join(' '))
/*
 * The two things a promotion can strand that no suite reports, checked as
 * absences on the node that left. Both have to be checked by hand, because
 * `composeAtlas` cannot miss an edge that is no longer declared anywhere.
 *
 * The `confusedWith` is the one that matters. `expandEdges` turns it into an
 * `interferes_with`, and interference constrains SELECTION rather than gating —
 * so dropping one keeps every suite green while freeing the scheduler to
 * introduce the two most confusable concepts in a subject together. This node
 * declared none, so nothing was lost, and the assertion is what makes that a
 * fact on record rather than a claim in a comment.
 */
t('no interference was lost, the promoted node having declared none to lose',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'systems-of-linear-equations' || e.to === 'systems-of-linear-equations')),
  MATHEMATICS.edges.filter(e => e.kind === 'interferes_with'
    && (e.from === 'systems-of-linear-equations' || e.to === 'systems-of-linear-equations'))
    .map(e => `${e.from}~${e.to}`).join(' '))
t('and the area gained no links entry, both ends of its one edge being in the same subject',
  !ALGEBRA.links.some(l => l.to === 'systems-of-linear-equations'
    || l.from === 'systems-of-linear-equations')
  && areaOf(MATHEMATICS, 'linear-equations') === 'expressions-and-equations'
  && areaOf(MATHEMATICS, 'systems-of-linear-equations') === 'expressions-and-equations',
  ALGEBRA.links.filter(l => l.to === 'systems-of-linear-equations'
    || l.from === 'systems-of-linear-equations').map(l => `${l.from}->${l.to}`).join(' '))

/**
 * THE FOURTEENTH PROMOTION — THE FIRST OUT OF `linear-algebra`, AND THE ONE
 * THAT FINISHED THE LAST ROUTE IN THE BUILD.
 *
 * `gaussian-elimination` is a concept of `expressions-and-equations` now and
 * no longer a node here. Four things it did are checked below and they fail
 * differently:
 *
 *  - THE DEPARTURE. Eleven nodes before, ten after, against a floor of five.
 *    Nothing here is frozen by it and the two nodes that rest on row reduction
 *    declare their own edges, so they kept them.
 *  - THE STRANDED HALF. The node declared two `needs`; one pointed into the
 *    subject it went to and is an ordinary edge there, the other pointed at
 *    `matrices-and-maps` in a THIRD subject and could be declared by neither
 *    ontology. That is the new `links` entry, and it is the entry this suite
 *    exists to catch the absence of — a dropped prerequisite is silent.
 *  - THE EDGE THAT WAS NOT HANDED BACK. `gaussian-elimination → determinant`
 *    is still a `links` entry and still has to be. The cartesian-plane
 *    promotion established that an entry must be DELETED when the promoted
 *    concept lands in the same ontology as the far end; this one landed in a
 *    different ontology from `determinant`, so the entry stays. Asserted
 *    positively, because "we checked and it was fine" is otherwise a claim in a
 *    comment, and a duplicate edge in the composed graph is something
 *    `composeAtlas` does not notice.
 *  - THE AREA ROOTS, BY NAMED MEMBERSHIP. The departing node had no in-area
 *    prerequisite — both its `needs` pointed outside, so `areaOntology`
 *    filtered them away — which made it a root of the area view. It is gone
 *    and `vector-spaces` is the only root left. A `length` check would have
 *    gone from two to one and said nothing about which.
 */
group('the fourteenth promotion, and the first out of linear algebra')
t('the row reduction is a concept of the equations subject, not a node of this area',
  !LINALG.nodes.some(n => n.id === 'gaussian-elimination')
  && areaOf(MATHEMATICS, 'gaussian-elimination') === 'expressions-and-equations'
  && isTeachable(MATHEMATICS, 'gaussian-elimination'),
  `${areaOf(MATHEMATICS, 'gaussian-elimination')}, `
  + `node here: ${LINALG.nodes.some(n => n.id === 'gaussian-elimination')}`)
/*
 * The floor literal rather than the `STUB_FLOOR` constant, which is declared
 * further down this file and would be in its temporal dead zone here — the same
 * note the trigonometry and geometry departures carry. The number is restated in
 * the message so a changed floor is visible either way.
 */
/*
 * TEN AT THIS PROMOTION, NINE AFTER THE TWENTIETH AND EIGHT AFTER THE
 * TWENTY-SECOND, which is why the sentence names the HEADROOM rather than the
 * count: three promotions have now come out of this one area, and what each has
 * to leave behind is room above the floor rather than a particular number of
 * nodes. The literal is asserted beside it so the number is pinned as well as
 * the margin, and both are in the message.
 *
 * Three of the six it started with are spent. The next departure leaves two and
 * the one after that freezes the area, so this is where the count starts
 * mattering — and only one of the eight remaining nodes has every prerequisite
 * written, so the floor will not be what stops the next one either.
 */
t('eight nodes left, three clear of the floor, so no departure has frozen anything',
  LINALG.nodes.length === 8 && LINALG.nodes.length - 5 === 3,
  `${LINALG.nodes.length} nodes, ${LINALG.nodes.length - 5} of headroom`)
t('the stranded half of its needs is a links entry here, filed with the area that lost the node',
  LINALG.links.some(l => l.from === 'matrices-and-maps' && l.to === 'gaussian-elimination'
    && !!l.because)
  && areaOf(MATHEMATICS, 'matrices-and-maps') === 'matrices-and-determinants'
  && MATHEMATICS.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'matrices-and-maps' && e.to === 'gaussian-elimination'),
  LINALG.links.filter(l => l.to === 'gaussian-elimination')
    .map(l => `${l.from}@${areaOf(MATHEMATICS, l.from)}->${l.to}`).join(' ') || 'MISSING')
t('and the other half is not here, both its ends being concepts of one subject',
  !LINALG.links.some(l => l.from === 'systems-of-linear-equations')
  && areaOf(MATHEMATICS, 'systems-of-linear-equations') === 'expressions-and-equations'
  && areaOf(MATHEMATICS, 'gaussian-elimination') === 'expressions-and-equations',
  LINALG.links.filter(l => l.from === 'systems-of-linear-equations')
    .map(l => `${l.from}->${l.to}`).join(' ') || 'none, as it should be')
t('the determinant edge was NOT handed back, its far end being in a different ontology',
  LINALG.links.filter(l => l.from === 'gaussian-elimination' && l.to === 'determinant')
    .length === 1
  && areaOf(MATHEMATICS, 'determinant') === 'matrices-and-determinants'
  && areaOf(MATHEMATICS, 'gaussian-elimination') !== 'matrices-and-determinants'
  && MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
    && e.from === 'gaussian-elimination' && e.to === 'determinant').length === 1,
  `${areaOf(MATHEMATICS, 'gaussian-elimination')} -> `
  + `${areaOf(MATHEMATICS, 'determinant')}, `
  + `${MATHEMATICS.edges.filter(e => e.from === 'gaussian-elimination'
    && e.to === 'determinant').length} edge(s)`)
/*
 * The gate, which is the half of this promotion no node's own definition shows
 * and which moved in the counter-intuitive direction. `gatingPrerequisitesOf`
 * names the NEAREST teachable ancestors and looks through the unteachable ones,
 * so while row reduction had no material the walk passed through it and
 * reported what IT rested on — two concepts in two other subjects. Now the walk
 * stops at it. So `determinant` went from three gating concepts to two and
 * `rank-nullity` from three to two: a tighter gate is a SHORTER list.
 *
 * Asserted as membership and not as length, for the reason the area-roots check
 * above gives. The counts are in the message so a future reader can see which
 * way they moved without recomputing them.
 */
t('the gate tightened onto the row reduction in three places, in two files nobody edited',
  gatingPrerequisitesOf(MATHEMATICS, 'determinant').includes('gaussian-elimination')
  && !gatingPrerequisitesOf(MATHEMATICS, 'determinant')
    .includes('systems-of-linear-equations')
  && gatingPrerequisitesOf(MATHEMATICS, 'rank-nullity').includes('gaussian-elimination')
  && gatingPrerequisitesOf(MATHEMATICS, 'numerical-linear-algebra')
    .includes('gaussian-elimination'),
  ['determinant', 'rank-nullity', 'numerical-linear-algebra']
    .map(id => `${id}: ${gatingPrerequisitesOf(MATHEMATICS, id).join('/')}`).join(' | '))
/*
 * THE ROOT THIS LEFT BEHIND HAS SINCE BEEN PROMOTED TWICE OVER, so the claim is
 * kept as a chain of edits rather than rewritten each time: the fourteenth
 * promotion SUBSTITUTED `vector-spaces` into the root set, the twentieth SPLIT
 * it in two, and the twenty-second both shrank it by one member and split it
 * again. Asserting only the current trio would lose the first two halves, and
 * the first is the one that says the departing node had no in-area
 * prerequisite.
 *
 * Every half by named membership, never by length: one became two and then
 * three, and only one member of the current set was in the previous one. A
 * count would read "two became three" and make no claim about WHICH three —
 * and getting the set wrong is how a node silently loses its only prerequisite.
 */
t('and the area view has the three roots the dimension left, not the two it was one of',
  roots(areaOntology(LINALG)).slice().sort().join(' ')
    === 'eigenvalues inner-product-spaces rank-nullity'
  && !LINALG.nodes.some(n => n.id === 'vector-spaces')
  && !LINALG.nodes.some(n => n.id === 'basis-and-dimension'),
  roots(areaOntology(LINALG)).join(' '))
/*
 * The two stranding checks, as absences on the node that left — the pair that
 * no suite reports and that have to be looked for to be known.
 *
 * `confusedWith` is the one that matters: `expandEdges` turns one into an
 * `interferes_with`, and interference constrains SELECTION rather than gating,
 * so dropping one keeps every suite green while freeing the scheduler to
 * introduce the two most confusable concepts in a subject together. The node
 * declared none, and this is the record that it was checked.
 */
t('no interference was lost, the promoted node having declared none to lose',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'gaussian-elimination' || e.to === 'gaussian-elimination')),
  MATHEMATICS.edges.filter(e => e.kind === 'interferes_with'
    && (e.from === 'gaussian-elimination' || e.to === 'gaussian-elimination'))
    .map(e => `${e.from}~${e.to}`).join(' '))
/*
 * And the credit edge, which `links` could not have carried. An area's `links`
 * produces `prerequisite` edges only, so an `encompasses` edge between two
 * concepts in different ontologies is expressible NOWHERE — not in either
 * ontology, which may only name concepts it contains, and not here. That is why
 * the concept is filed in the subject holding the far end: it is the only
 * filing under which this edge exists at all.
 *
 * Checked as a property of `links` rather than only as the edge surviving, so
 * the reason stays true rather than just the outcome.
 */
t('the credit edge is intra-subject, which is the only way it could exist — links carries no kinds',
  MATHEMATICS.edges.some(e => e.kind === 'encompasses'
    && e.from === 'gaussian-elimination' && e.to === 'systems-of-linear-equations')
  && areaOf(MATHEMATICS, 'gaussian-elimination')
    === areaOf(MATHEMATICS, 'systems-of-linear-equations')
  && AREAS.flatMap(a => a.links ?? []).every(l => l.kind === undefined),
  `both in ${areaOf(MATHEMATICS, 'gaussian-elimination')}; `
  + `${AREAS.flatMap(a => a.links ?? []).length} links entries, none kinded`)

// ---------------------------------------------------------------------------

/**
 * THE TWENTIETH PROMOTION, AND THE ONLY ONE CHOSEN FOR WHERE THE NODE STOOD.
 *
 * `vector-spaces` was the SOLE ROOT of this area — every one of its ten nodes
 * reached it — so the whole of linear algebra was gated behind one unwritten
 * concept, and `gatingPrerequisitesOf` was answering for it by naming what IT
 * rested on, in a subject two files away. Nothing else selected it: every
 * journey reads zero unwritten, no area is near the floor, and about nineteen
 * nodes have all their prerequisites written. The route table below is empty
 * and stays empty.
 *
 * WHAT THIS SUITE HAS TO CHECK, in the order the mistakes would have been
 * silent in:
 *
 *  - THE TWO EDGES POINTING IN. `basis-and-dimension` and
 *    `inner-product-spaces` name the departing node in their OWN `needs`, so
 *    those edges are declared on nodes that remain and survive untouched. That
 *    is the half of a departure that needs no action and looks like the
 *    dangerous half, and the way it would fail is not an error but a node
 *    quietly rooted with nothing above it.
 *  - NO `links` ENTRY, EITHER WAY. The node's own single `needs` pointed at a
 *    concept of the subject it went to, so the stranded edge went into that
 *    ontology and nothing was owed here; and no existing entry named it, so
 *    nothing was handed back and there is no duplicate edge to find. Both are
 *    asserted as absences, because a duplicate edge in the composed graph is
 *    something `composeAtlas` does not notice.
 *  - THE GATE, WHICH GREW RATHER THAN SHRANK. The fourteenth promotion's note
 *    above says a tighter gate is a SHORTER list, and that is true when the
 *    promoted concept HIDES farther ancestors behind itself. Here it does not:
 *    `basis-and-dimension` names `linear-independence` in its own `needs` as
 *    well, so that stays visible and the axioms are named beside it — one entry
 *    became two. `rank-nullity`, two steps up, gains the axioms for the other
 *    reason: the walk through its unteachable parent now stops one concept
 *    nearer. Which direction a gate moves is a fact about the graph, so these
 *    are asserted by membership and the counts are only in the message.
 */
group('the twentieth promotion, and the first out of this area\'s root')
t('the axioms are a concept of the vectors subject, not a node of this area',
  !LINALG.nodes.some(n => n.id === 'vector-spaces')
  && areaOf(MATHEMATICS, 'vector-spaces') === 'vectors-and-independence'
  && isTeachable(MATHEMATICS, 'vector-spaces'),
  `${areaOf(MATHEMATICS, 'vector-spaces')}, `
  + `node here: ${LINALG.nodes.some(n => n.id === 'vector-spaces')}`)
t('its one stranded needs is an ontology edge, so this area owes no links entry for it',
  MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
    && e.from === 'linear-independence' && e.to === 'vector-spaces').length === 1
  && MATHEMATICS.edges.find(e =>
    e.from === 'linear-independence' && e.to === 'vector-spaces')
    ?.promotedBy === 'author:vectors-and-independence'
  && areaOf(MATHEMATICS, 'linear-independence') === 'vectors-and-independence',
  MATHEMATICS.edges.filter(e => e.to === 'vector-spaces')
    .map(e => `${e.from}:${e.promotedBy}`).join(' '))
t('and no links entry of any area names it, so nothing was handed back or dropped',
  AREAS.flatMap(a => (a.links ?? []).map(l => `${a.id}:${l.from}->${l.to}`))
    .filter(s => s.includes('vector-spaces')).length === 0,
  AREAS.flatMap(a => (a.links ?? []).map(l => `${a.id}:${l.from}->${l.to}`))
    .filter(s => s.includes('vector-spaces')).join(' ') || 'none, as it should be')
/*
 * BOTH EDGES STILL EXIST ONCE EACH AND THEY ARE NO LONGER STAMPED THE SAME WAY,
 * which is why the `promotedBy` claim is now per edge rather than quantified
 * over the pair.
 *
 * At the twentieth promotion both were declared on nodes that remained, so
 * `composeAtlas` stamped both `atlas:linear-algebra`. The twenty-second wrote
 * `basis-and-dimension` out of the area, which stranded the declaration — and
 * because `vector-spaces` is a concept of the subject it joined, the edge was
 * rehomed to that ontology's own `EDGES` and is stamped
 * `author:vectors-and-independence` now. The edge did not change; where it is
 * DECLARED did.
 *
 * Asserted this way rather than loosened to "the edge exists" because the stamp
 * is the only thing that distinguishes a rehomed edge from a dropped one
 * silently replaced by a duplicate from somewhere else: an edge counted once
 * with the wrong provenance means two files both think they own it.
 */
t('both edges survive once each, now stamped by the two different files that declare them',
  ['basis-and-dimension', 'inner-product-spaces'].every(id =>
    MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
      && e.from === 'vector-spaces' && e.to === id).length === 1)
  && MATHEMATICS.edges.find(e =>
    e.from === 'vector-spaces' && e.to === 'inner-product-spaces')
    ?.promotedBy === 'atlas:linear-algebra'
  && MATHEMATICS.edges.find(e =>
    e.from === 'vector-spaces' && e.to === 'basis-and-dimension')
    ?.promotedBy === 'author:vectors-and-independence',
  MATHEMATICS.edges.filter(e => e.from === 'vector-spaces')
    .map(e => `${e.to}:${e.promotedBy}`).join(' '))
/*
 * THE GATE, AND THE HALF OF THIS CLAIM THE TWENTY-SECOND PROMOTION TOOK BACK.
 *
 * At the twentieth, all three of these gated on `vector-spaces`, and in two of
 * them the list GREW because the promoted concept did not hide what lay behind
 * it. `rank-nullity` was the third, which gained the axioms because the walk
 * through its unteachable parent stopped one concept nearer. That parent is
 * `basis-and-dimension`, and it is teachable now — so the walk stops there
 * instead, and `rank-nullity`'s gate went from three entries to two with the
 * axioms no longer named at all. The claim for it is therefore the opposite
 * one, and is asserted in this promotion's own group below.
 *
 * What stays true here is the pair whose gate really is the axioms, and the
 * reason their lists grew. Scoped to those two rather than quantified over
 * three: a quantifier that happens to still pass over a shrunk list would be
 * making a claim nobody checked.
 */
t('the gate tightened onto the axioms in the two places that still name them, and both lists grew',
  ['basis-and-dimension', 'inner-product-spaces'].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).includes('vector-spaces'))
  && gatingPrerequisitesOf(MATHEMATICS, 'basis-and-dimension')
    .includes('linear-independence')
  && gatingPrerequisitesOf(MATHEMATICS, 'inner-product-spaces')
    .includes('dot-product-geometry')
  && !gatingPrerequisitesOf(MATHEMATICS, 'rank-nullity').includes('vector-spaces'),
  ['basis-and-dimension', 'inner-product-spaces', 'rank-nullity']
    .map(id => `${id}: ${gatingPrerequisitesOf(MATHEMATICS, id).join('/')}`).join(' | '))
t('and every gate it names is teachable, so each is somewhere to go',
  ['basis-and-dimension', 'inner-product-spaces', 'rank-nullity'].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).every(p => isTeachable(MATHEMATICS, p))))
/*
 * The two stranding absences, looked for rather than inferred from a green
 * suite — the same pair the fourteenth promotion recorded. `confusedWith`
 * becomes an `interferes_with`, which constrains SELECTION and gates nothing,
 * so losing one is invisible here; `exercises` becomes an `encompasses`, which
 * between two ontologies is expressible nowhere and would therefore have CHOSEN
 * the filing. The node declared neither, so the filing was decided on content.
 */
t('no interference and no credit edge were lost, the node having declared neither',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'vector-spaces' || e.to === 'vector-spaces'))
  && !MATHEMATICS.edges.some(e => e.kind === 'encompasses'
    && (e.from === 'vector-spaces' || e.to === 'vector-spaces')),
  MATHEMATICS.edges.filter(e =>
    (e.from === 'vector-spaces' || e.to === 'vector-spaces') && e.kind !== 'prerequisite')
    .map(e => `${e.from}~${e.kind}~${e.to}`).join(' ') || 'neither, as the node declared')

// ---------------------------------------------------------------------------

/**
 * THE TWENTY-SECOND PROMOTION, OUT OF ONE OF THE TWO ROOTS THE TWENTIETH LEFT.
 *
 * `basis-and-dimension` went into `vectors-and-independence`, the same subject
 * as the axioms it rested on, and the file it left is the same one — three
 * promotions out of `linear-algebra` now. The subject half is in
 * tests/concepts-logic.mjs. What belongs here is the map half, and five things
 * would have failed silently:
 *
 *  - NO `links` ENTRY, EITHER WAY. The node declared BOTH of its `needs` into
 *    the receiving ontology, so both stranded edges went there and this area
 *    owed nothing. Worth asserting against the twentieth promotion's note,
 *    which calls a single stranded edge "the cheapest shape a promotion can
 *    have": the cost is about where each `needs` POINTS, so two edges landing
 *    in one ontology is as cheap as one. And no existing entry named the node,
 *    so nothing was handed back. Both are absences, and a duplicate edge in the
 *    composed graph is something `composeAtlas` does not notice.
 *  - THE THREE EDGES OUT, which cross two area boundaries. `rank-nullity` and
 *    `eigenvalues` are nodes here and `field-extensions` is a node of
 *    `abstract-algebra`; all three declare the concept in their own `needs`, so
 *    all three survive. The way this fails is not an error but a node quietly
 *    rooted with nothing above it.
 *  - THE GATE, WHICH SHRANK IN FIVE PLACES AND TURNED OVER AT CONSTANT SIZE IN
 *    FOUR MORE. `gatingPrerequisitesOf` names NEAREST teachable ancestors, so
 *    while this node had no material the walk passed through it and reported
 *    the two concepts behind it. It now stops here. Neither a `length` check
 *    nor a direction-of-change check distinguishes the four that stayed the
 *    same size from nothing having happened, so both halves are asserted by
 *    MEMBERSHIP and the lists are in the message.
 *  - THE ARMATURE ANCHOR, which is the fifth file a promotion can touch and the
 *    only one outside lib/concepts. Krull anchored on this node, an anchor must
 *    be a node of its region's `area`, and `armatureProblems` runs above — so
 *    the refill is asserted by NAME here as well, because a region silently
 *    re-anchored on something arbitrary would pass that check.
 *  - THE SCOPE PATTERN, WHICH WAS FIXED RATHER THAN CARRIED. See the title
 *    table rows for `basis-and-dimension`: the map node's pattern matched only
 *    one of its own three alternatives, and that one belonged to a sibling.
 */
group('the twenty-second promotion, and the third out of linear algebra')
t('the dimension is a concept of the vectors subject, not a node of this area',
  !LINALG.nodes.some(n => n.id === 'basis-and-dimension')
  && areaOf(MATHEMATICS, 'basis-and-dimension') === 'vectors-and-independence'
  && isTeachable(MATHEMATICS, 'basis-and-dimension')
  && isPractisable(MATHEMATICS, 'basis-and-dimension'),
  `${areaOf(MATHEMATICS, 'basis-and-dimension')}, `
  + `node here: ${LINALG.nodes.some(n => n.id === 'basis-and-dimension')}`)
t('both stranded needs are ontology edges, so this area owes no links entry for either',
  ['vector-spaces', 'linear-independence'].every(from =>
    MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
      && e.from === from && e.to === 'basis-and-dimension').length === 1
    && MATHEMATICS.edges.find(e =>
      e.from === from && e.to === 'basis-and-dimension')
      ?.promotedBy === 'author:vectors-and-independence'
    && areaOf(MATHEMATICS, from) === 'vectors-and-independence'),
  MATHEMATICS.edges.filter(e => e.to === 'basis-and-dimension')
    .map(e => `${e.from}@${areaOf(MATHEMATICS, e.from)}:${e.promotedBy}`).join(' '))
t('and no links entry of any area names it, so nothing was handed back or dropped',
  AREAS.flatMap(a => (a.links ?? []).map(l => `${a.id}:${l.from}->${l.to}`))
    .filter(s => s.includes('basis-and-dimension')).length === 0,
  AREAS.flatMap(a => (a.links ?? []).map(l => `${a.id}:${l.from}->${l.to}`))
    .filter(s => s.includes('basis-and-dimension')).join(' ') || 'none, as it should be')
/*
 * The three edges out, with the areas they are declared in named. Two of the
 * three are in this area and the third is two files away, which is the claim a
 * check scoped to `LINALG` would miss entirely.
 */
t('the three edges declared at the far ends survive, once each, across two areas',
  [['rank-nullity', 'atlas:linear-algebra'],
    ['eigenvalues', 'atlas:linear-algebra'],
    ['field-extensions', 'atlas:abstract-algebra']].every(([id, stamp]) =>
    MATHEMATICS.edges.filter(e => e.kind === 'prerequisite'
      && e.from === 'basis-and-dimension' && e.to === id).length === 1
    && MATHEMATICS.edges.find(e =>
      e.from === 'basis-and-dimension' && e.to === id)?.promotedBy === stamp),
  MATHEMATICS.edges.filter(e =>
    e.kind === 'prerequisite' && e.from === 'basis-and-dimension')
    .map(e => `${e.to}:${e.promotedBy}`).join(' '))
/*
 * THE GATE SHRANK, which is the direction a count gets backwards. `rank-nullity`
 * went from {vector-spaces, linear-independence, gaussian-elimination} to
 * {basis-and-dimension, gaussian-elimination}: three entries replaced by two,
 * because the promoted concept HIDES both of the ancestors it used to be walked
 * through to. `eigenvalues` and `diagonalisation` lost one entry the same way.
 */
t('the gate tightened onto the dimension and five lists got shorter',
  ['rank-nullity', 'eigenvalues', 'diagonalisation', 'field-extensions', 'least-squares']
    .every(id => gatingPrerequisitesOf(MATHEMATICS, id).includes('basis-and-dimension'))
  && !gatingPrerequisitesOf(MATHEMATICS, 'rank-nullity').includes('linear-independence')
  && !gatingPrerequisitesOf(MATHEMATICS, 'eigenvalues').includes('linear-independence')
  && gatingPrerequisitesOf(MATHEMATICS, 'rank-nullity').slice().sort().join(' ')
    === 'basis-and-dimension gaussian-elimination',
  ['rank-nullity', 'eigenvalues', 'diagonalisation']
    .map(id => `${id}: ${gatingPrerequisitesOf(MATHEMATICS, id).join('/')}`).join(' | '))
/*
 * AND IT TURNED OVER AT CONSTANT SIZE IN FOUR PLACES, which is the half neither
 * a `length` check nor a direction-of-change check can see. For the four nodes
 * that reach the axioms through `inner-product-spaces` as WELL as through this
 * concept, `vector-spaces` stays named — so the list keeps its length while
 * `linear-independence` is replaced by `basis-and-dimension`. A suite that
 * asserted "the gate got shorter" over all nine would read these four as
 * nothing having happened.
 */
const SAME_SIZE_TURNOVER = [
  'spectral-theorem', 'least-squares', 'numerical-linear-algebra',
  'singular-value-decomposition',
]
t('and in four more it turned over without changing size, which no count would show',
  SAME_SIZE_TURNOVER.every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).includes('basis-and-dimension')
    && !gatingPrerequisitesOf(MATHEMATICS, id).includes('linear-independence')
    && gatingPrerequisitesOf(MATHEMATICS, id).includes('vector-spaces')),
  SAME_SIZE_TURNOVER
    .map(id => `${id}: ${gatingPrerequisitesOf(MATHEMATICS, id).length} entries, `
      + `${gatingPrerequisitesOf(MATHEMATICS, id).join('/')}`).join(' | '))
t('and every gate it names is teachable, so each is somewhere to go',
  ['rank-nullity', 'eigenvalues', 'diagonalisation', ...SAME_SIZE_TURNOVER].every(id =>
    gatingPrerequisitesOf(MATHEMATICS, id).every(p => isTeachable(MATHEMATICS, p))))
/*
 * The two stranding absences, looked for on the node before it was deleted
 * rather than inferred from a green suite — the third promotion running to
 * record them. A `confusedWith` becomes an `interferes_with`, which constrains
 * SELECTION and gates nothing, so losing one is invisible to every suite here.
 */
t('no interference and no credit edge into it were lost, the node having declared neither',
  !MATHEMATICS.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'basis-and-dimension' || e.to === 'basis-and-dimension'))
  && !MATHEMATICS.edges.some(e => e.kind === 'encompasses'
    && e.to === 'basis-and-dimension'),
  MATHEMATICS.edges.filter(e =>
    (e.from === 'basis-and-dimension' || e.to === 'basis-and-dimension')
    && e.kind !== 'prerequisite')
    .map(e => `${e.from}~${e.kind}~${e.to}`).join(' ') || 'neither, as the node declared')
/*
 * THE ARMATURE ANCHOR, BY NAME, AND IT HAS NOW TURNED OVER TWICE FOR THE SAME
 * REASON. Krull anchored on `vector-spaces` until the twentieth promotion and
 * on `basis-and-dimension` until this one. `armatureProblems` above already
 * refuses an anchor that is not a node of its region's area, so what is left to
 * check is that the refill was CHOSEN rather than whatever happened to be next
 * in the array — and that the region did not quietly drop to two anchors, which
 * nothing else would notice.
 */
const KRULL = regionBy('krull')
t('the region that lost its anchor was refilled by name, for the second promotion running',
  KRULL?.anchors?.join(' ') === 'rank-nullity eigenvalues diagonalisation'
  && KRULL.anchors.every(id => LINALG.nodes.some(n => n.id === id))
  && KRULL.authored?.includes('vectors-and-independence'),
  `${KRULL?.anchors?.join(', ')} | authored ${KRULL?.authored?.join(', ')}`)

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
  /*
   * `algebra-foundations` HAD A ROW HERE AND NO LONGER DOES, which is the table
   * being cashed in for the sixth time rather than corrected. The row is
   * DELETED rather than emptied, following the `trigonometry` precedent below:
   * an area with no row owes nothing on either unfinished route, and `[]` would
   * read as a row somebody had not got round to filling in.
   *
   * It held three entries over its life — `ratio-and-rate`, `linear-equations`
   * and `systems-of-linear-equations` — and the budget moved as predicted all
   * three times, the area losing one node and one owed concept each time, so
   * its slack never shifted off seven. That is the identity the geometry row
   * below spells out: a route concept being written takes one off each side of
   * a difference.
   *
   * THE LAST TWO REMOVALS WERE BOTH THINGS THIS COMMENT HAD ARGUED COULD NEVER
   * HAPPEN, and that is the part worth keeping. What stood here said the row
   * was blocked on a missing TaskKind — "solve for x" asks for the SET of
   * numbers satisfying a condition, no `NamedForm` and no `evaluate` target
   * expresses a solution set, so the tasks would have to be
   * substitute-and-check. The premises were true; the conclusion did not
   * follow. types.ts names the counterexample for the one-equation case:
   * `solve-exponential-1` is a shipped solve-for-x task of kind `evaluate`,
   * whose `given` carries the expression the METHOD leaves x equal to, with
   * the equation in the prompt.
   *
   * This comment then went on to insist that `systems-of-linear-equations`
   * "DOES NOT INHERIT THE UNBLOCKING" — that a system resolves to a point, a
   * line, or nothing, and the solution-set limit therefore binds it "directly
   * and in its own right". It was right to refuse the inheritance and wrong
   * about the conclusion anyway. A point is not a value and IS two values, so
   * it costs two `evaluate` tasks; and the two other outcomes are told apart by
   * the number the elimination leaves when both letters cancel, which is 0 for
   * a repeated equation and non-zero for a contradiction. The concession the
   * refusal was built on survives intact: no task in that concept asks how many
   * solutions a system has. ontology-algebra.ts argues all of it and reproduces
   * both refusals rather than deleting them.
   *
   * THE LESSON THE TABLE ITSELF TEACHES, now that this row has gone: the
   * obstacle it was built to measure — the stub floor — never once decided what
   * got written next out of this area. Three concepts left it, each with
   * headroom to spare, and what actually blocked them in turn was dependency
   * depth and then a written argument. The geometry row below reaches the same
   * conclusion from its own five removals. A guard rail is worth asserting; it
   * is not necessarily worth planning around.
   */
  /*
   * `area-and-perimeter` was the seventh entry here, `geometric-proof` the
   * first, `circles` the first of what was left and `circle-measure` the next;
   * all four are authored now, so all four have been removed — which is the
   * table being cashed in rather than corrected. The first assertion in each
   * pair requires every id named to be an unwritten NODE of its area, so
   * leaving any of them in would have failed loudly, exactly as the comment
   * above says it should. The budget moved as predicted all four times: the
   * area is four nodes smaller and owes four concepts fewer, so the slack is
   * unchanged at five.
   *
   * THE THIRD REMOVAL IS THE ONE THAT CHANGED WHAT THE NUMBER MEANS, and that
   * is worth keeping here because this table is where anybody will come looking
   * for the next candidate.
   *
   * The slack has been five through five promotions, which makes it look like
   * the quantity to watch. It is not; it is an identity. A route concept being
   * written takes one off the node count and one off the owed count, and the
   * slack is the difference, so it CANNOT move on a promotion out of this row.
   *
   * THE FIFTH REMOVAL IS `dot-product-geometry`, and it is the one that was not
   * this area's to make. That node waited on `right-triangle-trig` in
   * `trigonometry` — a cross-area block, which only a promotion somewhere else
   * could ever clear — and once the ratios were written it became the one
   * writable candidate here that also unblocked something. It is a concept of
   * `vectors-and-independence` now, in ontology-vectors.ts, which is the first
   * time a departure from this area has landed in a subject other than
   * `plane-geometry`.
   *
   * What is left is a chain of two, and the lower link carries a question that
   * is not about effort: `solid-geometry` is writable — `circle-measure` is
   * authored — but `plane-geometry`'s id and `covers` both exclude the solids
   * by name, so it needs either a widened subject or a tenth ontology before
   * anybody writes a worked example for it. `three-dimensional-coordinates`
   * needs it, and now needs nothing else: the dot product half of its gate is
   * written.
   *
   * So the constraint this table was built to measure has stopped binding.
   * Authoring is rate-limited by dependency depth and by where a concept is
   * allowed to be FILED — and no amount of headroom changes either. The floor
   * assertion below is still worth keeping, because it is what proves the merges
   * did not merely postpone the problem; it has simply stopped being the thing
   * that decides what gets written next.
   *
   * THE SIXTH REMOVAL IS `solid-geometry`, AND IT ANSWERED THE FILING QUESTION
   * ABOVE RATHER THAN DEFERRING IT AGAIN. The answer was a tenth ontology,
   * `solid-measure`, because `plane-geometry` had already declined the node in
   * writing: its `covers` closed with "The solids are the rest and are still
   * mapped only", which is a subject naming the material it excludes. So the
   * choice was never between two live options. The budget moved as predicted
   * for a sixth time — eleven nodes against one owed, slack still five.
   *
   * WHAT THIS ROW NOW SAYS IS THAT THE DEPTH HAS RUN OUT TOO, which is the part
   * worth reading before looking for the next candidate. One id is left, it is
   * writable today, and nothing unwritten stands anywhere beneath it — asserted
   * in the root-set group above, over the whole prerequisite closure rather than
   * over its two edges. It carries a filing question of its own and
   * atlas-foundations.ts states it: the node is analytic, so
   * `vectors-and-independence` is the likely home and `solid-measure` would have
   * to be renamed to take it.
   *
   * `euclidean-geometry` HAD A ROW HERE AND NO LONGER DOES, which is the table
   * being cashed in for the sixth time rather than corrected, and it is the
   * sentence above being answered rather than deferred again.
   *
   * Its one entry was `three-dimensional-coordinates`, and that concept is
   * authored — of `vectors-and-independence` in ontology-vectors.ts, the home
   * the paragraph above named, chosen because `solid-measure` is named for the
   * measure of a solid and would have had to be renamed while that subject
   * already owned the plane and the dot product. The first assertion in each
   * pair requires every id named to be an unwritten NODE of its area, so
   * leaving the row in would have failed loudly with the id printed, exactly as
   * the comment at the top of this table says it should. Deleting the row
   * rather than emptying it is deliberate, for the reason the trigonometry note
   * below gives: an area with no row owes nothing on either route, and `[]`
   * would read as a row somebody had not got round to filling in.
   *
   * The budget did NOT move as predicted, and that is the one thing worth
   * reading here. The slack identity this table has restated six times — a
   * route concept being written takes one off the node count and one off the
   * owed count, so the difference cannot move — held for the last time at the
   * twelfth. This promotion took the owed count to ZERO, and a difference
   * against zero is not a slack any more; it is just the node count. So the
   * sequence of fives ends here rather than continuing, and it ends because the
   * quantity it measured has run out rather than because it changed.
   */
  /*
   * `trigonometry` HAD A ROW HERE AND NO LONGER DOES, which is the table being
   * cashed in for the fifth time rather than corrected.
   *
   * Its one entry was `right-triangle-trig`, and that concept is authored —
   * `triangle-trigonometry` in ontology-trigonometry.ts, the ninth subject. The
   * first assertion in each pair requires every id named to be an unwritten
   * NODE of its area, so leaving the row in would have failed loudly with the
   * id printed, exactly as the comment above says it should. Deleting the row
   * rather than emptying it is deliberate: an area with no row is an area that
   * owes nothing on either unfinished route, and `[]` would read as a row
   * somebody had not got round to filling in.
   *
   * The budget moved as predicted. The area is one node smaller — twelve
   * against a floor of five — and owes one concept fewer, so its slack is
   * unchanged at seven. The headroom was never what blocked it; the promotion
   * was waiting on nothing but somebody writing it.
   */
  /*
   * `linear-algebra` HELD THE LAST ROW IN THIS TABLE AND NO LONGER DOES, which
   * is the table being cashed in for the seventh time and the last — the thing
   * it measured has run out rather than moved.
   *
   * Its one entry was `gaussian-elimination`, and that concept is authored: of
   * `expressions-and-equations` in ontology-algebra.ts rather than of the
   * matrices subject ontology-matrices.ts had reserved it for, because with no
   * matrix type in the engine the material is three equations and because an
   * area's `links` carries `prerequisite` edges only, so its credit edge to
   * `systems-of-linear-equations` could exist nowhere but inside one ontology.
   * The row is DELETED rather than emptied, following every precedent above: an
   * area with no row owes nothing on any route, and `[]` would read as a row
   * somebody had not got round to filling in.
   *
   * The budget moved as predicted. The area is one node smaller — ten against a
   * floor of five — and owes one concept fewer, so its slack is unchanged at
   * five. The headroom was never what blocked it.
   */
}
/*
 * THE TABLE IS EMPTY, AND THAT IS A STATE WORTH ASSERTING RATHER THAN A GROUP
 * WORTH DELETING.
 *
 * Every concept on every journey's route is written. The loop below iterates
 * nothing now, so the group would pass vacuously and say nothing — which is
 * exactly the failure mode this suite keeps catching elsewhere — so the
 * emptiness is asserted directly, and the claim it stands for is checked from
 * the journeys' own side in tests/journeys.mjs, which is the harness that
 * builds journeys.ts. Both halves are needed: an empty table here with a route
 * still owing something there is a table somebody cleared without authoring.
 *
 * THE REFUSAL THIS COMMENT USED TO CARRY IS WHY THE RECOMPUTATION MATTERS. It
 * said `gaussian-elimination` was stopped by neither the floor nor depth but by
 * the fact that "solve for x" asks for a solution SET and no `NamedForm` and no
 * `evaluate` target expresses one, and that this was "a decision about what
 * counts as evidence rather than an authoring job". The first half is still
 * true. The inference was not, for the fourth time in this build:
 * `evaluate` cannot take a set AS AN ANSWER, and it rules the NUMBER THAT
 * DECIDES one perfectly. A 3×3 solve is a TRIPLE, so it costs three tasks the
 * way a point cost two; an emptied row leaves 0 = 3 or 0 = 0, and three and
 * nought are values. See ontology-algebra.ts, which had already withdrawn the
 * same inference twice and wrote down the pattern for doing it a third time.
 *
 * So the thing to assert is not a new refusal. It is that nothing is owed, and
 * that the figure is derived from the journeys rather than typed — because a
 * typed table is what rotted, and a typed REFUSAL is what cost three runs.
 */
t('the table owes nothing, and the concept that held its last row is written',
  Object.keys(ROUTE_STILL_UNWRITTEN).length === 0
  && isTeachable(MATHEMATICS, 'gaussian-elimination'),
  `${Object.keys(ROUTE_STILL_UNWRITTEN).length} row(s) left`)
/*
 * And the floor, from the other side. The claim this group was founded to make
 * — "the floor will STILL pass once every concept the unfinished journeys need
 * has been written" — is now a statement about the present rather than a
 * prediction, so it is checked as one: every area clears the floor, with
 * nothing owed. That is the deadlock being gone rather than postponed.
 */
t('and every area clears the floor with nothing left owed, which is what this group predicted',
  AREAS.every(a => a.nodes.length >= STUB_FLOOR),
  AREAS.filter(a => a.nodes.length < STUB_FLOOR).map(a => `${a.id}:${a.nodes.length}`)
    .join(' ') || `smallest area has ${Math.min(...AREAS.map(a => a.nodes.length))} nodes`)
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
 * THREE OF THE FIVE HAVE SINCE BEEN WRITTEN, which is the outcome this group
 * was waiting for and not a failure of it. `real-number-line` and
 * `ratio-and-rate` are authored concepts of `arithmetic-foundations` now and
 * `circle-measure` is one of `plane-geometry`, so none is in any area and the
 * headroom question stops applying to them — all three are asserted in the
 * groups above instead, as promotions that happened. Splitting the list in two
 * rather than dropping the ids is deliberate: "it was blocked and is now
 * written" and "it was blocked and is now merely unblocked" are different
 * claims, and collapsing them would lose the only record that the merge has
 * been cashed in rather than only argued for.
 *
 * `circle-measure` is the one that cashes it in hardest, and the reason is in
 * this list's own history. It was named here as blocked by a floor in an area
 * that had room — the chain behind `circles` ran through it — so it is the
 * first of the five whose unblocking required the merge AND two promotions on
 * top of it. The remaining two in the list below both sit behind it.
 *
 * `ratio-and-rate` is the one that closes the ARGUMENT rather than the chain.
 * It and `real-number-line` are the pair ontology-geometry.ts passed over three
 * promotions running while recording them as the area-floor casualties, and
 * they were the two the `NUMBER_AND_ARITHMETIC` merge was argued for by name.
 * Both are written now, so that merge is fully spent rather than half — which
 * is the strongest form the evidence for it can take, and the thing this group
 * was built to be able to say.
 *
 * FOUR OF THE FIVE NOW, `solid-geometry` HAVING BEEN WRITTEN — and it is the
 * one that closes the argument for the OTHER merge. `coordinate-geometry` was
 * absorbed because `three-dimensional-coordinates` was blocked transitively by
 * a floor in an area that was not its own, and the chain in between ran
 * `circle-measure → solid-geometry → three-dimensional-coordinates`. Two of
 * those three are written and the last is writable, so that merge is spent down
 * to its final node as well. The list below is one id long, and it emptying
 * would mean every concept the two merges unblocked had been authored.
 *
 * ALL FIVE NOW, AND THE LIST OF THE STILL-BLOCKED IS DELETED RATHER THAN
 * EMPTIED — which is the sentence above coming true, and the one bookkeeping
 * decision in it worth explaining.
 *
 * `three-dimensional-coordinates` was the fifth and last, written by the
 * thirteenth promotion into `vectors-and-independence`. So both merges are
 * fully spent: every concept either of them was argued for has material, and
 * that is the strongest form the evidence for them can take.
 *
 * The `WAS_BLOCKED` list is GONE instead of `[]`, and an empty list would have
 * been worse than useless here. Its assertion was `WAS_BLOCKED.every(...)`, and
 * `every` on an empty array is true — so emptying the list would have left a
 * check that passes unconditionally while reading as though it still guarded
 * the headroom of an area. That is the vacuity trap this file dissects twice
 * elsewhere, arriving by a third route: not an optional-chained lookup on a
 * departed node, but a quantifier over a drained list. A list that has reached
 * zero should be deleted along with what quantifies over it.
 *
 * What replaces it is the positive claim, with the five named and their
 * subjects named, because "all five are written" is a count and the useful
 * statement is WHERE they went — four subjects for five concepts, which is the
 * thing a count hides and the reason neither merge can be credited to one
 * syllabus.
 */
const WAS_BLOCKED_NOW_WRITTEN = [
  'real-number-line', 'circle-measure', 'ratio-and-rate', 'solid-geometry',
  'three-dimensional-coordinates',
]
t('all five previously blocked concepts are authored now, and out of every area',
  WAS_BLOCKED_NOW_WRITTEN.length === 5
  && WAS_BLOCKED_NOW_WRITTEN.every(id =>
    isTeachable(MATHEMATICS, id)
    && isPractisable(MATHEMATICS, id)
    && !AREAS.some(a => a.nodes.some(n => n.id === id))),
  WAS_BLOCKED_NOW_WRITTEN.map(id =>
    `${id}:${isTeachable(MATHEMATICS, id) ? 'written' : 'UNWRITTEN'}@`
    + `${AREAS.find(a => a.nodes.some(n => n.id === id))?.id ?? 'no area'}`).join(' '))
t('and the five landed in four different subjects, which is the thing a count of them would hide',
  WAS_BLOCKED_NOW_WRITTEN.map(id => areaOf(MATHEMATICS, id)).slice().sort().join(' ')
    === 'arithmetic-foundations arithmetic-foundations plane-geometry solid-measure '
      + 'vectors-and-independence',
  WAS_BLOCKED_NOW_WRITTEN.map(id => `${id}@${areaOf(MATHEMATICS, id)}`).join(' '))
/*
 * And the other thing "blocked" meant. A concept whose prerequisites are all
 * authored is mechanically ready to write, and the floor was the ONLY thing
 * stopping these two — ontology-geometry.ts says so three promotions running.
 * So they had to be ready once the merge landed, or the merge did not do what
 * it was for.
 *
 * BOTH HAVE NOW GONE PAST READY INTO WRITTEN, so the "still only ready" half of
 * this pair has nothing left to describe and the assertion is restated rather
 * than kept. `ratio-and-rate` used to be checked here for having every
 * prerequisite authored — which stays TRUE of a written concept, so leaving it
 * would have been a check that passes while measuring nothing, the exact
 * vacuity this group's own comment warns a bare `length` would produce.
 *
 * What replaces it is the stronger claim the promotion makes available, and it
 * is asserted over both of them at once: each is teachable, each still rests
 * only on authored concepts, and each is now a prerequisite of something else
 * — so it gates rather than being gated. That is what "the merge was cashed in"
 * reduces to as a testable statement.
 */
const READY_THEN_WRITTEN = ['real-number-line', 'ratio-and-rate']
t('both area-floor casualties went past ready into written, so each gates rather than being gated',
  READY_THEN_WRITTEN.every(id =>
    isTeachable(MATHEMATICS, id)
    && prerequisitesOf(MATHEMATICS, id).length > 0
    && prerequisitesOf(MATHEMATICS, id).every(p => isTeachable(MATHEMATICS, p))
    && dependentsOf(MATHEMATICS, id).length > 0),
  READY_THEN_WRITTEN.map(id =>
    `[${prerequisitesOf(MATHEMATICS, id).join(' ')}] → ${id} → `
    + `[${dependentsOf(MATHEMATICS, id).join(' ')}]`).join(' | '))
t('and the ratio gates across a subject boundary, which is the half a links entry carries',
  gatingPrerequisitesOf(MATHEMATICS, 'similarity').includes('ratio-and-rate')
  && areaOf(MATHEMATICS, 'ratio-and-rate') === 'arithmetic-foundations'
  && areaOf(MATHEMATICS, 'similarity') === 'plane-geometry',
  `${areaOf(MATHEMATICS, 'ratio-and-rate')} gates ${areaOf(MATHEMATICS, 'similarity')}`)

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
  // The article sigma notation is filed under. The pattern is `summation` and
  // not `sum`, which is what keeps the three over-broad rows below off it —
  // and this row with "Riemann sum" is the pair that pins the width from both
  // sides, since a pattern narrowed to nothing would satisfy those rows too.
  ['Summation', 'sigma-notation'],
  ['Riemann sum', 'riemann-sums'],
  /*
   * A PARENTHESISED DISAMBIGUATION, WHICH IS THE TRAP THE INFLECTED ROWS ABOVE
   * HAVE FROM THE OTHER SIDE.
   *
   * The map node these two titles came from was written
   * `/\b(basis \(linear algebra\)|...|linear independence)\b/i`, and it matched
   * only the last alternative. The group's trailing `\b` sits after a closing
   * parenthesis, and `\b` is a boundary between a word character and a non-word
   * one — so for an alternative ending in `)` it can only match when the NEXT
   * character is a word character, which at the end of a title there is not.
   * Both of the node's own titles were therefore unrecognised for as long as it
   * was on the map, and nothing said so: `fidelityMismatches` only asks whether
   * a checked concept HAS a pattern.
   *
   * So these rows are the pair that pins the fix, and the "Linear
   * independence" row below is the other half — the alternative that was doing
   * all the work belonged to a sibling concept of the same subject.
   */
  ['Basis (linear algebra)', 'basis-and-dimension'],
  ['Dimension (vector space)', 'basis-and-dimension'],
  ['Change of basis', 'basis-and-dimension'],
  ['Linear independence', 'linear-independence'],
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
  /*
   * `sigma-notation`'s pattern is `summation` rather than `sum`, and these
   * three are what the shorter word would have cost: a Riemann sum, an
   * infinite geometric total and the angle sum are three other nodes'
   * articles. A pattern narrowed into uselessness would pass all three rows
   * by matching nothing, which is why "Summation" is in the table above and
   * "Riemann sum" is too — the pair is what pins the width from both sides.
   */
  ['Riemann sum', ['sigma-notation']],
  ['Sum to infinity', ['sigma-notation']],
  ['Sum of angles of a triangle', ['sigma-notation']],
  /*
   * The alternative the twenty-second promotion DROPPED, and the two bare words
   * it declined to add in its place.
   *
   * `basis-and-dimension` inherited `linear independence` from its map node,
   * where it had been written while that concept was unwritten and the node was
   * standing in for it. `linear-independence` is authored in the same subject
   * now, so the article belongs to the concept whose material is about it — and
   * the row above checks that it lands there while this one checks it does not
   * ALSO land here, which is the half that would have gone unnoticed.
   *
   * The other two are what a pattern on the bare words would have cost.
   * Orthonormality is `inner-product-spaces`, still a mapped node of linear
   * algebra, and a fractal dimension is not this count at all.
   */
  ['Linear independence', ['basis-and-dimension']],
  ['Orthonormal basis', ['basis-and-dimension']],
  ['Hausdorff dimension', ['basis-and-dimension']],
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

group('probe mode — the same answer-blindness guarantee, against a different answer')

/*
 * A probe's answer is not a step's `establishes`, it is the EDGE's `rationale`.
 * "Cancelling is legal across a product and illegal across a sum" IS the
 * discriminating sentence for that interference, and a model holding it writes
 * it into the question — so `ProbeContext` must be incapable of carrying one,
 * exactly as `SocraticContext` is incapable of carrying `establishes`.
 *
 * Checked over every probe against every rationale in the graph rather than
 * against the matching edge's own, because the failure worth catching is a
 * context that picked up authored prose from anywhere.
 */
const ALL_PROBES = probesAcross(MATHEMATICS, MATHEMATICS.concepts.map(c => c.id))
const ALL_RATIONALES = MATHEMATICS.edges.map(e => e.rationale).filter(Boolean)

t('there are probes to ask at all, or the mode is decoration',
  ALL_PROBES.length > 50, `${ALL_PROBES.length}`)
t('all three kinds are represented',
  new Set(ALL_PROBES.map(p => p.kind)).size === 3,
  [...new Set(ALL_PROBES.map(p => p.kind))].join(', '))
t('probeContext never contains any edge rationale',
  ALL_PROBES.every(p => {
    const ctx = probeContext(MATHEMATICS, p)
    if (!ctx) return false
    const blob = JSON.stringify(ctx)
    return ALL_RATIONALES.every(r => !blob.includes(r))
  }))
t('and carries no field by that name, however it got there',
  ALL_PROBES.every(p => {
    const ctx = probeContext(MATHEMATICS, p)
    return !('rationale' in ctx) && !('because' in ctx)
  }))
t('every probe names two different concepts',
  ALL_PROBES.every(p => p.anchorId !== p.otherId))
t('both ends are teachable, so neither side of the question is an empty shell',
  ALL_PROBES.every(p => isTeachable(MATHEMATICS, p.anchorId)
    && isTeachable(MATHEMATICS, p.otherId)))
t('an unknown concept yields nothing rather than throwing',
  probesFor(MATHEMATICS, 'no-such-concept').length === 0)
t('probeContext refuses a target naming an unknown concept',
  probeContext(MATHEMATICS, { kind: 'boundary', anchorId: 'no-such', otherId: 'nor-this' }) === null)
t('probesAcross deduplicates, so one edge is not asked twice in a round',
  new Set(ALL_PROBES.map(p => `${p.kind}:${p.anchorId}:${p.otherId}`)).size === ALL_PROBES.length)

/*
 * The prompt's discipline, as string checks — which is the right shape here.
 * The guarantee is that these specific sentences reach the model, so a reworded
 * prompt that drops one is precisely the regression worth failing on.
 */
const PROBE_SAMPLE = probePrompt(probeContext(MATHEMATICS, ALL_PROBES[0]), 'algebra')
t('the probe prompt forbids answering its own question',
  PROBE_SAMPLE.system.includes('do not answer it'))
t('it forbids marking, since a probe records nothing either',
  PROBE_SAMPLE.system.includes('Never say or imply whether the learner is right'))
t('it tells the model the discriminating sentence was withheld on purpose',
  PROBE_SAMPLE.system.includes('withheld from you'))
t('it forbids multiple choice, which would contain the answer',
  PROBE_SAMPLE.system.includes('multiple-choice'))
t('it steers at the mathematics rather than at this app\'s curriculum',
  PROBE_SAMPLE.system.includes('never about this app'))
t('it says plainly that this is NOT a derivation walk',
  PROBE_SAMPLE.system.includes('NOT walking them through a derivation'))
t('each kind gets its own instruction rather than one generic one',
  new Set(['boundary', 'generalisation', 'necessity'].map(k => {
    const p = ALL_PROBES.find(x => x.kind === k)
    return probePrompt(probeContext(MATHEMATICS, p)).system
  })).size === 3)

/*
 * The reply turn is the other place a rationale could reach the model, and the
 * likelier one: it carries the learner's words and the question already asked,
 * so it has two extra strings in it that the first turn does not.
 */
const NUDGE_CTX = probeContext(MATHEMATICS, ALL_PROBES[0])
const NUDGE_ANSWERED = probeNudgePrompt(NUDGE_CTX, 'What decides it?', 'I think you cancel.')
const NUDGE_STUCK = probeNudgePrompt(NUDGE_CTX, 'What decides it?', '')

t('the nudge prompt leaks no rationale either',
  ALL_PROBES.every(p => {
    const ctx = probeContext(MATHEMATICS, p)
    const blob = JSON.stringify(probeNudgePrompt(ctx, 'asked?', 'said'))
    return ALL_RATIONALES.every(r => !blob.includes(r))
  }))
t('it carries what was asked, so the follow-up pushes the same boundary',
  NUDGE_ANSWERED.user.includes('What decides it?'))
t('it carries the learner\'s own words',
  NUDGE_ANSWERED.user.includes('I think you cancel'))
t('answered and stuck are different asks, not one with a blank in it',
  NUDGE_ANSWERED.system !== NUDGE_STUCK.system)
t('the stuck branch says so rather than sending an empty answer',
  NUDGE_STUCK.user.includes('LEARNER SAID NOTHING'))
t('the answered branch is told not to say they were right',
  NUDGE_ANSWERED.system.includes('do not tell them they were right'))
t('the stuck branch is told a smaller question is not a reworded one',
  NUDGE_STUCK.system.includes('a smaller question is a different question'))
t('both keep the floor that forbids marking',
  [NUDGE_ANSWERED, NUDGE_STUCK].every(p =>
    p.system.includes('Never say or imply whether the learner is right')))
t('a pasted scratchpad is capped rather than sent whole',
  probeNudgePrompt(NUDGE_CTX, 'asked?', 'x'.repeat(5000)).user.includes('x'.repeat(1200))
  && !probeNudgePrompt(NUDGE_CTX, 'asked?', 'x'.repeat(5000)).user.includes('x'.repeat(1201)))


// ---------------------------------------------------------------------------

group('the Armature')

/*
 * The region map is a DOCUMENT like the atlas it sits over, so it is checked
 * here rather than in concepts-logic.mjs. What these assertions can and cannot
 * do is the point: which area a region holds is EDITORIAL — whether Hasspab
 * should carry number theory or statistics is taste, and a test asserting it
 * would be asserting taste. So nothing below checks an assignment. They check
 * the structure that makes assignments safe to change, and the one thing the
 * game's copy of this table cannot check at all: that every id still resolves
 * against the live atlas.
 */
const conceptIdsByArea = new Map()
for (const c of MATHEMATICS.concepts) {
  if (!conceptIdsByArea.has(c.subjectId)) conceptIdsByArea.set(c.subjectId, new Set())
  conceptIdsByArea.get(c.subjectId).add(c.id)
}

const authoredSubjectIds = new Set(ONTOLOGIES.map(o => o.subject.id))
const armatureFaults = armatureProblems(conceptIdsByArea, authoredSubjectIds)
t('every region resolves against the live atlas', armatureFaults.length === 0,
  armatureFaults.slice(0, 6).join(' | '))

const placed = armatureRegions()
t('there are 21 spheres of influence', placed.length === 21, `${placed.length}`)
t('19 of them carry an area, 2 carry none',
  placed.filter(r => r.area).length === AREAS.length
  && placed.filter(r => !r.area).length === 2,
  `${placed.filter(r => r.area).length} with an area, ${AREAS.length} areas exist`)
t('the two that carry none say which role they play instead',
  placed.filter(r => !r.area).map(r => r.role).sort().join(',') === 'broker,frontier')
t('every area has a region, so none is unreachable on the map',
  AREAS.every(a => regionForArea(a.id) !== null),
  AREAS.filter(a => !regionForArea(a.id)).map(a => a.id).join(', '))

t('the journey runs inward to outward',
  placed.every((r, i) => i === 0 || placed[i - 1].km <= r.km))
t('regions at the same distance are neighbours, not prerequisites',
  inwardOf('kalvent').every(r => r.km < 5500)
  && !inwardOf('kalvent').some(r => r.id === 'kalkreath-mountains'))
t('the centre has nothing before it and the far isles have everything',
  inwardOf('ringed-mountains').length === 0
  && inwardOf('hemgrad-and-hemlith').length === placed.length - 1)
t('a region is found by id, name, epithet or sloppy typing',
  regionBy('gal garad')?.id === 'gal-garad'
  && regionBy('The Crucible of the Sun')?.id === 'gal-garad'
  && regionBy('Lumingrad') === null)

/*
 * Positions were read off a drawn map by eye, so they cannot be asserted to
 * the pixel — but the setting states a compass bearing for most regions,
 * measured from the continental centre, and that IS checkable. It catches the
 * failure that matters: a region pinned on the wrong side of the world.
 * Distance is deliberately not checked; the projection is an oval and the map
 * says distances are approximate, so any tolerance loose enough to pass the
 * far isles would miss a real error.
 */
const BEARINGS = {
  durvolk: 'e', tellgrad: 'e', 'ringed-mountains': 'e',
  taiga: 'ne', burdervruke: 'ne', krull: 'n', paravgrad: 'n', schalfrend: 'nw',
  'kalkreath-mountains': 'sw', kalvent: 'sw', 'nadda-zalan': 'sw',
  alun: 's', rubneb: 's', 'qing-men': 'se', 'hemgrad-and-hemlith': 'w',
}
const offBearing = Object.entries(BEARINGS).filter(([id, want]) => {
  const r = regionBy(id)
  if (!r) return true
  const dx = r.xy.x - ARMATURE_CENTER.x       // + is east
  const dy = r.xy.y - ARMATURE_CENTER.y       // + is south
  return (want.includes('n') && !(dy < 0)) || (want.includes('s') && !(dy > 0))
    || (want.includes('e') && !(dx > 0)) || (want.includes('w') && !(dx < 0))
})
t('every pin agrees with the bearing the setting states for it',
  offBearing.length === 0, offBearing.map(([id]) => id).join(', '))
t('the continental centre sits beside the two regions nearest to it',
  Math.hypot(regionBy('ringed-mountains').xy.x - ARMATURE_CENTER.x,
    regionBy('ringed-mountains').xy.y - ARMATURE_CENTER.y) < 0.2
  && Math.hypot(regionBy('hasspab').xy.x - ARMATURE_CENTER.x,
    regionBy('hasspab').xy.y - ARMATURE_CENTER.y) < 0.2)
t('no two regions share a pin',
  new Set(placed.map(r => `${r.xy.x},${r.xy.y}`)).size === placed.length)
t('every pin is on the image',
  placed.every(r => r.xy.x > 0 && r.xy.x < 1 && r.xy.y > 0 && r.xy.y < 1))

/*
 * Coverage is read from the real atlasCoverage, which is the whole reason this
 * table lives here as well as in the game. The assertion is a floor rather
 * than a figure: the written share moves every time somebody authors a
 * concept, and a test pinned to today's number would fail on success.
 */
const armatureCov = regionCoverage(atlasCoverage(MATHEMATICS))
t('coverage is reported for all 21, including the two with none',
  armatureCov.length === 21 && armatureCov.filter(c => c.concepts === 0).length === 2)
t('a region counts its mapped area AND the authored subjects it holds',
  armatureCov.filter(c => c.region.area).every(c =>
    c.concepts === [c.region.area, ...c.authored]
      .reduce((n, id) => n + (conceptIdsByArea.get(id)?.size ?? 0), 0)))
t('every authored subject is on the map exactly once',
  armatureRegions().flatMap(r => r.authored ?? []).length === authoredSubjectIds.size
  && new Set(armatureRegions().flatMap(r => r.authored ?? [])).size === authoredSubjectIds.size)
t('written never exceeds the concepts it is counted out of',
  armatureCov.every(c => c.written <= c.concepts))
t('at least one region has material written, or the map is a lie',
  armatureCov.some(c => c.written > 0))

/*
 * The journey — the traversal read as movement across the world.
 *
 * These guard the decision that makes the Armature a board rather than a
 * picture: /api/learn/traverse walks `composeAtlas([], ONTOLOGIES)` and not a
 * single subject. The first assertion is the one that would have caught the
 * original mistake, where the traversal was confined to RATIONAL_EXPRESSIONS
 * and therefore to Ringed Mountains alone — a journey that could never leave
 * one pin, which is not a journey.
 */
/*
 * The interface calls it "RPG mode"; the code calls it the Armature. That
 * split was a deliberate decision and it is the kind that drifts back — a new
 * surface reaches for the module name because that is what the import says,
 * and the product quietly grows a second name nobody chose.
 *
 * Source text rather than a render, because these are client components this
 * harness cannot load. Deliberately narrow: it asserts the invariant — no
 * user-facing string says Armature — rather than pinning every word of copy.
 */
/*
 * The two routes that share one journey must load it the same way.
 *
 * They did not, for a day. The traverse route adopted a pre-widening walk and
 * the session route did not, so a learner holding one was shown "you are
 * nowhere yet, choose where to make landfall" and then told "This traversal
 * has already started" when they clicked. Both halves typechecked, both passed
 * every test, and RPG mode was unplayable for precisely the people who had
 * used the feature before.
 *
 * Source text, because the thing to hold is which FUNCTION they call —
 * `loadJourney`, where the adoption lives, never `loadTraversal` underneath
 * it. There is no behaviour here to assert without a database.
 */
/* Three readers, not two. The librarian was the third and was found only by
   a reader noticing the chat talking nonsense about RPG mode -- it still read
   the per-subject key, so it reported no journey for everybody. */
const JOURNEY_ROUTES = [
  'app/api/learn/session/route.ts',
  'app/api/learn/traverse/route.ts',
  'lib/librarian/context.ts',
]
const journeySources = JOURNEY_ROUTES.map(p => ({ p, text: readFileSync(join(FRONTEND, p), 'utf8') }))

t('both journey routes load it through loadJourney',
  journeySources.every(s => /loadJourney\(userId\)/.test(s.text)),
  journeySources.filter(s => !/loadJourney\(userId\)/.test(s.text)).map(s => s.p).join(', '))

/* Calling loadTraversal directly is how the adoption gets skipped. The shared
   loader is the only caller that should name it.
   Comment lines are exempt — explaining what a file used to call is how the
   reason survives, and a guard that forbade naming the old function would
   force every one of these notes to be deleted. */
const rawLoaders = journeySources.filter(s => s.text.split('\n')
  .filter(line => !/^\s*(\*|\/\/|\/\*)/.test(line))
  .some(line => /\bloadTraversal\(/.test(line)))
t('neither route reaches past it to loadTraversal',
  rawLoaders.length === 0, rawLoaders.map(s => s.p).join(', '))

/* And the key is named once. Two literals are what drifted. */
const ownKeys = journeySources.filter(s => /=\s*'armature'/.test(s.text))
t('neither route keeps its own copy of the storage key',
  ownKeys.length === 0, ownKeys.map(s => s.p).join(', '))

const UI_FILES = ['app/learn/page.tsx', 'app/page.tsx', 'components/concepts/ArmatureMap.tsx']
const uiSources = UI_FILES.map(p => ({ p, text: readFileSync(join(FRONTEND, p), 'utf8') }))

t('the interface offers "RPG mode"',
  uiSources.some(s => s.text.includes("'RPG mode'")))

/* Comments and identifiers are where the code name BELONGS. A leak is the
   word in a line that is neither — a label, an alt, a title, JSX text. */
const nameLeaks = uiSources.flatMap(({ p, text }) => text.split('\n')
  .map((line, i) => ({ p, n: i + 1, line }))
  .filter(({ line }) => /Armature/.test(line))
  .filter(({ line }) => !/^\s*(\*|\/\/|\/\*)/.test(line))
  .filter(({ line }) => !/ArmatureMap|ARMATURE_|concepts.armature/.test(line)))
t('no user-facing string calls it the Armature',
  nameLeaks.length === 0, nameLeaks.map(l => `${l.p}:${l.n}`).join(', '))

/*
 * The game master, and the four things it may not do.
 *
 * RPG mode narrates with a language model, which is the one place on /learn
 * where a model is near a learner's progress. The guard is that it is a
 * NARRATOR and not a verifier: the traversal decides, and the GM is told. A
 * prompt that drifted into congratulating or teaching would be a learning
 * surface whose gate is a model's opinion, and the refusal in traversal.ts —
 * the one thing documented as never relaxing — would relax whenever the prose
 * came out warm.
 *
 * Asserted over the prompt text because that IS the mechanism. There is no
 * runtime check that a scene stayed in its lane; the instruction is the
 * whole of it, so the instruction is what has to be held.
 */
const GM_REGION = armatureRegions().find(r => r.id === 'hasspab')

t('the game master is told it does not decide the outcome',
  /not you/i.test(GM_SYSTEM) && /settled fact/i.test(GM_SYSTEM))
t('it is forbidden from claiming the player has learned anything',
  /learned, mastered, understood/i.test(GM_SYSTEM))
t('it is forbidden from teaching or posing mathematics',
  /Teach, define, explain, hint at, or pose any mathematics/i.test(GM_SYSTEM))
t('it is forbidden from inventing doors or regions',
  /Invent what lies through a door you were not told about/i.test(GM_SYSTEM))
t('it is told to write prose rather than markdown',
  /No markdown/i.test(GM_SYSTEM))

/*
 * A refusal must reach the model as a refusal. This is the outcome most at
 * risk of being narrated into its opposite — "the road is closed" is a less
 * pleasant scene to write than "you press on" — so the instruction says it
 * three ways and this checks all three survive.
 */
const BLOCKED = scenePrompt({
  kind: 'blocked', region: GM_REGION, missing: ['Long division', 'Place value'], visited: ['Krull'],
})
t('a closed road is stated as closed, and named',
  /CLOSED/.test(BLOCKED.user) && /Long division and Place value/.test(BLOCKED.user))
t('the model is told not to let them through or route around it',
  /Do not let them through/.test(BLOCKED.user) && /do not suggest a way around/.test(BLOCKED.user))

/*
 * The area is deliberately absent from the scene request: naming "number
 * theory" to a narrator is the surest way to get a scene about number theory,
 * which prohibition two forbids. The region's own character IS sent, because
 * it is what makes one city read differently from another.
 */
t('the scene request carries the place, not its mathematics',
  BLOCKED.user.includes(settingOf(GM_REGION.because))
  && !/number theory/i.test(BLOCKED.user)
  && !BLOCKED.user.includes(GM_REGION.area))

/*
 * `settingOf` takes the first sentence of `because` on the convention that it
 * is the setting and the rest is the argument for the assignment. That
 * convention is what keeps the area out of the GM's context, so it is checked
 * over every region rather than trusted — two of the nineteen DO name their
 * area in the full text (Hasspab and Taiga), which is how the leak was found.
 */
const settingLeaks = armatureRegions()
  .filter(r => r.areaName)
  .filter(r => settingOf(r.because).toLowerCase().includes(r.areaName.toLowerCase()))
t('no region\'s setting sentence names its own area',
  settingLeaks.length === 0, settingLeaks.map(r => r.name).join(', '))
t('and the trim is doing real work, not passing through',
  armatureRegions().some(r => settingOf(r.because).length < r.because.length))

t('every outcome produces a prompt and an unnarrated fallback',
  ['start', 'arrive', 'blocked', 'not-yours', 'spent'].every(kind => {
    const ctx = { kind, region: GM_REGION, missing: ['X'] }
    const p = scenePrompt(ctx)
    const bare = unnarratedScene(ctx)
    return p.user.includes('OUTCOME:') && typeof bare === 'string' && bare.length > 20
  }))
t('the unnarrated fallback names the place rather than apologising',
  unnarratedScene({ kind: 'arrive', region: GM_REGION }).includes(GM_REGION.name))

/*
 * The table: tags, dice and the two things they must never decide.
 *
 * The tier markers are the Armat Sur rulebook's and a player who has read it
 * must not find different dice on this side, so they are pinned rather than
 * merely implemented.
 */
t('the tier markers are the setting\'s own',
  SIDES['#'] === 1 && SIDES['~'] === 3 && SIDES[''] === 6 && SIDES['+'] === 10)

/* A flat tag draws no die at all, which is what `#` means. Injecting a draw
   that throws proves it rather than assuming it. */
const noDraw = () => { throw new Error('a flat tag must not draw') }
t('a flat tag adds one and rolls nothing',
  rollFor([{ name: 'certain', tier: '#' }], noDraw).total === 1)

t('opposition subtracts, and each die keeps its tag\'s place',
  (() => {
    const r = rollFor([
      { name: 'trained hand', tier: '' },
      { name: 'good tools', tier: '~' },
      { name: 'time pressure', tier: '+', against: true },
    ], sides => sides)   // every die rolls its maximum
    return r.dice === 'd6 + d3 - d10' && r.results.join(',') === '6,3,-10' && r.total === -1
  })())

/* The bands are the rulebook's "Everyday rolls", which are the aether bands.
   Checked at every boundary because an off-by-one here silently retunes the
   whole game. */
t('the outcome bands match the rulebook at every boundary',
  readBand(-3).band === 'fails' && readBand(0).band === 'fails'
  && readBand(1).band === 'barely' && readBand(3).band === 'barely'
  && readBand(4).band === 'works' && readBand(7).band === 'works'
  && readBand(8).band === 'better' && readBand(99).band === 'better')

/*
 * The roll grammar is the game's own roll_resolver grammar. It must accept
 * what that accepts and refuse what it refuses — a malformed expression is
 * dropped by the route rather than guessed at, so a parser that returned
 * something plausible for nonsense would put invented dice on the table.
 */
t('a well-formed expression parses to tags, tiers and signs',
  (() => {
    const p = parseRollExpression('(silver tongued) + (leverage~) - (audience hostility+)')
    return p?.length === 3 && p[0].tier === '' && p[1].tier === '~'
      && p[2].tier === '+' && p[2].against === true && p[0].against === false
  })())
/*
 * The unparenthesised form is accepted too, because it is what models
 * actually return. Found by playing a turn against a real model: asked for
 * `(silver tongued) - (hostility~)` it wrote `Place value + Surveyor - Guild
 * protocol~`, the strict parser refused it, and the consequence was that dice
 * never appeared at all.
 */
t('the form a model actually writes is accepted',
  (() => {
    const p = parseRollExpression('Place value + Surveyor - Guild protocol~')
    return p?.length === 3
      && p[0].name === 'Place value' && p[0].against === false
      && p[2].name === 'Guild protocol' && p[2].tier === '~' && p[2].against === true
  })())
t('a hyphenated tag name survives the split',
  parseRollExpression('well-read + obscurity~')?.length === 2)
t('nonsense is still refused rather than half-read',
  parseRollExpression('(a) (b)') === null
  && parseRollExpression('(a) + (b) junk') === null
  && parseRollExpression('') === null
  && parseRollExpression('   ') === null)

t('a roll request is lifted off the reply and the prose survives',
  (() => {
    const s = splitRollRequest('The guard folds his arms.\n\nROLL: (silver tongued) - (hostility~)')
    return s.expression === '(silver tongued) - (hostility~)'
      && s.text === 'The guard folds his arms.'
  })())
t('a reply with no roll is left alone',
  splitRollRequest('Nothing happens.').expression === null
  && splitRollRequest('Nothing happens.').text === 'Nothing happens.')

/*
 * The two prohibitions most at risk once the player can type freely: the
 * obliging thing to do when somebody says "I work out the ratio" is to check
 * their arithmetic, and the obliging thing when they ask for a hint is to give
 * one. Both are the verifier's job and neither is the GM's.
 */
t('the table master is forbidden from rolling its own dice',
  /do not write a\s*number/i.test(TABLE_SYSTEM) && /Do not decide it yourself/i.test(TABLE_SYSTEM))
t('it may not roll to decide what the player knows',
  /Never roll to find out whether the player knows/i.test(TABLE_SYSTEM))
t('it still may not teach or judge a calculation',
  /never the result and never whether it was right/i.test(TABLE_SYSTEM))

/* The sheet is flavour plus earned tags, and it says which is which. A
   background that read as an advantage would be a way to buy a better roll
   from a dropdown. */
const SHEET = sheetFor({ name: 'Vel', background: 'surveyor' }, ['Place value', 'Long division'], 'Krull')
t('the sheet carries the character and the tags they earned',
  SHEET.includes('Vel') && SHEET.includes('Surveyor')
  && SHEET.includes('Long division') && SHEET.includes('Krull'))
t('an empty sheet says so rather than looking broken',
  sheetFor({ name: '', background: 'scribe' }, [], 'Krull').includes('none yet'))
t('every background is colour, with no mechanical claim in its text',
  BACKGROUNDS.every(b => !/\bd\d|\+\d|bonus|advantage/i.test(b.is)))

/*
 * Making a character.
 *
 * Everybody was playing as "a traveller, scribe" — the default, behind a
 * toggle most people never pressed. Four decisions taken on purpose is the
 * difference between a character and a placeholder.
 *
 * The racial tags DO carry weight, unlike backgrounds, and that is not a
 * contradiction of the rule above: they weigh on what happens in a SCENE. The
 * last assertion in this group is the one that matters — nothing in the
 * character can touch the mathematics.
 */
const MADE = { name: 'Vel', background: 'surveyor', race: 'dwarf', trait: 'Afraid of deep water' }

t('a character is not made until it has a name',
  isMade(MADE) && !isMade(DEFAULT_CHARACTER)
  && !isMade({ ...MADE, name: '' }) && !isMade({ ...MADE, name: '   ' }))

t('every race carries tags from the setting, with real tiers',
  RACES.length >= 4 && RACES.every(r =>
    r.tags.length >= 2 && r.tags.every(t => ['#', '~', '', '+'].includes(t.tier) && t.is.length > 20)))

t('an unknown race resolves rather than crashing',
  raceOf('dragon').id === RACES[0].id && raceOf('').id === RACES[0].id)

/* The sheet is what the game master actually reads, so everything chosen has
   to reach it — a choice that does not appear there is decoration. */
const SHEET2 = sheetFor(MADE, ['Place value'], 'Krull')
t('every choice reaches the sheet the game master reads',
  SHEET2.includes('Vel') && SHEET2.includes('Dwarf') && SHEET2.includes('Surveyor')
  && SHEET2.includes('Afraid of deep water'))
t('racial tags reach it with their tiers attached, ready to roll',
  SHEET2.includes('Dwarf strength') && SHEET2.includes('Blunt#')
  && SHEET2.includes('Respect for authority~'))
t('a sheet with no trait does not print an empty one',
  !/INHERENT TAGS:.*,\s*$/m.test(sheetFor({ ...MADE, trait: '' }, [], 'Krull')))

t('the trait is capped before it becomes a tag',
  MAX_TRAIT > 0 && MAX_TRAIT <= 80)

/*
 * sheetFor is reached from two places that cannot promise a whole character:
 * /api/learn/table casts a request body with `(body?.character ?? {}) as
 * Character`, and localStorage holds sheets written before a character had a
 * race or a trait. Both were live — the first a 500 on a malformed request,
 * the second a crash on first render for anybody with an older sheet — and
 * the test that found it was one constructing the OLD shape.
 */
t('a half-built character does not crash the sheet',
  [
    {},
    null,
    undefined,
    { name: 'Vel' },
    { name: 'Vel', background: 'surveyor' },            // the pre-race shape
    { name: 'Vel', race: 'dwarf' },
    { name: 1, background: [], race: {}, trait: 7 },    // nothing of the right type
  ].every(input => {
    const sheet = sheetFor(input, [], 'Krull')
    return typeof sheet === 'string' && sheet.includes('NAME:') && sheet.includes('RACE:')
  }))

t('an unknown race or trade falls back rather than reaching the sheet raw',
  (() => {
    const sheet = sheetFor({ name: 'V', race: 'dragon', background: 'emperor' }, [], 'Krull')
    return !sheet.includes('dragon') && !sheet.includes('emperor')
  })())

/*
 * The boundary, asserted rather than trusted: a character sheet must not be a
 * way to buy past a prerequisite. No race, tag, trade or trait names a concept
 * or claims to open anything.
 */
const CHARACTER_TEXT = [
  ...RACES.flatMap(r => [r.is, ...r.tags.map(t => `${t.name} ${t.is}`)]),
  ...BACKGROUNDS.map(b => b.is),
].join(' ')
t('nothing in a character claims to open a road or teach anything',
  !/prerequisite|unlock|open (a |the )?road|master\w*|learn\w*|concept/i.test(CHARACTER_TEXT))

const JOURNEY = atlas.composeAtlas([], ONTOLOGIES)

t('a journey can cross the world rather than sitting in one city',
  new Set(JOURNEY.concepts.map(c => regionForConcept(c.subjectId)?.id)).size >= 4,
  `only ${new Set(JOURNEY.concepts.map(c => regionForConcept(c.subjectId)?.id)).size} region(s) reachable`)

t('every concept a journey can reach stands somewhere on the map',
  JOURNEY.concepts.every(c => regionForConcept(c.subjectId)),
  JOURNEY.concepts.filter(c => !regionForConcept(c.subjectId)).map(c => c.subjectId).join(', '))

/*
 * Why the mapped areas are excluded from the journey's graph, as an assertion
 * rather than only as a comment. Both of the traverse route's invariants need
 * material: `detailFor` fixes an arrival with its first knowledge point's
 * statement, and the strength gate asks whether prerequisites are strong.
 * A mapped node has neither, so composing the whole atlas would open doors
 * onto concepts that cannot be arrived at coherently.
 */
t('every door a journey opens has material behind it',
  JOURNEY.concepts.every(c => c.knowledgePoints.length > 0),
  JOURNEY.concepts.filter(c => c.knowledgePoints.length === 0).map(c => c.id).slice(0, 5).join(', '))

t('the journey graph is a valid ontology with no cycles',
  ontologyProblems(JOURNEY).length === 0 && cycles(JOURNEY).length === 0,
  ontologyProblems(JOURNEY).slice(0, 4).join(' | '))

t('it has somewhere to start',
  roots(JOURNEY).length > 0 && roots(JOURNEY).every(id => conceptById(JOURNEY, id)))

/*
 * A concept belongs to exactly one region, which is what lets the map answer
 * "where am I" with a single pin. Guaranteed by armatureProblems refusing a
 * subject claimed twice, and asserted here over real concepts rather than over
 * the region table, so the guarantee is checked where it is used.
 */
t('no concept is in two places at once',
  MATHEMATICS.concepts.every(c => {
    const hits = armatureRegions().filter(r =>
      r.area === c.subjectId || (r.authored ?? []).includes(c.subjectId))
    return hits.length <= 1
  }))


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
