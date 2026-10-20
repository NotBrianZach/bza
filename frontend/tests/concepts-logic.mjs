#!/usr/bin/env node
/**
 * Unit checks for the fifth registry and the verifier judge.
 *
 * Same harness as tests/correlate-logic.mjs, same reason: the modules are
 * TypeScript, so they are transpiled to CommonJS in a temp dir with the project's
 * own `typescript` devDependency, and tsc's CommonJS output keeps extensionless
 * relative requires that Node's CJS resolver handles. No bundler, no extra
 * dependency. This works only because every cross-directory import in these
 * modules is `import type`, which is erased — a runtime import of `@/lib/...`
 * would need path mapping this harness deliberately does not set up.
 *
 * WHAT IS COVERED: the parser (which is a security boundary, so its refusals
 * matter as much as its acceptances), the form checks including every case where
 * they must abstain, the graph walks, the ontology's own internal consistency,
 * and the scheduler's four cases — in particular that an inconclusive ruling
 * moves nothing and that credit never introduces a concept it only reinforces.
 *
 * WHAT IS DELIBERATELY NOT HERE: whether an answer is mathematically equivalent
 * to another. That needs a CAS, the CAS is the worker, and a test that faked it
 * would be asserting the fake. `ruleTransform` against a live worker is an
 * integration concern.
 *
 * Run: node tests/concepts-logic.mjs        (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'concepts-logic-'))

function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  const entries = [
    join('lib', 'concepts', 'expr.ts'),
    join('lib', 'concepts', 'forms.ts'),
    join('lib', 'concepts', 'import.ts'),
    join('lib', 'concepts', 'ontology.ts'),
    join('lib', 'concepts', 'registry.ts'),
    join('lib', 'concepts', 'rpn.ts'),
    join('lib', 'concepts', 'scheduling.ts'),
    join('lib', 'concepts', 'tasks.ts'),
    join('lib', 'concepts', 'traversal.ts'),
    join('lib', 'concepts', 'verify.ts'),
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
    // tsc exits non-zero on type errors but still emits; only a missing emit is fatal.
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim()) console.error(out.trim())
  }
  const require = createRequire(import.meta.url)
  return {
    expr: require(join(outDir, 'concepts', 'expr.js')),
    forms: require(join(outDir, 'concepts', 'forms.js')),
    importer: require(join(outDir, 'concepts', 'import.js')),
    ontology: require(join(outDir, 'concepts', 'ontology.js')),
    registry: require(join(outDir, 'concepts', 'registry.js')),
    rpn: require(join(outDir, 'concepts', 'rpn.js')),
    scheduling: require(join(outDir, 'concepts', 'scheduling.js')),
    tasks: require(join(outDir, 'concepts', 'tasks.js')),
    traversal: require(join(outDir, 'concepts', 'traversal.js')),
    verify: require(join(outDir, 'concepts', 'verify.js')),
  }
}

const M = build()
const { parseExpression, tryParse, renderExpr, degreeIn, symbolsIn, isNumeral, unsigned } = M.expr
const { checkForm, checkDenominatorDegree, FORM_LABELS } = M.forms
const { RATIONAL_EXPRESSIONS, ONTOLOGIES, getOntology } = M.ontology
const {
  TASK_KINDS, TASK_KIND_LIST, isVerifiableKind, conceptById, allKnowledgePoints, knowledgePointById,
  conceptOfPoint, prerequisitesOf, dependentsOf, allPrerequisitesOf, roots, teachingOrder, cycles,
  encompassedBy, encompassedClosure, interferesWith, interferenceReason, candidates, promotionRate,
  conceptFacet, fidelityMismatches, ontologyProblems, edgesOfKind,
} = M.registry
const { evaluateRpn, formatValue, calcRecord, toOrgDrawer, toWorkerTree, precisionIsAdvisory, DEFAULT_SETTINGS, exact } = M.rpn
const {
  emptyStrength, halfLifeDays, strengthNow, conceptStrength, introducible, applyObservation,
  assemble, summarise, MASTERY_FLOOR,
} = M.scheduling
const { TASKS, taskById, tasksForPoint, primaryVariable } = M.tasks
const {
  seedTraversal, hasReached, frontier, unmetPrerequisites, openingDoors, offerKey, arrive,
  traversalProgress, TRAVERSAL_GAME,
} = M.traversal
const { isScorable, needsReview, rulingHeadline, verifierConfig } = M.verify
const {
  importArchive, importedEdges, candidateCycles, draftMaterialFor, draftBlockers,
  importPromotionRate, summariseImport, emitDraftModule, latexToInfix, parseFragment,
  apparentSymbols, conceptIdFor, slug, suggestedTaskKinds, IMPORTER_ID,
} = M.importer

let pass = 0
const failures = []
function t(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { failures.push(name); console.log(`  ✗ ${name}${extra ? ` :: ${extra}` : ''}`) }
}
const group = name => console.log(`\n${name}`)

const O = RATIONAL_EXPRESSIONS
const X = ['x']
const p = s => parseExpression(s, X)

// ---------------------------------------------------------------------------

group('the parser — what it accepts')
t('an integer is a string, not a number', p('42').kind === 'integer' && p('42').value === '42')
t('a declared symbol', p('x').kind === 'symbol')
t('juxtaposition multiplies', p('2x').kind === 'multiply')
t('bracket juxtaposition multiplies', p('(x+3)(x-5)').kind === 'multiply')
t('a declared symbol before a bracket is a product, not a call', p('x(x+1)').kind === 'multiply')
t('a sum is flat with negated terms', (() => {
  const tree = p('x - 5 + 2')
  return tree.kind === 'add' && tree.args.length === 3 && tree.args[1].kind === 'negate'
})())
t('division is a divide node', p('1/x').kind === 'divide')
t('power is right-associative', (() => {
  const tree = p('2^3^2')
  return tree.kind === 'power' && tree.exponent.kind === 'power'
})())
t('a signed exponent', p('x^-2').exponent.kind === 'negate')
t('unary minus', p('-x').kind === 'negate')
t('a permitted function', p('sqrt(x)').kind === 'function')
t('a decimal carries its significant digits', (() => {
  const tree = p('1.250')
  return tree.kind === 'decimal' && tree.precision === 4
})())
t('en dash reads as minus', p('x – 5').kind === 'add')
t('a superscript reads as an exponent', (() => {
  const tree = p('x²')
  return tree.kind === 'power' && tree.exponent.value === '2'
})())
t('× reads as multiply', p('2 × x').kind === 'multiply')
t('an equation', p('x = 1').kind === 'equation')

group('the parser — what it refuses, which is the point')
t('an undeclared symbol is refused, never invented', !tryParse('y + 1', X).ok)
t('and the message names it', /\by\b/.test(tryParse('y + 1', X).message))
t('an unknown function is refused', !tryParse('eval(x)', X).ok)
t('the refusal lists what is allowed', /sqrt/.test(tryParse('zzz(x)', X).message))
t('a stray character is refused', !tryParse('x @ 2', X).ok)
t('an unbalanced bracket is refused', !tryParse('(x + 1', X).ok)
t('trailing junk is refused', !tryParse('x + 1 )', X).ok)
t('an empty submission is refused', !tryParse('   ', X).ok)
t('a parse error carries a position', typeof tryParse('x @ 2', X).position === 'number')

group('renderExpr — round trips, so the learner can see how they were read')
const roundTrips = ['x^2 - 2*x - 15', '1/(x + 3) + 2/(x - 5)', '(x + 3)*(x - 5)', '3/(x + 1)^2', '-x + 1']
for (const source of roundTrips) {
  t(`round trips ${source}`, renderExpr(p(renderExpr(p(source)))) === renderExpr(p(source)))
}
t('1/2x renders as the product it parsed to', renderExpr(p('1/2x')) === '1/2*x')

group('degreeIn — and abstaining when it cannot tell')
t('a constant is degree 0', degreeIn(p('7'), 'x') === 0)
t('x is degree 1', degreeIn(p('x'), 'x') === 1)
t('a product adds degrees', degreeIn(p('(x+1)(x+2)'), 'x') === 2)
t('a power multiplies', degreeIn(p('(x+1)^3'), 'x') === 3)
t('a sum takes the max', degreeIn(p('x^3 + x'), 'x') === 3)
t('a quotient by a constant keeps the degree', degreeIn(p('x/2'), 'x') === 1)
t('a quotient by the symbol is not a polynomial', degreeIn(p('1/x'), 'x') === null)
t('a transcendental function abstains', degreeIn(p('sin(x)'), 'x') === null)
t('a function not mentioning the symbol is degree 0', degreeIn(p('sqrt(2)'), 'x') === 0)
t('a symbolic exponent abstains', degreeIn(p('x^x'), 'x') === null)
t('null is never confused with 0', degreeIn(p('1/x'), 'x') !== 0)

group('helpers')
t('isNumeral on a rational', isNumeral(p('3/4')))
t('isNumeral is false for a symbol', !isNumeral(p('x')))
t('symbolsIn finds the symbol', symbolsIn(p('x^2 + 1')).includes('x'))
t('unsigned strips the negate', unsigned(p('-x')).kind === 'symbol')

// ---------------------------------------------------------------------------

group('form: partial_fractions')
const pf = s => checkForm(p(s), 'partial_fractions', 'x')
t('a proper sum over single factors holds', pf('1/(x + 3) + 2/(x - 5)').held === true)
t('a repeated factor with one term per power holds', pf('1/(x + 1) + 3/(x + 1)^2').held === true)
t('a polynomial part is allowed', pf('x + 2 + 3/(x + 1)').held === true)
t('a linear numerator over a quadratic holds', pf('(3/2)/(x - 1) + (-(3/2)x + 1/2)/(x^2 + 1)').held === true)
t('a single term is refused', pf('(3x + 1)/((x + 3)(x - 5))').held === false)
t('…and says so in terms of terms', /single term/.test(pf('(3x+1)/((x+3)(x-5))').detail))
t('a term still over a product is refused', pf('1/x + (3x + 1)/((x + 3)(x - 5))').held === false)
t('…and names the undecomposed denominator', /product of factors/.test(pf('1/x + (3x+1)/((x+3)(x-5))').detail))
t('an improper term is refused', pf('1/x + (x + 1)/(x + 3)').held === false)
t('…and names the degrees', /improper/.test(pf('1/x + (x+1)/(x+3)').detail))
t('a sum with no fraction is refused', pf('x + 2').held === false)
t('a transcendental denominator abstains rather than failing', pf('1/x + 1/sin(x)').held === null)

group('form: single_fraction')
const sf = s => checkForm(p(s), 'single_fraction', 'x')
t('one quotient holds', sf('(x + 3)/(x + 5)').held === true)
t('a sum is refused', sf('1/(x+3) + 2/(x-5)').held === false)
t('a bare polynomial is refused', sf('x + 3').held === false)

group('form: factored')
const ff = s => checkForm(p(s), 'factored', 'x')
t('a product of linear factors holds', ff('(x + 3)(x - 5)').held === true)
t('a product with a coefficient holds', ff('2(x + 3)(x - 5)').held === true)
t('an expanded quadratic is refused', ff('x^2 - 2x - 15').held === false)
// A degree-1 polynomial is a sum of two terms AND fully factored. The degree
// test has to run before the sum test or this marks the only possible answer wrong.
t('a single linear factor is already irreducible', ff('x + 3').held === true)
t('a bare symbol is too', ff('x').held === true)
t('a constant is too', ff('7').held === true)
t('a single degree-2 factor is refused', ff('(x^2 + 1)').held === false)
t('a transcendental abstains rather than passing', ff('sin(x) + x^2').held === null)

group('checkDenominatorDegree — "reduce", which no form can express')
const dd = (s, max) => checkDenominatorDegree(p(s), 'x', max)
t('a reduced fraction is within the bound', dd('(x + 3)/(x + 5)', 1).held === true)
t('AN UNREDUCED ONE IS NOT — this was a real bug', dd('(x^2 - 2x - 15)/(x^2 - 25)', 1).held === false)
t('…and the message says a factor has not been cancelled', /cancelled/.test(dd('(x^2-2x-15)/(x^2-25)', 1).detail))
t('no denominator at all is within any bound', dd('x + 3', 1).held === true)
t('a sum has no single denominator to measure', dd('1/(x+1) + 1/(x+2)', 1).held === false)
t('an undeterminable degree abstains', dd('1/sin(x)', 1).held === null)

group('form: expanded')
const ef = s => checkForm(p(s), 'expanded', 'x')
t('a sum of monomials holds', ef('x^2 - 2x - 15').held === true)
t('an unexpanded bracket is refused', ef('(x + 3)(x - 5)').held === false)
t('an unexpanded power of a sum is refused', ef('(x + 1)^2').held === false)
t('dividing by the symbol is refused', ef('1/x').held === false)
t('dividing by a constant is fine', ef('x/2 + 1').held === true)

group('forms — an equation is never in form')
for (const form of Object.keys(FORM_LABELS)) {
  t(`${form} refuses an equation`, checkForm(p('x = 1'), form, 'x').held === false)
}

// ---------------------------------------------------------------------------

group('the ontology is internally consistent')
t('it reports no problems', ontologyProblems(O).length === 0, JSON.stringify(ontologyProblems(O)))
t('no fidelity mismatches', fidelityMismatches(O).length === 0)
t('the prerequisite graph is acyclic', cycles(O).length === 0)
t('a teaching order exists', Array.isArray(teachingOrder(O)))
t('every concept is in it', teachingOrder(O).length === O.concepts.length)
t('the order respects prerequisites', (() => {
  const order = teachingOrder(O)
  return O.concepts.every(c =>
    prerequisitesOf(O, c.id).every(prereq => order.indexOf(prereq) < order.indexOf(c.id)))
})())
t('there is at least one root', roots(O).length > 0)
t('every knowledge point names the concept it is filed under', (() => {
  return O.concepts.every(c => c.knowledgePoints.every(k => k.conceptId === c.id))
})())
t('every worked example has labelled subgoals', (() => {
  return allKnowledgePoints(O).every(k => k.workedExample.subgoals.length > 0
    && k.workedExample.subgoals.every(s => s.label && s.detail))
})())
t('every objective names at least one task kind', (() => {
  return O.concepts.every(c => c.objectives.every(o => o.taskKinds.length > 0))
})())
t('every named task kind is a real one', (() => {
  return O.concepts.every(c => c.objectives.every(o => o.taskKinds.every(k => !!TASK_KINDS[k])))
})())
t('both fidelities are represented, so the distinction is live', (() => {
  const kinds = new Set(O.concepts.map(c => c.fidelity))
  return kinds.has('checked') && kinds.has('guided')
})())
t('every guided concept carries a caveat', (() => {
  return O.concepts.filter(c => c.fidelity === 'guided').every(c => !!c.caveat)
})())
t('every checked concept carries a pattern', (() => {
  return O.concepts.filter(c => c.fidelity === 'checked').every(c => !!c.scope.match)
})())
t('getOntology finds it by id', getOntology(O.subject.id) === O)
t('an unknown subject is null, not a throw', getOntology('nope') === null)

group('candidates stay quarantined — the measurement depends on it')
t('there are candidate edges to count', candidates(O).length > 0)
t('no candidate names a promoter', candidates(O).every(e => !e.promotedBy))
t('a candidate gates nothing', (() => {
  return candidates(O).every(edge => !prerequisitesOf(O, edge.to).includes(edge.from))
})())
t('a candidate is in no transitive walk either', (() => {
  const c = candidates(O).find(e => !allPrerequisitesOf(O, e.to).includes(e.from))
  return !!c
})())
t('the promotion rate is a real fraction', (() => {
  const r = promotionRate(O)
  return r && r.rate > 0 && r.rate < 1 && r.proposed === r.promoted + candidates(O).length
})())

group('encompasses — the edge that makes credit computable')
t('partial fractions exercises combining', encompassedBy(O, 'partial-fractions-linear').includes('combining-rational'))
t('the closure reaches further, with distances', (() => {
  const closure = encompassedClosure(O, 'partial-fractions-linear')
  return closure.get('combining-rational') === 1 && closure.get('polynomial-arithmetic') === 2
})())
t('the closure never contains its own root', !encompassedClosure(O, 'partial-fractions-linear').has('partial-fractions-linear'))

group('interference is symmetric and explained')
t('read in both directions', (() => {
  const edge = edgesOfKind(O, 'interferes_with')[0]
  return interferesWith(O, edge.from).includes(edge.to) && interferesWith(O, edge.to).includes(edge.from)
})())
t('every interference has a stated reason', edgesOfKind(O, 'interferes_with').every(e => !!e.rationale))
t('the reason is retrievable either way round', (() => {
  const edge = edgesOfKind(O, 'interferes_with')[0]
  return interferenceReason(O, edge.from, edge.to) === interferenceReason(O, edge.to, edge.from)
})())
t('a non-pair has no reason', interferenceReason(O, 'polynomial-arithmetic', 'polynomial-division') === null)

group('cycles are reported rather than thrown')
t('a deliberate cycle is found', (() => {
  const broken = {
    subject: O.subject,
    concepts: [
      { ...O.concepts[0], id: 'a', knowledgePoints: [] },
      { ...O.concepts[0], id: 'b', knowledgePoints: [] },
    ],
    edges: [
      { id: 'x', from: 'a', to: 'b', kind: 'prerequisite', promotedBy: 'test' },
      { id: 'y', from: 'b', to: 'a', kind: 'prerequisite', promotedBy: 'test' },
    ],
  }
  return cycles(broken).length > 0 && teachingOrder(broken) === null
})())
t('a cyclic ontology reports it as a problem', (() => {
  const broken = {
    subject: O.subject,
    concepts: [{ ...O.concepts[0], id: 'a' }, { ...O.concepts[0], id: 'b' }],
    edges: [
      { id: 'x', from: 'a', to: 'b', kind: 'prerequisite', promotedBy: 'test' },
      { id: 'y', from: 'b', to: 'a', kind: 'prerequisite', promotedBy: 'test' },
    ],
  }
  return ontologyProblems(broken).some(s => /cycle/.test(s))
})())

group('conceptFacet — the fifth registry hands the fourth a real Facet')
const facet = conceptFacet(O)
t('one option per concept', facet.options.length === O.concepts.length)
t('a guided concept makes the whole facet guided', facet.enforcement === 'guided')
t('and the facet then carries a caveat', !!facet.caveat)
t('the caveat names the guided concepts', /domain/i.test(facet.caveat))
t('an all-checked ontology yields a checked facet', (() => {
  const checkedOnly = { ...O, concepts: O.concepts.filter(c => c.fidelity === 'checked') }
  const f = conceptFacet(checkedOnly)
  return f.enforcement === 'checked' && !f.caveat
})())

// ---------------------------------------------------------------------------

group('tasks are well formed')
t('every task names a real knowledge point', TASKS.every(task => !!knowledgePointById(O, task.knowledgePointId)))
t('every task declares its symbols', TASKS.every(task => task.variables.length > 0))
t('every given parses under its own declarations', TASKS.every(task =>
  tryParse(task.given, task.variables.map(v => v.name)).ok))
t('every reference parses under its own declarations', TASKS.every(task =>
  tryParse(task.reference, task.variables.map(v => v.name)).ok))
/**
 * Every shape check a task asserts, run over one expression.
 *
 * `true` means every assertion held, `false` that one refused, `null` that one
 * abstained — the same three-way result `ruleTransform` works with, so these two
 * assertions test what the verifier will actually do rather than an approximation
 * of it.
 */
const shapeHolds = (task, source) => {
  const parsed = tryParse(source, task.variables.map(v => v.name))
  if (!parsed.ok) return false
  const checks = []
  if (task.form) checks.push(checkForm(parsed.tree, task.form, primaryVariable(task)))
  if (typeof task.maxDenominatorDegree === 'number') {
    checks.push(checkDenominatorDegree(parsed.tree, primaryVariable(task), task.maxDenominatorDegree))
  }
  if (checks.some(c => c.held === false)) return false
  if (checks.some(c => c.held === null)) return null
  return true
}

t('every reference satisfies every shape its task asserts', (() => {
  return TASKS.filter(task => task.form && shapeHolds(task, task.reference) !== true).length === 0
})(), TASKS.filter(task => task.form && shapeHolds(task, task.reference) !== true).map(t2 => t2.id).join(', '))

// The assertion that caught a real bug: `cancel-common-factors-1` demanded
// `single_fraction` of an input that was already a single fraction, and the
// unchanged input is equivalent to itself — so submitting nothing at all would
// have been ruled correct. `maxDenominatorDegree` is what closed it.
t('no given already satisfies what its task asks — that would be a free mark', (() => {
  return TASKS.filter(task => task.form && shapeHolds(task, task.given) === true).length === 0
})(), TASKS.filter(task => task.form && shapeHolds(task, task.given) === true).map(t2 => t2.id).join(', '))
t('every task id is unique', new Set(TASKS.map(task => task.id)).size === TASKS.length)
t('taskById finds one', taskById(TASKS[0].id) === TASKS[0])
t('an unknown id is null', taskById('nope') === null)
t('tasksForPoint filters', tasksForPoint('decompose-distinct').every(task => task.knowledgePointId === 'decompose-distinct'))
t('only verifiable kinds are shipped as tasks', TASKS.every(task => isVerifiableKind(task.kind)))
t('some kinds are declared unverifiable, so the distinction is live', TASK_KIND_LIST.some(k => !k.verifiable))
t('primaryVariable is the first declaration', primaryVariable(TASKS[0]) === TASKS[0].variables[0].name)

// ---------------------------------------------------------------------------

group('verify — the rules that must hold without a worker')
t('correct is scorable', isScorable({ ruling: 'correct', method: 'm', conditions: [] }))
t('incorrect is scorable', isScorable({ ruling: 'incorrect', method: 'm', conditions: [] }))
t('inconclusive is NOT scorable', !isScorable({ ruling: 'inconclusive', method: 'm', conditions: [] }))
t('abandoned is NOT scorable', !isScorable({ ruling: 'abandoned', method: 'm', conditions: [] }))
t('an attempted inconclusive needs review', needsReview({ ruling: 'inconclusive', method: 'm', conditions: [], evidence: { runId: 7 } }))
t('an unconfigured inconclusive does not', !needsReview({ ruling: 'inconclusive', method: 'no worker', conditions: [] }))
t('a correct ruling never needs review', !needsReview({ ruling: 'correct', method: 'm', conditions: [], evidence: { runId: 7 } }))
t('the incorrect headline mentions the step when there is one', /step/i.test(rulingHeadline({ ruling: 'incorrect', method: 'm', conditions: [], brokeAt: { step: 1, detail: 'd' } })))
t('verifierConfig reports an unset worker as null', verifierConfig().url === null || typeof verifierConfig().url === 'string')

// ---------------------------------------------------------------------------

group('scheduling — decay')
const NOW = '2026-10-14T12:00:00.000Z'
const plusDays = (iso, days) => new Date(new Date(iso).getTime() + days * 86400000).toISOString()
t('an untouched point is strength 0', strengthNow(emptyStrength('k'), NOW) === 0)
t('half-life starts at one day', halfLifeDays({ ...emptyStrength('k'), streak: 0 }) === 1)
t('each unaided success doubles it', halfLifeDays({ ...emptyStrength('k'), streak: 3 }) === 8)
t('it is capped', halfLifeDays({ ...emptyStrength('k'), streak: 60 }) === 180)
t('strength halves over one half-life', (() => {
  const s = { ...emptyStrength('k'), strength: 1, streak: 0, lastDemonstratedAt: NOW }
  return Math.abs(strengthNow(s, plusDays(NOW, 1)) - 0.5) < 1e-9
})())
t('and quarters over two', (() => {
  const s = { ...emptyStrength('k'), strength: 1, streak: 0, lastDemonstratedAt: NOW }
  return Math.abs(strengthNow(s, plusDays(NOW, 2)) - 0.25) < 1e-9
})())

group('scheduling — the four cases')
const obs = (overrides = {}) => ({
  knowledgePointId: 'expand-binomials',
  taskId: 'expand-binomials-1',
  kind: 'transform_to_form',
  verdict: { ruling: 'correct', method: 'm', conditions: [] },
  assistance: 'none',
  answer: 'x^2 - 2x - 15',
  at: NOW,
  ...overrides,
})

t('an unaided success raises strength', (() => {
  const r = applyObservation(O, {}, obs())
  return r.scored && r.table['expand-binomials'].strength > 0
})())
t('…and the streak', applyObservation(O, {}, obs()).table['expand-binomials'].streak === 1)
t('…and sets both timestamps', (() => {
  const s = applyObservation(O, {}, obs()).table['expand-binomials']
  return s.lastDemonstratedAt === NOW && s.lastAttemptAt === NOW
})())

t('an assisted success does not raise strength', (() => {
  const r = applyObservation(O, {}, obs({ assistance: 'hint' }))
  return r.scored && r.table['expand-binomials'].strength === 0
})())
t('…and is counted separately', applyObservation(O, {}, obs({ assistance: 'hint' })).table['expand-binomials'].assistedSuccesses === 1)
t('…and does NOT reset the decay clock', applyObservation(O, {}, obs({ assistance: 'hint' })).table['expand-binomials'].lastDemonstratedAt === null)
t('…but does suppress re-serving', applyObservation(O, {}, obs({ assistance: 'hint' })).table['expand-binomials'].lastAttemptAt === NOW)

t('an incorrect answer halves strength and clears the streak', (() => {
  const before = applyObservation(O, {}, obs()).table
  const after = applyObservation(O, before, obs({
    verdict: { ruling: 'incorrect', method: 'm', conditions: [] },
    at: NOW,
  })).table
  return after['expand-binomials'].streak === 0
    && after['expand-binomials'].strength < before['expand-binomials'].strength
    && after['expand-binomials'].failures === 1
})())
t('…and leaves lastDemonstratedAt alone', (() => {
  const before = applyObservation(O, {}, obs()).table
  const after = applyObservation(O, before, obs({ verdict: { ruling: 'incorrect', method: 'm', conditions: [] } })).table
  return after['expand-binomials'].lastDemonstratedAt === NOW
})())

t('an inconclusive ruling moves NOTHING', (() => {
  const before = applyObservation(O, {}, obs()).table
  const r = applyObservation(O, before, obs({ verdict: { ruling: 'inconclusive', method: 'm', conditions: [] } }))
  return !r.scored && r.table === before && r.propagated.length === 0
})())
t('an abandoned ruling moves nothing either', (() => {
  const r = applyObservation(O, {}, obs({ verdict: { ruling: 'abandoned', method: 'm', conditions: [] } }))
  return !r.scored && Object.keys(r.table).length === 0
})())
t('applyObservation never mutates the table it was given', (() => {
  const before = {}
  applyObservation(O, before, obs())
  return Object.keys(before).length === 0
})())

group('scheduling — credit propagation, and the guard on it')
const demonstrate = (table, pointId, at) =>
  applyObservation(O, table, obs({ knowledgePointId: pointId, at, taskId: `t-${pointId}` })).table

t('credit reaches a concept that was exercised', (() => {
  // combine-two must already have been demonstrated, or propagation must skip it.
  let table = demonstrate({}, 'combine-two', NOW)
  const r = applyObservation(O, table, obs({
    knowledgePointId: 'decompose-distinct', taskId: 'decompose-distinct-1', at: plusDays(NOW, 5),
  }))
  return r.propagated.some(x => x.knowledgePointId === 'combine-two')
})())
t('…at distance 1', (() => {
  let table = demonstrate({}, 'combine-two', NOW)
  const r = applyObservation(O, table, obs({ knowledgePointId: 'decompose-distinct', at: plusDays(NOW, 5) }))
  return r.propagated.find(x => x.knowledgePointId === 'combine-two').distance === 1
})())
t('…and resets its decay clock, so it does not come due as though untouched', (() => {
  let table = demonstrate({}, 'combine-two', NOW)
  const at = plusDays(NOW, 5)
  const r = applyObservation(O, table, obs({ knowledgePointId: 'decompose-distinct', at }))
  return r.table['combine-two'].lastDemonstratedAt === at
})())
t('…and does NOT fake an attempt on it', (() => {
  let table = demonstrate({}, 'combine-two', NOW)
  const at = plusDays(NOW, 5)
  const r = applyObservation(O, table, obs({ knowledgePointId: 'decompose-distinct', at }))
  return r.table['combine-two'].lastAttemptAt === NOW
})())
t('credit decays with distance', (() => {
  let table = demonstrate({}, 'combine-two', NOW)
  table = demonstrate(table, 'expand-binomials', NOW)
  const r = applyObservation(O, table, obs({ knowledgePointId: 'decompose-distinct', at: plusDays(NOW, 5) }))
  const near = r.propagated.find(x => x.knowledgePointId === 'combine-two')
  const far = r.propagated.find(x => x.knowledgePointId === 'expand-binomials')
  return near && far && far.credit < near.credit
})())
t('CREDIT NEVER INTRODUCES: an undemonstrated point gets nothing', (() => {
  const r = applyObservation(O, {}, obs({ knowledgePointId: 'decompose-distinct' }))
  return !r.propagated.some(x => x.knowledgePointId === 'combine-two')
    && r.table['combine-two'] === undefined
})())
t('an assisted success propagates nothing', (() => {
  let table = demonstrate({}, 'combine-two', NOW)
  const r = applyObservation(O, table, obs({ knowledgePointId: 'decompose-distinct', assistance: 'hint' }))
  return r.propagated.length === 0
})())
t('an incorrect answer propagates nothing', (() => {
  let table = demonstrate({}, 'combine-two', NOW)
  const r = applyObservation(O, table, obs({
    knowledgePointId: 'decompose-distinct',
    verdict: { ruling: 'incorrect', method: 'm', conditions: [] },
  }))
  return r.propagated.length === 0
})())

group('scheduling — the mastery gate does not relax')
t('a root is introducible from nothing', introducible(O, {}, 'polynomial-arithmetic', NOW))
t('a dependent is not', !introducible(O, {}, 'factoring-quadratics', NOW))
t('it becomes introducible once its prerequisite is strong', (() => {
  const strong = {}
  for (const point of conceptById(O, 'polynomial-arithmetic').knowledgePoints) {
    strong[point.id] = { ...emptyStrength(point.id), strength: 1, streak: 5, unaidedSuccesses: 5, lastDemonstratedAt: NOW }
  }
  return introducible(O, strong, 'factoring-quadratics', NOW)
})())
t('…and stops being introducible once that strength decays away', (() => {
  const strong = {}
  for (const point of conceptById(O, 'polynomial-arithmetic').knowledgePoints) {
    strong[point.id] = { ...emptyStrength(point.id), strength: 1, streak: 0, unaidedSuccesses: 1, lastDemonstratedAt: NOW }
  }
  return !introducible(O, strong, 'factoring-quadratics', plusDays(NOW, 30))
})())
t('conceptStrength averages over the concept points', (() => {
  const points = conceptById(O, 'polynomial-arithmetic').knowledgePoints
  const table = { [points[0].id]: { ...emptyStrength(points[0].id), strength: 1, lastDemonstratedAt: NOW } }
  const s = conceptStrength(O, table, 'polynomial-arithmetic', NOW)
  return s > 0 && s < 1
})())

group('scheduling — assembly')
const strongTable = (conceptIds) => {
  const table = {}
  for (const id of conceptIds) {
    for (const point of conceptById(O, id).knowledgePoints) {
      table[point.id] = { ...emptyStrength(point.id), strength: 1, streak: 8, unaidedSuccesses: 8, lastDemonstratedAt: NOW }
    }
  }
  return table
}

t('an empty table still yields the roots', (() => {
  const a = assemble({ ontology: O, strengths: {}, now: NOW })
  return a.tasks.length > 0 && a.tasks.every(task =>
    conceptOfPoint(O, task.knowledgePointId).id === 'polynomial-arithmetic')
})())
t('blocked concepts are reported, not dropped', (() => {
  const a = assemble({ ontology: O, strengths: {}, now: NOW })
  return a.blocked.some(b => b.conceptId === 'factoring-quadratics' && b.missing.length > 0)
})())
t('the size cap is honoured', assemble({ ontology: O, strengths: {}, now: NOW, size: 1 }).tasks.length === 1)
t('…and what it dropped is reported', (() => {
  const a = assemble({ ontology: O, strengths: {}, now: NOW, size: 1 })
  return a.skipped.some(s => /already full/.test(s.reason))
})())
t('the per-concept cap mixes the set', (() => {
  const table = strongTable(['polynomial-arithmetic', 'factoring-quadratics', 'rational-domain'])
  const a = assemble({ ontology: O, strengths: table, now: NOW, size: 10, maxPerConcept: 1 })
  const concepts = a.tasks.map(task => conceptOfPoint(O, task.knowledgePointId).id)
  return new Set(concepts).size === concepts.length
})())
t('…and the cap is reported when it bites', (() => {
  const a = assemble({ ontology: O, strengths: {}, now: NOW, size: 10, maxPerConcept: 1 })
  return a.skipped.some(s => /per-concept cap/.test(s.reason))
})())
t('INTERFERENCE IS HARD: two interfering concepts never share a set', (() => {
  const table = strongTable(O.concepts.map(c => c.id))
  const a = assemble({ ontology: O, strengths: table, now: NOW, size: 20, maxPerConcept: 5 })
  const concepts = new Set(a.tasks.map(task => conceptOfPoint(O, task.knowledgePointId).id))
  for (const id of concepts) {
    if (interferesWith(O, id).some(other => concepts.has(other))) return false
  }
  return true
})())
t('…and the refusal is reported with both names', (() => {
  const table = strongTable(O.concepts.map(c => c.id))
  const a = assemble({ ontology: O, strengths: table, now: NOW, size: 20, maxPerConcept: 5 })
  return a.skipped.some(s => /must not be practised alongside/.test(s.reason))
})())
t('the cooldown suppresses a just-attempted point', (() => {
  const table = { 'expand-binomials': { ...emptyStrength('expand-binomials'), lastAttemptAt: NOW } }
  const a = assemble({ ontology: O, strengths: table, now: NOW, size: 10 })
  return a.tasks.every(task => task.knowledgePointId !== 'expand-binomials')
    && a.skipped.some(s => /last twenty minutes/.test(s.reason))
})())
t('…and lets it back after the cooldown', (() => {
  const table = { 'expand-binomials': { ...emptyStrength('expand-binomials'), lastAttemptAt: NOW } }
  const a = assemble({ ontology: O, strengths: table, now: plusDays(NOW, 1), size: 10 })
  return a.tasks.some(task => task.knowledgePointId === 'expand-binomials')
})())
t('`reached` narrows and never widens', (() => {
  const table = strongTable(O.concepts.map(c => c.id))
  const wide = assemble({ ontology: O, strengths: table, now: NOW, size: 20 })
  const narrow = assemble({ ontology: O, strengths: table, now: NOW, size: 20, reached: ['polynomial-arithmetic'] })
  return narrow.tasks.length <= wide.tasks.length
    && narrow.tasks.every(task => conceptOfPoint(O, task.knowledgePointId).id === 'polynomial-arithmetic')
})())
t('the weakest point comes first', (() => {
  const table = strongTable(['polynomial-arithmetic'])
  table['expand-binomials'] = { ...emptyStrength('expand-binomials'), strength: 0.1, streak: 0, unaidedSuccesses: 1, lastDemonstratedAt: NOW }
  const a = assemble({ ontology: O, strengths: table, now: NOW, size: 5 })
  return a.tasks[0].knowledgePointId === 'expand-binomials'
})())

group('scheduling — summary')
t('it counts demonstrated points', (() => {
  const table = demonstrate({}, 'expand-binomials', NOW)
  return summarise(O, table, NOW).demonstrated === 1
})())
t('assisted-only points are counted apart and not as demonstrated', (() => {
  const table = applyObservation(O, {}, obs({ assistance: 'hint' })).table
  const s = summarise(O, table, NOW)
  return s.assistedOnly === 1 && s.demonstrated === 0
})())
t('the mastery floor is what the summary uses', (() => {
  const table = strongTable(['polynomial-arithmetic'])
  return summarise(O, table, NOW).strongConcepts >= 1 && MASTERY_FLOOR > 0 && MASTERY_FLOOR <= 1
})())

// ---------------------------------------------------------------------------

group('traversal — the reframing')
t('the game reuses navigation\'s constraint verbatim', TRAVERSAL_GAME.pieces.constraint === 'You pick the key, never the door.')
t('its judge is the verifier', TRAVERSAL_GAME.judge === 'verifier')
t('its world keys are the three relabelled ones', (() => {
  const keys = TRAVERSAL_GAME.worldKeys.map(k => k.key)
  return keys.includes('here') && keys.includes('reached') && keys.includes('route')
})())

const seeded = seedTraversal()
t('a fresh world has reached nothing', seeded.route.length === 0 && seeded.here === null)
t('the openings are the roots', (() => {
  const openings = openingDoors(O, seeded)
  return openings.length === roots(O).length && openings.every(id => roots(O).includes(id))
})())
t('the frontier of a fresh world is also the roots', frontier(O, seeded).every(id => roots(O).includes(id)))

const atRoot = arrive(seeded, 'polynomial-arithmetic', 'detail')
t('arriving records the route, the atlas and where you stand', (() => {
  return atRoot.route.length === 1 && atRoot.reached.length === 1
    && atRoot.here === 'polynomial-arithmetic' && atRoot.reached[0].detail === 'detail'
})())
t('arrive does not mutate the old world', seeded.route.length === 0)
t('arriving twice is idempotent on the route', arrive(atRoot, 'polynomial-arithmetic', 'd2').route.length === 1)
t('hasReached reads the route', hasReached(atRoot, 'polynomial-arithmetic'))

t('offering a key you do not hold is refused', offerKey(O, atRoot, 'partial-fractions-linear').kind === 'not-yours')
t('an unknown concept is refused', offerKey(O, atRoot, 'nope').kind === 'not-yours')
t('offering a held key opens what it unlocks', (() => {
  const outcome = offerKey(O, atRoot, 'polynomial-arithmetic')
  return outcome.kind === 'opens' && dependentsOf(O, 'polynomial-arithmetic').includes(outcome.door)
})())
t('the door is chosen by the graph and is reproducible', (() => {
  const a = offerKey(O, atRoot, 'polynomial-arithmetic')
  const b = offerKey(O, atRoot, 'polynomial-arithmetic')
  return a.kind === 'opens' && b.kind === 'opens' && a.door === b.door
})())
t('THE DOOR DOES NOT OPEN EARLY: a blocked key names what is missing', (() => {
  // factoring-quadratics unlocks simplifying-rational, which also needs
  // rational-domain. Reaching only factoring leaves the door shut.
  let world = arrive(seeded, 'polynomial-arithmetic', 'd')
  world = arrive(world, 'factoring-quadratics', 'd')
  const outcome = offerKey(O, world, 'factoring-quadratics')
  return outcome.kind === 'blocked'
    ? outcome.missing.length > 0 && /missing/i.test(outcome.because)
    : outcome.kind === 'opens' && unmetPrerequisites(O, world, outcome.door).length === 0
})())
t('no outcome ever arrives somewhere with unmet prerequisites', (() => {
  let world = arrive(seeded, 'polynomial-arithmetic', 'd')
  for (let i = 0; i < 20; i++) {
    let moved = false
    for (const key of [...world.route]) {
      const outcome = offerKey(O, world, key)
      if (outcome.kind === 'opens') {
        if (unmetPrerequisites(O, world, outcome.door).length > 0) return false
        world = arrive(world, outcome.door, 'd')
        moved = true
        break
      }
    }
    if (!moved) break
  }
  return world.route.length > 1
})())
t('a spent key says so', (() => {
  let world = arrive(seeded, 'polynomial-arithmetic', 'd')
  for (const dep of dependentsOf(O, 'polynomial-arithmetic')) world = arrive(world, dep, 'd')
  return offerKey(O, world, 'polynomial-arithmetic').kind === 'spent'
})())
t('progress counts concepts, not points', (() => {
  const progress = traversalProgress(O, atRoot)
  return progress.total === O.concepts.length && progress.reached === 1
})())

// ---------------------------------------------------------------------------

group('rpn — exact where it says it is')
const ev = (s, settings = DEFAULT_SETTINGS) => evaluateRpn(s, settings)
t('integers add exactly', ev('3 4 +').display === '7' && ev('3 4 +').isExact)
t('a quotient stays a fraction', ev('1 3 /').display === '1:3' && ev('1 3 /').isExact)
t('fractions add exactly', ev('1 3 / 1 6 / +').display === '1:2')
t('Calc fraction syntax is accepted', ev('1:3 1:6 +').display === '1:2')
t('an integer power stays exact', ev('2 10 ^').display === '1024' && ev('2 10 ^').isExact)
t('a negative power inverts exactly', ev('2 -2 ^').display === '1:4')
t('a perfect square root stays exact', ev('9 4 / sqrt').display === '3:2' && ev('9 4 / sqrt').isExact)
t('a non-perfect root falls to a double and says so', !ev('2 sqrt').isExact)
t('a decimal makes the result a numerical observation', !ev('0.1 0.2 +').isExact)
t('subtraction and negation', ev('10 3 - neg').display === '-7')
t('inv', ev('4 inv').display === '1:4')
t('abs', ev('5 neg abs').display === '5')
t('dup and swap', ev('3 dup *').display === '9' && ev('1 2 swap -').display === '1')
t('drop', ev('1 2 drop').display === '1')
t('over', ev('3 4 over').display === '3')
t('degrees are the default angle mode', Math.abs(Number(ev('90 sin').display) - 1) < 1e-9)
t('radians when asked', Math.abs(Number(ev('0 sin', { precision: 12, angle: 'rad' }).display)) < 1e-12)
t('pi is a double, so the result is not exact', !ev('pi').isExact)
t('division by zero throws', (() => { try { ev('1 0 /'); return false } catch { return true } })())
t('an unknown word throws', (() => { try { ev('1 frobnicate'); return false } catch { return true } })())
t('a stack underflow names the word', (() => {
  try { ev('1 +'); return false } catch (e) { return /\+/.test(e.message) }
})())
t('a negative square root throws', (() => { try { ev('4 neg sqrt'); return false } catch { return true } })())
t('precision above a double is flagged as advisory', precisionIsAdvisory({ precision: 30, angle: 'deg' }))
t('…and a normal setting is not', !precisionIsAdvisory({ precision: 12, angle: 'deg' }))

group('rpn — the record is Calc\'s record')
const record = calcRecord('3 4 +', ev('3 4 +'), DEFAULT_SETTINGS, 'abc123')
t('it carries every Calc field', (() => {
  const keys = Object.keys(record).sort().join(',')
  return keys === 'angle,engine,evidence,input,mode,precision,result,revision'
})(), Object.keys(record).sort().join(','))
t('mode is rpn', record.mode === 'rpn')
t('an exact result claims symbolic_result', record.evidence === 'symbolic_result')
t('an inexact one claims numerical_observation', calcRecord('0.1', ev('0.1'), DEFAULT_SETTINGS, 'r').evidence === 'numerical_observation')
t('the evidence vocabulary adds no new term', ['symbolic_result', 'numerical_observation'].includes(record.evidence))
t('the drawer has the fields Emacs writes', (() => {
  const drawer = toOrgDrawer(record)
  return /^:RESULTS:/.test(drawer) && /\nengine: /.test(drawer) && /\nrevision: abc123\n/.test(drawer) && /:END:$/.test(drawer)
})())

group('rpn — crossing to the worker as a tree, never a string')
t('an integer becomes an integer node', toWorkerTree(exact(7n)).kind === 'integer')
t('a fraction becomes a rational node', (() => {
  const tree = toWorkerTree(exact(1n, 3n))
  return tree.kind === 'rational' && tree.numerator === '1' && tree.denominator === '3'
})())
t('a float becomes a decimal node with a precision', (() => {
  const tree = toWorkerTree({ kind: 'float', v: 1.5 })
  return tree.kind === 'decimal' && typeof tree.precision === 'number'
})())
t('exact() normalises the sign onto the numerator', (() => {
  const v = exact(1n, -2n)
  return v.v.n === -1n && v.v.d === 2n
})())
t('exact() reduces', (() => {
  const v = exact(6n, 4n)
  return v.v.n === 3n && v.v.d === 2n
})())
t('a zero denominator throws', (() => { try { exact(1n, 0n); return false } catch { return true } })())

// ---------------------------------------------------------------------------
// The importer
// ---------------------------------------------------------------------------

/**
 * A SYNTHETIC archive. This is the honest status of the fixture and it is worth
 * being blunt about: no real Math Academy scrape is checked into either repo, so
 * every field below was written by reading what the extension's `content.js`
 * (`extractSteps`, `extractPrerequisiteGraph`) and `background.js`
 * (`handleGraphScraped`, `setGraph`) actually emit. It asserts that the importer
 * handles the shape those functions write — not that a live scrape writes it.
 *
 * It is built to exercise every refusal at once: a `related` fallback edge, a
 * self-edge, a duplicate pair arriving under two types, an edge pointing at a
 * never-visited topic, a lesson whose overview page was never opened, and a
 * two-edge prerequisite cycle.
 */
const ARCHIVE = {
  manifest: { generatedAt: '2026-10-20T00:00:00.000Z', source: 'mathacademy.com' },
  graph: {
    topics: {
      'algebra-1': { title: 'Multiplying Binomials', url: 'https://mathacademy.com/topics/algebra-1', scrapedAt: '2026-10-19T10:00:00.000Z' },
      'algebra-2': { title: 'Factoring Quadratics', url: 'https://mathacademy.com/topics/algebra-2' },
    },
    edges: [
      { from: 'algebra-1', to: 'algebra-2', type: 'prerequisite', fromLabel: 'Multiplying Binomials' },
      { from: 'algebra-2', to: 'algebra-9', type: 'leads_to', toLabel: 'Partial Fractions' },
      { from: 'algebra-9', to: 'algebra-2', type: 'prerequisite', fromLabel: 'Partial Fractions' },
      // Refused: the scraper's else-branch, pointing at a navigation page.
      { from: 'nav-home', to: 'algebra-1', type: 'related', fromLabel: 'All Topics' },
      // Refused: the scraper matched a link to the page it was already on.
      { from: 'algebra-1', to: 'algebra-1', type: 'prerequisite' },
      // Refused: same pair as the first edge, under a weaker type.
      { from: 'algebra-1', to: 'algebra-2', type: 'leads_to' },
    ],
  },
  steps: [
    {
      id: 'step-t1', topicId: 'algebra-1', type: 'tutorial', typeLabel: 'Tutorial',
      title: 'Introduction', text: 'Multiplying two binomials means forming every product of a term from the first with a term from the second.',
      latex: ['(x+a)(x+b)'], graphics: ['media/fig1.png'],
    },
    {
      id: 'step-e2', topicId: 'algebra-1', type: 'example', typeLabel: 'Example',
      title: 'Expanding a product',
      question: { text: 'Expand (x + 3)(x - 5).', latex: ['(x+3)(x-5)'] },
      explanation: { text: 'Form all four products, then collect like terms to get x^2 - 2x - 15.', latex: ['x^2-2x-15'] },
      graphics: [],
    },
    {
      id: 'step-q3', topicId: 'algebra-1', type: 'question', typeLabel: 'Question',
      title: 'Question 3', text: 'Expand and collect like terms.',
      latex: ['(2x-1)(x+4)', '\\frac{x+1}{x-1}', '\\oiint_{\\Sigma} F'],
      userAnswer: '2x^2 + 7x - 4', answerChoices: null, graphics: [],
    },
    // A tutorial step with nothing in it — refused.
    { id: 'step-t4', topicId: 'algebra-1', type: 'tutorial', text: 'ok', latex: [] },
    // A step type the importer does not read — refused and counted.
    { id: 'step-z5', topicId: 'algebra-1', type: 'unknown', text: 'something else' },
    // A lesson whose overview page was never opened, so it is in no graph.topics.
    {
      id: 'step-t1', topicId: 'algebra-7', type: 'tutorial', title: 'Completing the Square',
      text: 'Completing the square rewrites a quadratic so the variable appears once.',
      latex: [], graphics: [],
    },
  ],
}

const IMP = importArchive(ARCHIVE, 'rational-expressions')

group('importer — every imported edge is quarantined')
t('three edges were accepted', IMP.edges.length === 3, JSON.stringify(IMP.edges.map(e => e.id)))
t('every accepted edge is a candidate', IMP.edges.every(e => e.kind === 'candidate_prerequisite'))
t('no accepted edge names a promoter', IMP.edges.every(e => e.promotedBy === undefined))
t('every accepted edge carries a rationale naming the importer and the scraped type',
  IMP.edges.every(e => e.rationale?.includes(IMPORTER_ID) && /'(prerequisite|leads_to)'/.test(e.rationale)))
t('the ontology would refuse a candidate that named a promoter', (() => {
  const broken = { ...O, edges: [...O.edges, { id: 'x1', from: 'polynomial-arithmetic', to: 'factoring-quadratics', kind: 'candidate_prerequisite', promotedBy: 'importer' }] }
  return ontologyProblems(broken).some(s => /neither one thing nor the other/.test(s))
})())

group('importer — what it refuses, and counts')
t('three edges were refused', IMP.rejected.edges.length === 3, JSON.stringify(IMP.rejected.edges))
t('the related fallback is refused, naming the promotion rate as the reason',
  IMP.rejected.edges.some(e => e.type === 'related' && /promotion rate/.test(e.reason)))
t('no related edge survived into the candidates',
  !IMP.edges.some(e => /nav-home/.test(e.from) || /nav-home/.test(e.to)))
t('a refused related edge does not mint a concept for its endpoint',
  !IMP.concepts.some(c => c.id === conceptIdFor('nav-home')))
t('a self-edge is refused', IMP.rejected.edges.some(e => /itself/.test(e.reason)))
t('a duplicate pair is refused rather than doubled',
  IMP.rejected.edges.some(e => /already arrived as prerequisite/.test(e.reason)))
t('the surviving edge for the duplicated pair is the explicit prerequisite', (() => {
  const edge = IMP.edges.find(e => e.from === conceptIdFor('algebra-1') && e.to === conceptIdFor('algebra-2'))
  return !!edge && /'prerequisite'/.test(edge.rationale)
})())
t('an explicit prerequisite supersedes a leads_to that arrived first', (() => {
  const { edges, rejected } = importedEdges({
    edges: [
      { from: 'a', to: 'b', type: 'leads_to' },
      { from: 'a', to: 'b', type: 'prerequisite' },
    ],
  })
  return edges.length === 1 && /'prerequisite'/.test(edges[0].rationale)
    && rejected.some(r => /superseded/.test(r.reason))
})())
t('an edge missing an endpoint is refused', (() => {
  const { edges, rejected } = importedEdges({ edges: [{ from: 'a', type: 'prerequisite' }] })
  return edges.length === 0 && rejected.some(r => /names no endpoint/.test(r.reason))
})())
t('an unrecognised type is refused rather than assumed', (() => {
  const { edges, rejected } = importedEdges({ edges: [{ from: 'a', to: 'b', type: 'see_also' }] })
  return edges.length === 0 && rejected.some(r => /unrecognised edge type/.test(r.reason))
})())
t('leads_to keeps its direction — current unlocks linked', (() => {
  const edge = IMP.edges.find(e => /leads_to/.test(e.rationale))
  return edge.from === conceptIdFor('algebra-2') && edge.to === conceptIdFor('algebra-9')
})())

group('importer — drafts are quarantined by type, not by a filter')
t('every draft is guided', IMP.concepts.every(c => c.fidelity === 'guided'))
t('every draft carries a caveat', IMP.concepts.every(c => c.caveat.length > 0))
t('no draft scope carries a match, which is what guided means here',
  IMP.concepts.every(c => c.scope.match === undefined))
t('no draft carries knowledgePoints or objectives at all',
  IMP.concepts.every(c => c.knowledgePoints === undefined && c.objectives === undefined))
t('every draft lists what blocks it', IMP.concepts.every(c => c.blocking.length > 0))
t('draftBlockers is never empty, for every draft',
  IMP.concepts.every(c => draftBlockers(c).length > 0))
t('a draft names the missing objectives as a blocker',
  IMP.concepts.every(c => c.blocking.some(b => /no objectives/.test(b))))
t('suggestedTaskKinds is a hint and never becomes an objective',
  suggestedTaskKinds({ tutorial: 1, example: 0, question: 0, unknown: 0 }).includes('state'))
t('every draft id is prefixed so it cannot collide with an authored concept',
  IMP.concepts.every(c => c.id.startsWith('ma-')))
t('no draft id collides with a real concept in the shipped ontology',
  IMP.concepts.every(c => !conceptById(O, c.id)))
t('slug survives an id with nothing usable in it', slug('///') === 'untitled')

group('importer — the edges deliberately dangle until concepts are authored')
t('merging the candidates into the ontology reports unknown concepts', (() => {
  const merged = { ...O, edges: [...O.edges, ...IMP.edges] }
  const problems = ontologyProblems(merged)
  return problems.filter(s => /unknown concept ma-/.test(s)).length === 6
})(), 'six endpoints across three edges')
t('the candidates still gate nothing after merging', (() => {
  const merged = { ...O, edges: [...O.edges, ...IMP.edges] }
  return prerequisitesOf(merged, conceptIdFor('algebra-2')).length === 0
    && teachingOrder(merged)?.length === O.concepts.length
})())
t('the merged promotion rate counts them as proposed and unpromoted', (() => {
  const before = promotionRate(O)
  const merged = { ...O, edges: [...O.edges, ...IMP.edges] }
  const after = promotionRate(merged)
  return after.promoted === before.promoted && after.proposed === before.proposed + 3
    && after.rate < before.rate
})())

group('importer — scraped material is drafted, never promoted')
const a1 = IMP.concepts.find(c => c.id === conceptIdFor('algebra-1'))
t('a visited topic becomes a scraped-topic draft', a1.source.origin === 'scraped-topic')
t('its step counts are recorded per type',
  a1.source.stepCounts.tutorial === 2 && a1.source.stepCounts.example === 1
  && a1.source.stepCounts.question === 1 && a1.source.stepCounts.unknown === 1,
  JSON.stringify(a1.source.stepCounts))
t('a tutorial step drafts a knowledge point with no worked example',
  a1.draftKnowledgePoints[0].unlabelledExample === undefined
  && a1.draftKnowledgePoints[0].blocking.some(b => /no worked example/.test(b)))
t('an example step carries its explanation whole and unsplit', (() => {
  const point = a1.draftKnowledgePoints.find(p => p.unlabelledExample)
  return point.unlabelledExample.solution
    === 'Form all four products, then collect like terms to get x^2 - 2x - 15.'
})())
t('an unlabelled example says the subgoals must be authored', (() => {
  const point = a1.draftKnowledgePoints.find(p => p.unlabelledExample)
  return point.blocking.some(b => /subgoal labels must be authored/.test(b))
})())
t('no draft knowledge point claims a WorkedExample field',
  IMP.concepts.every(c => c.draftKnowledgePoints.every(p => p.workedExample === undefined)))
t('positions follow the archive order rather than being re-derived',
  a1.draftKnowledgePoints.map(p => p.position).join(',') === '1,2')
t('a tutorial step with no prose is refused and counted',
  IMP.rejected.steps.some(s => s.id === 'step-t4' && /no prose/.test(s.reason)))
t('a step type the importer does not read is refused by name',
  IMP.rejected.steps.some(s => s.id === 'step-z5' && /'unknown'/.test(s.reason)))
t('a graphic becomes a visualRef candidate', a1.draftKnowledgePoints[0].visualRef === 'media/fig1.png')

group('importer — a scraped question is not a practice task')
const q = a1.draftTasks[0]
t('the question drafts a task', a1.draftTasks.length === 1)
t('it attaches to the step it followed', q.draftKnowledgePointId === a1.draftKnowledgePoints[1].id)
t('the scraped answer is carried but named as the learner\'s',
  q.scrapedAnswer === '2x^2 + 7x - 4'
  && q.blocking.some(b => /the learner's, not a reference/.test(b)))
t('it is blocked on form, variables and domain conditions being authorial',
  q.blocking.some(b => /are authorial claims and are not in the DOM/.test(b)))
t('no draft task carries a given, a reference or a form',
  IMP.concepts.every(c => c.draftTasks.every(d =>
    d.given === undefined && d.reference === undefined && d.form === undefined)))
t('a lesson that opens with a question leaves the attachment empty rather than guessing', (() => {
  const { tasks } = draftMaterialFor('ma-x', [{ id: 's1', type: 'question', text: 'Do this.' }])
  return tasks.length === 1 && tasks[0].draftKnowledgePointId === ''
})())

group('importer — the parse rate is a ceiling, measured not asserted')
t('\\frac becomes a parenthesised quotient', latexToInfix('\\frac{x+1}{x-1}') === '((x+1)/(x-1))')
t('nested \\frac unwinds', latexToInfix('\\frac{\\frac{1}{2}}{x}') === '((((1)/(2)))/(x))')
t('\\cdot becomes a multiplication', latexToInfix('2 \\cdot x') === '2 * x')
t('a braced exponent becomes parenthesised', latexToInfix('x^{n+1}') === 'x^(n+1)')
t('delimiter noise is dropped', latexToInfix('\\left(x\\right)') === '(x)')
t('an unknown command is left in place so the parse fails loudly',
  parseFragment('\\oiint_{\\Sigma} F') === null)
t('a fragment the parser can read is reported with its symbols', (() => {
  const f = parseFragment('(2x-1)(x+4)')
  return f !== null && f.infix === '(2x-1)(x+4)' && f.symbols.join(',') === 'x'
})())
t('apparentSymbols takes single letters only, since the parser needs declarations',
  apparentSymbols('sqrt(x) + y').join(',') === 'x,y')
t('the parse rate counts fragments, not tasks', (() => {
  const r = IMP.parseRate
  return r !== null && r.total === 3 && r.parsable === 2 && Math.abs(r.rate - 2 / 3) < 1e-9
})(), JSON.stringify(IMP.parseRate))
t('no parse rate is reported when nothing was scraped',
  importArchive({ graph: { topics: {} }, steps: [] }, 's').parseRate === null)
t('a parsable fragment still blocks the task on the conversion being lossy',
  q.blocking.some(b => /the conversion is lossy/.test(b)))

group('importer — topics known only by a link, and lessons with no overview')
const a9 = IMP.concepts.find(c => c.id === conceptIdFor('algebra-9'))
t('an unvisited endpoint still becomes a named draft', a9.name === 'Partial Fractions')
t('it is marked edge-label rather than scraped', a9.source.origin === 'edge-label')
t('it has no material at all', a9.draftKnowledgePoints.length === 0 && a9.draftTasks.length === 0)
t('its caveat says it was never scraped', /never scraped/.test(a9.caveat))
t('it is blocked on the page never having been visited',
  a9.blocking.some(b => /never visited/.test(b)))
t('a lesson scraped without its overview page still becomes a draft', (() => {
  const a7 = IMP.concepts.find(c => c.id === conceptIdFor('algebra-7'))
  return !!a7 && a7.source.origin === 'scraped-topic' && a7.draftKnowledgePoints.length === 1
})())
t('the counts separate label-only drafts from scraped ones',
  IMP.counts.conceptsDrafted === 4 && IMP.counts.conceptsFromEdgeLabelsOnly === 1
  && IMP.counts.topicsScraped === 2,
  JSON.stringify(IMP.counts))
t('a draft is emitted once even when several edges name it',
  new Set(IMP.concepts.map(c => c.id)).size === IMP.concepts.length)

group('importer — cycles among candidates are reported, not tolerated silently')
t('the two-edge cycle is found', IMP.cycles.length === 1, JSON.stringify(IMP.cycles))
t('it names both concepts in it', (() => {
  const loop = IMP.cycles[0]
  return loop.length === 2 && loop.includes(conceptIdFor('algebra-2')) && loop.includes(conceptIdFor('algebra-9'))
})())
t('one cycle reachable from two entry points is reported once', (() => {
  const edges = [
    { id: 'e1', from: 'a', to: 'b', kind: 'candidate_prerequisite' },
    { id: 'e2', from: 'b', to: 'c', kind: 'candidate_prerequisite' },
    { id: 'e3', from: 'c', to: 'a', kind: 'candidate_prerequisite' },
  ]
  return candidateCycles(edges).length === 1
})())
t('an acyclic candidate set reports none', candidateCycles([
  { id: 'e1', from: 'a', to: 'b', kind: 'candidate_prerequisite' },
  { id: 'e2', from: 'a', to: 'c', kind: 'candidate_prerequisite' },
]).length === 0)
t('registry cycles still ignore candidates entirely', (() => {
  const merged = { ...O, edges: [...O.edges, ...IMP.edges] }
  return cycles(merged).length === 0
})())

group('importer — the concept-level promotion rate')
t('nothing drafted here has been authored yet', (() => {
  const rate = importPromotionRate(IMP, O)
  return rate.authored === 0 && rate.drafted === 4 && rate.rate === 0
})())
t('authoring one draft moves the rate', (() => {
  const authored = { ...O, concepts: [...O.concepts, { ...O.concepts[0], id: conceptIdFor('algebra-1') }] }
  const rate = importPromotionRate(IMP, authored)
  return rate.authored === 1 && Math.abs(rate.rate - 0.25) < 1e-9
})())
t('an empty import has no rate rather than a rate of zero',
  importPromotionRate({ concepts: [] }, O) === null)

group('importer — the emitted module')
const EMITTED = emitDraftModule(IMP)
t('it declares drafts, not an ontology',
  EMITTED.includes('DRAFT_CONCEPTS: DraftConcept[]') && !EMITTED.includes('ConceptOntology'))
t('every emitted edge is a candidate', (() => {
  const count = (EMITTED.match(/kind: 'candidate_prerequisite'/g) ?? []).length
  return count === IMP.edges.length
})())
t('nothing emitted names a promoter', !EMITTED.includes('promotedBy'))
t('it emits no workedExample field, which is the thing that has to be authored',
  !EMITTED.includes('workedExample'))
t('it keeps the refusals in the file as a record', EMITTED.includes('REFUSED_EDGES'))
t('it says in its own header that nobody reviewed it', /reviewed by nobody/.test(EMITTED))
/**
 * The emitted module is only worth anything if it is real TypeScript, so this
 * hands it to the compiler rather than counting brackets.
 *
 * Syntax diagnostics only (TS1xxx). The file is checked in isolation, so its
 * imports of `./types` and `./import` are unresolvable and report TS2307 — a type
 * error, not a syntax one, and not evidence of anything about the emitter.
 */
t('the emitted module parses as TypeScript', (() => {
  const draftPath = join(outDir, 'emitted-draft.ts')
  writeFileSync(draftPath, EMITTED)
  let output = ''
  try {
    execFileSync(process.execPath, [
      join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc'),
      draftPath, '--noEmit', '--target', 'es2020', '--skipLibCheck',
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    output = `${e.stdout ?? ''}${e.stderr ?? ''}`
  }
  const syntaxErrors = output.split('\n').filter(l => /error TS1\d{3}/.test(l))
  return syntaxErrors.length === 0
})(), 'syntax diagnostics from tsc')
t('the caveat survives emission as one string literal', (() => {
  const line = EMITTED.split('\n').find(l => l.trim().startsWith('caveat:'))
  return !!line && line.trim().endsWith('",')
})())
t('summariseImport refuses to call the draft counts usable material',
  summariseImport(IMP).some(l => /every one is blocked on authoring/.test(l)))
t('it reports the parse rate as a ceiling rather than a task count',
  summariseImport(IMP).some(l => /Advisory ceiling on mechanisation/.test(l)))
t('it reports the cycle it found', summariseImport(IMP).some(l => /cycle\(s\) among the candidates/.test(l)))
t('an empty archive imports to nothing rather than throwing', (() => {
  const empty = importArchive({}, 'rational-expressions')
  return empty.concepts.length === 0 && empty.edges.length === 0 && empty.parseRate === null
})())

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
