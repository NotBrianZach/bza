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
    join('lib', 'concepts', 'derive.ts'),
    join('lib', 'concepts', 'generators.ts'),
    join('lib', 'concepts', 'import.ts'),
    join('lib', 'concepts', 'numerals.ts'),
    join('lib', 'concepts', 'ontology-arithmetic.ts'),
    join('lib', 'concepts', 'ontology-exponentials.ts'),
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
    derive: require(join(outDir, 'concepts', 'derive.js')),
    generators: require(join(outDir, 'concepts', 'generators.js')),
    importer: require(join(outDir, 'concepts', 'import.js')),
    numerals: require(join(outDir, 'concepts', 'numerals.js')),
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
const {
  checkForm, checkDenominatorDegree, FORM_LABELS, ALL_NAMED_FORMS, DISCRIMINATING_FORMS,
} = M.forms
const {
  RATIONAL_EXPRESSIONS, EXPONENTS_AND_LOGARITHMS, ARITHMETIC_FOUNDATIONS,
  ONTOLOGIES, getOntology, ontologyForPoint, pointIdCollisions,
} = M.ontology
const {
  TASK_KINDS, TASK_KIND_LIST, isVerifiableKind, conceptById, allKnowledgePoints, knowledgePointById,
  conceptOfPoint, prerequisitesOf, dependentsOf, allPrerequisitesOf, roots, teachingOrder, cycles,
  encompassedBy, encompassedClosure, interferesWith, interferenceReason, candidates, promotionRate,
  conceptFacet, fidelityMismatches, ontologyProblems, edgesOfKind,
  pendingCandidates, rejectedCandidates, reviewStatus, isTeachable, gatingPrerequisitesOf,
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
const {
  isScorable, needsReview, rulingHeadline, verifierConfig,
  exactValue, substitute, showExact, ruleEvaluate, rule,
} = M.verify
const { agreeAtPoints } = M.numerals
const {
  signatureOf, sameShape, sameCoarseShape, isDiscriminating, properSubtrees, describeShape,
  shapedTasks, deriveEdges, deriveInterference, compareWithAuthored, asCandidateEdges,
  summariseDerivation,
} = M.derive
const {
  GENERATORS, generate, generateFrom, generatedTaskById, generatorById, generatorsForPoint,
  validateInstance, explain, rngFrom, variantSeedFor, taskIdFor, parseTaskId,
  polynomial, linear, fraction, sumOfFractions, factorFor, variantsForPoint,
} = M.generators

/** The instance ids a point would be served at a given scored-attempt count. */
const variantsForPointIds = (pointId, attempts) =>
  variantsForPoint(pointId, 1, attempts).map(task => task.id)
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

group('form: single_power')
const sp = s => checkForm(p(s), 'single_power', 'x')
t('one power holds', sp('x^8').held === true)
t('a bare symbol holds — x is x^1', sp('x').held === true)
t('a numeral holds — it is the combined value', sp('128').held === true)
t('a product of powers of ONE base is refused', sp('x^3 * x^5').held === false)
t('the message names the base still to be combined',
  /x/.test(sp('x^3 * x^5').detail))
t('a power of a power is refused', sp('(x^2)^4').held === false)
t('the power-of-a-power message says to multiply the exponents',
  /multiply the exponents/.test(sp('(x^2)^4').detail))
/**
 * The two cases a first draft got wrong, both caught by other tests before
 * these existed. `(x + 4)/(x + 1)^2` was ruled a single power because the
 * denominator is one — a form labelled "a single power" must not accept a
 * quotient that merely contains one.
 */
t('a quotient containing a power is refused', sp('(x + 4)/(x + 1)^2').held === false)
t('a sum is refused', sp('x^2 + x').held === false)
t('a product of powers of DIFFERENT bases is still not a single power',
  // `y` has to be declared — the parser refuses an undeclared symbol, which is
  // a security boundary rather than a convenience.
  checkForm(parseExpression('x^3 * y^2', ['x', 'y']), 'single_power', 'x').held === false)

group('form: no_negative_exponents')
const nn = s => checkForm(p(s), 'no_negative_exponents', 'x')
t('a reciprocal holds', nn('1/x^2').held === true)
t('a plain polynomial holds', nn('x^2 - 2x - 15').held === true)
t('a negative exponent is refused', nn('x^-2').held === false)
t('a negative exponent nested in a product is refused', nn('3 * x^-1').held === false)
t('a zero exponent is not negative', nn('x^0').held === true)
/**
 * The abstention that matters. `x^n` is not evidence the learner avoided a
 * negative exponent — it is evidence the checker cannot tell, and the header
 * of forms.ts forbids guessing in that position.
 */
t('a symbolic exponent abstains rather than passing', (() => {
  const r = checkForm(parseExpression('x^n', ['x', 'n']), 'no_negative_exponents', 'x')
  return r.held === null && /cannot tell/.test(r.detail)
})())

group('form: radical_free')
const rf = s => checkForm(p(s), 'radical_free', 'x')
t('a whole-number exponent holds', rf('x^2').held === true)
t('a fractional exponent is refused — it is a radical', rf('x^(1/2)').held === false)
t('a sqrt call is refused', rf('sqrt(x)').held === false)
t('a rational exponent that reduces to a whole number holds', rf('x^(4/2)').held === true)
t('a symbolic exponent abstains', (() => {
  const r = checkForm(parseExpression('x^n', ['x', 'n']), 'radical_free', 'x')
  return r.held === null
})())

group('the form registry is total over the union')
t('every form name has a checker and a label', () =>
  ALL_NAMED_FORMS.every(f => typeof FORM_LABELS[f] === 'string' && FORM_LABELS[f].length > 0))
t('the discriminating subset is smaller than the whole, and non-empty',
  DISCRIMINATING_FORMS.length > 0 && DISCRIMINATING_FORMS.length < ALL_NAMED_FORMS.length)
t('an unknown form abstains rather than throwing', (() => {
  // A stored task row written by a newer build could name a form this one has
  // dropped. Losing the learner's answer to an exception would be worse than
  // routing it to review.
  const r = checkForm(p('x^2'), 'a_form_that_was_removed', 'x')
  return r.held === null && /not a form this build/.test(r.detail)
})())

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
// Resolved across every shipped subject, not against one. TASKS is a single
// global pool and the second subject's tasks name points in the second subject —
// the assumption this test used to carry is the one that made the verify route
// 500 on them.
t('every task names a real knowledge point in some shipped subject',
  TASKS.every(task => !!ontologyForPoint(task.knowledgePointId)),
  TASKS.filter(task => !ontologyForPoint(task.knowledgePointId)).map(t2 => t2.id).join(', '))
/**
 * The pool is scoped to the subject being assembled.
 *
 * `TASKS` is one global array across every shipped subject, and `assemble`
 * used to take all of it. Observed in production: an
 * exponents-and-logarithms session walked all sixteen rational-expression
 * knowledge points and reported each as "names an unknown knowledge point" —
 * 24 of 25 entries in `skipped`, burying the real reasons the report exists
 * to surface.
 */
const POOL_NOW = '2026-10-14T12:00:00.000Z'
/**
 * Asserted as an invariant over task IDS, not by grepping for a message.
 *
 * The first version of this test looked for the string "unknown knowledge
 * point" in `skipped`. That was worthless: the same change that scoped the
 * pool also deleted the message, so the test could not fail for either the
 * right or the wrong reason. The durable claim is about WHICH tasks the report
 * is entitled to mention.
 */
t('the skip report only ever mentions tasks belonging to the subject assembled', (() => {
  for (const ontology of [O, EXPONENTS_AND_LOGARITHMS]) {
    const own = new Set(allKnowledgePoints(ontology).flatMap(p =>
      TASKS.filter(t2 => t2.knowledgePointId === p.id).map(t2 => t2.id)))
    const a = assemble({ ontology, strengths: {}, now: POOL_NOW, size: 12 })
    // Generated variants carry ids not in TASKS, so only authored ids are
    // checked — those are the ones that could have come from another subject.
    const authored = a.skipped.filter(s => TASKS.some(t2 => t2.id === s.taskId))
    if (!authored.every(s => own.has(s.taskId))) return false
  }
  return true
})(), JSON.stringify(
  assemble({ ontology: EXPONENTS_AND_LOGARITHMS, strengths: {}, now: POOL_NOW, size: 12 })
    .skipped.slice(0, 4)))

t('every task a subject assembles belongs to that subject', (() => {
  for (const ontology of [O, EXPONENTS_AND_LOGARITHMS]) {
    const points = new Set(allKnowledgePoints(ontology).map(p => p.id))
    const a = assemble({ ontology, strengths: {}, now: POOL_NOW, size: 20, variantSeed: 1 })
    if (!a.tasks.every(t2 => points.has(t2.knowledgePointId))) return false
  }
  return true
})())

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
/**
 * Claims. The safety argument is entirely in these four assertions.
 *
 * A claim is a request to be tested: it opens its OWN concept and nothing else.
 * If any of these fail, claiming has become a way to skip the gate rather than
 * a way to be tested early, and the ordering guarantee is gone.
 */
/**
 * Mapped vs teachable — the rule that lets the ontology become a MAP.
 *
 * A concept with no knowledge points can never gain strength (`conceptStrength`
 * averages over zero points and returns 0), so if it could gate it would gate
 * forever and everything behind it on the map would be permanently
 * unreachable. One unwritten node in the middle of a chain would wall off the
 * entire tail.
 *
 * So gating passes THROUGH an unteachable concept to its own prerequisites.
 * These tests pin that, and pin that it tightens rather than loosens as
 * material gets written.
 */
group('the map: a concept with no material cannot gate')

/** A synthetic three-chain: root → middle → leaf, with `middle` unwritten. */
const mapOntology = (() => {
  const base = conceptById(O, 'polynomial-arithmetic')
  const mk = (id, points) => ({
    id, name: id, subjectId: 'map-test',
    scope: base.scope, fidelity: base.fidelity,
    objectives: [], knowledgePoints: points,
  })
  // The root reuses real knowledge points so it can actually be made strong.
  return {
    subject: { id: 'map-test', name: 'Map test', covers: 'x', medium: 'theorem' },
    concepts: [
      mk('root', base.knowledgePoints),
      mk('middle', []),                       // mapped, not teachable
      mk('leaf', base.knowledgePoints.slice(0, 1)),
    ],
    edges: [
      { id: 'e1', from: 'root', to: 'middle', kind: 'prerequisite' },
      { id: 'e2', from: 'middle', to: 'leaf', kind: 'prerequisite' },
    ],
  }
})()

t('a concept with no knowledge points is not teachable',
  !isTeachable(mapOntology, 'middle') && isTeachable(mapOntology, 'root'))

t('gating looks THROUGH an unteachable concept to its own prerequisites', (() => {
  // The literal edge says leaf rests on middle. Gating must say it rests on
  // root, because middle can never be demonstrated.
  const literal = prerequisitesOf(mapOntology, 'leaf')
  const gating = gatingPrerequisitesOf(mapOntology, 'leaf')
  return literal.join() === 'middle' && gating.join() === 'root'
})())

t('so the tail of the chain is reachable rather than walled off forever', (() => {
  // With the old rule (gate on the literal edge) `leaf` could NEVER open,
  // because middle's strength is pinned at 0 by having no points.
  const strong = {}
  for (const point of conceptById(O, 'polynomial-arithmetic').knowledgePoints) {
    strong[point.id] = {
      ...emptyStrength(point.id), strength: 1, streak: 5, unaidedSuccesses: 5,
      lastDemonstratedAt: NOW,
    }
  }
  return introducible(mapOntology, strong, 'leaf', NOW)
})())

t('…and is still gated: a weak root keeps the tail shut',
  !introducible(mapOntology, {}, 'leaf', NOW))

t('an unteachable concept is legal, but one promising practice is not', (() => {
  const mapped = { ...mapOntology }
  if (ontologyProblems(mapped).some(p => /no knowledge points/.test(p))) return false
  // Give the unwritten concept an objective: now it claims practice it can
  // never serve, which must be reported.
  const promising = {
    ...mapOntology,
    concepts: mapOntology.concepts.map(c => c.id === 'middle'
      ? { ...c, objectives: [{ id: 'o1', statement: 'x', taskKinds: ['evaluate'] }] }
      : c),
  }
  return ontologyProblems(promising).some(p => /promises practice/.test(p))
})())

group('scheduling — a claim opens its own concept and nothing else')
t('claiming a blocked concept makes it introducible', (() => {
  const claimed = new Set(['factoring-quadratics'])
  return !introducible(O, {}, 'factoring-quadratics', NOW)
    && introducible(O, {}, 'factoring-quadratics', NOW, claimed)
})())

t('a claim does NOT satisfy that concept as somebody else\'s prerequisite', (() => {
  // THE central property. Claiming factoring must not open the things that
  // rest on factoring — that would serve partial fractions to somebody who
  // cannot factor, which is the exact failure the ordering prevents.
  const claimed = new Set(['factoring-quadratics'])
  const dependents = O.concepts.filter(c =>
    prerequisitesOf(O, c.id).includes('factoring-quadratics'))
  if (dependents.length === 0) return false   // fixture precondition
  return dependents.every(c => !introducible(O, {}, c.id, NOW, claimed))
})(), O.concepts.filter(c => prerequisitesOf(O, c.id).includes('factoring-quadratics'))
  .map(c => c.id).join(', '))

t('a claim writes no strength and counts as no demonstration', (() => {
  // `summarise` reports it as introducible AND claimed, but `strongConcepts`
  // counts strength — so a claim must not move that number at all.
  const bare = summarise(O, {}, NOW)
  const withClaim = summarise(O, {}, NOW, new Set(['factoring-quadratics']))
  const c = withClaim.concepts.find(x => x.conceptId === 'factoring-quadratics')
  return withClaim.strongConcepts === bare.strongConcepts
    && withClaim.demonstrated === bare.demonstrated
    && c.introducible === true
    && c.claimed === true
})())

t('assemble serves a claimed concept\'s tasks, and still blocks its dependents', (() => {
  const a = assemble({
    ontology: O, strengths: {}, now: NOW, size: 20,
    claimed: new Set(['factoring-quadratics']),
  })
  const points = new Set(conceptById(O, 'factoring-quadratics').knowledgePoints.map(p => p.id))
  const served = a.tasks.some(t2 => points.has(t2.knowledgePointId))
  const dependents = O.concepts
    .filter(c => prerequisitesOf(O, c.id).includes('factoring-quadratics'))
    .map(c => c.id)
  const stillBlocked = dependents.every(id => a.blocked.some(b => b.conceptId === id))
  return served && stillBlocked
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
// The evaluate ruler
// ---------------------------------------------------------------------------

/** No worker is reachable from a unit test, which is exactly the point below. */
const NO_WORKER = { url: null, token: null, timeoutMs: 1000 }
const val = s => exactValue(p(s))
const show = s => { const v = val(s); return v === null ? null : showExact(v) }

group('exactValue — exact, or honestly absent')
t('an integer', show('7') === '7')
t('a quotient reduces', show('4/6') === '2/3')
t('a decimal is the fraction it literally is', show('1.5') === '3/2')
t('a decimal and a quotient agree', show('0.25') === show('1/4'))
t('a negative', show('-1/8') === '-1/8')
t('a sum', show('9 + 6 - 15') === '0')
t('a product with a negative factor', show('4*(0 - 15)') === '-60')
t('an integer power of a negative base', show('(0 - 2)^2') === '4')
t('a negative exponent inverts', show('2^(0 - 2)') === '1/4')
t('nested arithmetic', show('(4 + 6 + 5)/3') === '5')
t('a symbol has no rational value', exactValue({ kind: 'symbol', name: 'x' }) === null)
t('pi has no rational value', exactValue({ kind: 'constant', name: 'pi' }) === null)
t('a function call has no rational value', val('sqrt(4)') === null)
t('division by zero is not a value, rather than a crash', val('1/(3 - 3)') === null)
t('an exact fractional exponent is computed', show('4^(1/2)') === '2')
t('an inexact one is still refused', val('2^(1/2)') === null)
t('an even root of a negative is not a real number', val('(0 - 4)^(1/2)') === null)
t('an odd root of a negative keeps its sign', show('(0 - 8)^(1/3)') === '-2')
t('an absurd exponent is refused rather than computed', val('2^999') === null)

group('substitute — tree surgery, not computation')
t('it replaces a declared symbol', renderExpr(substitute(p('x + 1'), { x: p('5') })) === renderExpr(p('5 + 1')))
t('it leaves a symbol the table does not mention', (() => {
  const out = substitute(parseExpression('x + y', ['x', 'y']), { x: p('2') })
  return symbolsIn(out).join(',') === 'y'
})())
t('it does not fold anything', renderExpr(substitute(p('x + 1'), { x: p('5') })) !== '6')
t('it reaches into a quotient', exactValue(substitute(p('1/(x - 5)'), { x: p('-3') })).n === -1n)
t('it reaches into a power', showExact(exactValue(substitute(p('x^2'), { x: p('-3') }))) === '9')

group('ruleEvaluate — settled locally, and exactly')
const evalTask = (over = {}) => ({
  id: 'ev', knowledgePointId: 'excluded-points', kind: 'evaluate',
  prompt: 'Evaluate.', given: 'x^2 - 2*x - 15',
  variables: [{ name: 'x', assumptions: { real: true } }],
  at: { x: '5' }, reference: '0', ...over,
})
const ruled = async (over, answer) => ruleEvaluate(evalTask(over), answer, NO_WORKER)

t('a correct answer is correct with no worker at all', (await ruled({}, '0')).verdict.ruling === 'correct')
t('and says how it was decided', /exact rational comparison at x = 5/.test((await ruled({}, '0')).verdict.method))
t('a wrong answer is incorrect, NOT inconclusive', (await ruled({}, '3')).verdict.ruling === 'incorrect')
const wrong = await ruled({}, '3')
t('it names the value and what was submitted',
  /the value at x = 5 is 0, and this is 3/.test(wrong.verdict.brokeAt.detail))
t('it broke at step 2', wrong.verdict.brokeAt.step === 2)
t('a truncated decimal is not the exact value and is marked wrong',
  (await ruleEvaluate(evalTask({ at: { x: '1' }, reference: '2/3', given: '(x + 3)/(x + 5)' }), '0.666', NO_WORKER))
    .verdict.ruling === 'incorrect')
t('a decimal that IS exact is accepted',
  (await ruleEvaluate(evalTask({ at: { x: '1' }, reference: '3/2', given: '(x + 2)/(x + 1)' }), '1.5', NO_WORKER))
    .verdict.ruling === 'correct')
t('an unreadable answer is not a ruling', (await ruled({}, '0 +')).status === 'unreadable')
const stillSymbolic = await ruled({}, 'x - 5')
t('an answer that is still an expression breaks at step 1', stillSymbolic.verdict.brokeAt.step === 1)
t('and is told it asked for a value', /asks for a value, and this still mentions x/.test(stillSymbolic.verdict.brokeAt.detail))
t('a step-1 failure never reaches the worker', stillSymbolic.verdict.ruling === 'incorrect')

group('ruleEvaluate — it checks the author, not just the learner')
const badRef = await ruleEvaluate(evalTask({ reference: '1' }), '0', NO_WORKER)
t('a reference that disagrees with the given is an authoring fault', badRef.verdict.ruling === 'inconclusive')
t('and blames the author explicitly', /authoring fault, not yours/.test(badRef.verdict.method))
t('and shows both numbers', /claims the answer is 1, but its own expression at its own inputs is 0/.test(badRef.verdict.method))
t('an authoring fault is never scored', !isScorable(badRef.verdict))
t('a task with no inputs is an authoring fault',
  (await ruleEvaluate(evalTask({ at: {} }), '0', NO_WORKER)).verdict.ruling === 'inconclusive')
const badAt = await ruleEvaluate(evalTask({ at: { x: 'pi' } }), '0', NO_WORKER)
t('a non-numeral input is refused as an authoring fault',
  badAt.verdict.ruling === 'inconclusive' && /not an exact numeral/.test(badAt.verdict.method))
const uncovered = await ruleEvaluate(
  evalTask({ given: 'x + y', variables: [{ name: 'x' }, { name: 'y' }], at: { x: '1' }, reference: '2' }),
  '2', NO_WORKER)
t('a symbol with no stated input is an authoring fault',
  uncovered.verdict.ruling === 'inconclusive' && /which the task's inputs do not give a value/.test(uncovered.verdict.method))
t('an unparseable given is an authoring fault',
  (await ruleEvaluate(evalTask({ given: 'x +' }), '0', NO_WORKER)).verdict.ruling === 'inconclusive')

group('ruleEvaluate — the non-rational fallback needs the worker and says so')
const irrational = await ruleEvaluate(
  evalTask({ given: 'x^2', at: { x: '2' }, reference: '4' }), 'sqrt(16)', NO_WORKER)
t('an answer with no rational value is inconclusive when no worker is configured',
  irrational.verdict.ruling === 'inconclusive')
t('and names why it needed one', /no exact rational value/.test(irrational.verdict.method))
t('an unconfigured inconclusive is not queued for human review', !needsReview(irrational.verdict))

group('rule — dispatch by kind')
t('it routes transform_to_form', (await rule(taskById('expand-binomials-1'), '(', NO_WORKER)).status === 'unreadable')
t('it routes evaluate', (await rule(taskById('excluded-points-1'), '0', NO_WORKER)).verdict.ruling === 'correct')
const unruled = await rule({ ...taskById('excluded-points-1'), kind: 'justify' }, 'because', NO_WORKER)
t('an unimplemented kind comes back unruled', unruled.status === 'unruled')
t('and says which kind', /kind "justify" has no verifier/.test(unruled.reason))

group('the shipped evaluate tasks')
const EVALS = TASKS.filter(task => task.kind === 'evaluate')
// Twenty-eight: thirteen across the two algebra subjects, plus one per
// knowledge point in arithmetic-foundations, which is `evaluate`-only.
t('there are twenty-eight across the three subjects', EVALS.length === 28, `${EVALS.length}`)
t('they cover the six knowledge points that had no task at all', (() => {
  const previouslyBare = [
    'irreducible-quadratic', 'improper-first', 'excluded-points',
    'cancelling-keeps-the-hole', 'terms-are-not-factors', 'why-substitution-is-legal',
  ]
  return previouslyBare.every(id => tasksForPoint(id).length > 0)
})())
t('every one states its inputs', EVALS.every(task => task.at && Object.keys(task.at).length > 0))
t('every input is an exact numeral', EVALS.every(task =>
  Object.values(task.at).every(raw => {
    const parsedAt = tryParse(raw, [])
    return parsedAt.ok && exactValue(parsedAt.tree) !== null
  })))
t('every symbol in the given has a stated input', EVALS.every(task => {
  const tree = parseExpression(task.given, task.variables.map(v => v.name))
  return symbolsIn(tree).every(s => s in task.at)
}))
t('no evaluate task declares a form — that is a transform claim',
  EVALS.every(task => task.form === undefined))
/**
 * The load-bearing one. Each task's reference is re-derived from its own `given`
 * at its own `at`, so a typo in an authored answer fails here rather than marking
 * a correct learner wrong in production.
 *
 * Tasks whose value is not rational are skipped and counted, not silently passed.
 * `9^(1/2)` is a legitimate evaluate task that `exactValue` cannot settle, so it
 * is author-vouched and worker-ruled instead of locally proven — a real boundary,
 * and the `skipped` assertion below keeps it from widening unnoticed.
 */
const reDerive = task => {
  const symbols = task.variables.map(v => v.name)
  const at = {}
  for (const [name, raw] of Object.entries(task.at)) at[name] = parseExpression(raw, [])
  const truth = exactValue(substitute(parseExpression(task.given, symbols), at))
  const claimed = exactValue(parseExpression(task.reference, symbols))
  if (truth === null || claimed === null) return 'skip'
  return showExact(truth) === showExact(claimed) ? 'ok' : `${task.id}: ${showExact(truth)} vs ${showExact(claimed)}`
}
t('every rationally-valued reference equals its given at the stated inputs',
  EVALS.map(reDerive).every(r => r === 'ok' || r === 'skip'),
  EVALS.map(reDerive).filter(r => r !== 'ok' && r !== 'skip').join('; '))
t('every evaluate task is now locally verifiable — exact roots closed the gap',
  EVALS.filter(task => reDerive(task) === 'skip').length === 0,
  EVALS.filter(task => reDerive(task) === 'skip').map(task => task.id).join(','))
t('the superseded whole-set check still holds for the first subject', (() => {
  const bad = []
  for (const task of EVALS.filter(x => reDerive(x) !== 'skip')) {
    const symbols = task.variables.map(v => v.name)
    const at = {}
    for (const [name, raw] of Object.entries(task.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(task.given, symbols), at))
    const claimed = exactValue(parseExpression(task.reference, symbols))
    if (!truth || !claimed || showExact(truth) !== showExact(claimed)) {
      bad.push(`${task.id}: given=${truth ? showExact(truth) : 'null'} reference=${claimed ? showExact(claimed) : 'null'}`)
    }
  }
  return bad.length === 0
})(), (() => {
  const bad = []
  for (const task of EVALS.filter(x => reDerive(x) !== 'skip')) {
    const symbols = task.variables.map(v => v.name)
    const at = {}
    for (const [name, raw] of Object.entries(task.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(task.given, symbols), at))
    const claimed = exactValue(parseExpression(task.reference, symbols))
    if (!truth || !claimed || showExact(truth) !== showExact(claimed)) {
      bad.push(`${task.id}: given=${truth ? showExact(truth) : 'null'} reference=${claimed ? showExact(claimed) : 'null'}`)
    }
  }
  return bad.join('; ')
})())
/**
 * Split by whether the value is rational, which is the local/worker boundary.
 * `root-as-exponent-1` asks for 9^(1/2): `exactValue` refuses a fractional
 * exponent, so that one genuinely needs the worker and rules inconclusive here.
 * Asserting it separately keeps the boundary visible instead of weakening the
 * whole group to accommodate one task.
 */
const localEvals = EVALS.filter(task =>
  Object.values(task.at).every(raw => {
    const r = tryParse(raw, [])
    return r.ok && exactValue(r.tree) !== null
  }) && exactValue(parseExpression(task.reference, task.variables.map(v => v.name))) !== null
  && exactValue(substitute(
    parseExpression(task.given, task.variables.map(v => v.name)),
    Object.fromEntries(Object.entries(task.at).map(([k, v]) => [k, parseExpression(v, [])])),
  )) !== null)
const selfRulings = await Promise.all(localEvals.map(task => ruleEvaluate(task, task.reference, NO_WORKER)))
t('every rationally-valued evaluate task rules its own reference correct with no worker',
  selfRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  selfRulings.map((r, i) => `${localEvals[i].id}:${r.status === 'ruled' ? r.verdict.ruling : r.status}`).join(', '))
t('most of them are rationally valued', localEvals.length >= EVALS.length - 2,
  `${localEvals.length} of ${EVALS.length}`)
t('the one that is not needs the worker and says so, rather than guessing', (() => {
  const needsWorker = EVALS.filter(task => !localEvals.includes(task))
  return needsWorker.length === 0 || needsWorker.every(task => task.id === 'root-as-exponent-1')
})(), EVALS.filter(task => !localEvals.includes(task)).map(t2 => t2.id).join(', '))

group('coverage across both shipped subjects')
t('every rational-expressions knowledge point has at least one task', (() => {
  const missing = allKnowledgePoints(O).filter(point => tasksForPoint(point.id).length === 0)
  return missing.length === 0
})(), allKnowledgePoints(O).filter(point => tasksForPoint(point.id).length === 0).map(p => p.id).join(', '))
/**
 * The second subject is deliberately partial — but no longer for the original
 * reason. It used to be that `NamedForm` carried only rational-expression
 * forms, so nothing there could be asked for as a form at all. The union is
 * now open and the subject ships four `transform_to_form` tasks.
 *
 * It is still partial because only some points have a task a ruler can settle,
 * and a knowledge point with a worked example and no task is permitted. Faking
 * one would be the failure tasks.ts warns about.
 */
t('the second subject has tasks on some points and not all, which is honest', (() => {
  const points = allKnowledgePoints(EXPONENTS_AND_LOGARITHMS)
  const withTasks = points.filter(point => tasksForPoint(point.id).length > 0)
  return withTasks.length > 0 && withTasks.length < points.length
})(), `${allKnowledgePoints(EXPONENTS_AND_LOGARITHMS).filter(p => tasksForPoint(p.id).length > 0).length} of ${allKnowledgePoints(EXPONENTS_AND_LOGARITHMS).length}`)
/**
 * This test used to assert the OPPOSITE — that the second subject shipped no
 * `transform_to_form` task "because it has no form to ask for". That was a
 * test pinning a schema defect in place, which is the right thing to do while
 * the defect stands and the wrong thing to leave once it is fixed. It is
 * inverted rather than deleted, so the history of the claim stays visible.
 */
t('the second subject can now ask for a form, using forms that are not rational-expression forms', (() => {
  const forms = allKnowledgePoints(EXPONENTS_AND_LOGARITHMS)
    .flatMap(point => tasksForPoint(point.id))
    .filter(task => task.kind === 'transform_to_form')
    .map(task => task.form)
  if (forms.length === 0) return false
  const rationalOnly = ['partial_fractions', 'single_fraction', 'factored', 'expanded']
  // The point is not merely that it asks for A form — it is that the forms it
  // needs are ones the original closed union did not contain.
  return forms.every(f => f && !rationalOnly.includes(f))
})(), allKnowledgePoints(EXPONENTS_AND_LOGARITHMS)
  .flatMap(p => tasksForPoint(p.id))
  .filter(t => t.kind === 'transform_to_form')
  .map(t => t.form).join(', '))

t('every form a task asks for has a checker — the registry is total over the union', (() => {
  // The invariant the Record<NamedForm, FormSpec> type buys at compile time,
  // asserted at runtime too because a task's `form` can also arrive from a
  // stored row written by an older build.
  const asked = [...new Set(TASKS.filter(t => t.form).map(t => t.form))]
  return asked.length > 0 && asked.every(f => ALL_NAMED_FORMS.includes(f))
})())

t('an absence form is askable but kept out of the shape signature', () =>
  // no_negative_exponents is satisfied by nearly every expression, so it is a
  // useful demand and useless as a signature dimension. Both halves asserted:
  // it must exist as a form, and must not be discriminating.
  ALL_NAMED_FORMS.includes('no_negative_exponents')
  && !DISCRIMINATING_FORMS.includes('no_negative_exponents')
  && DISCRIMINATING_FORMS.includes('factored'))
t('every task kind shipped is one the dispatcher implements', (() => {
  const implemented = new Set(['transform_to_form', 'evaluate', 'counterexample'])
  return TASKS.every(task => implemented.has(task.kind))
})(), [...new Set(TASKS.map(t2 => t2.kind))].join(', '))

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

group('rendering restricted infix')
t('a polynomial omits unit coefficients', polynomial([1, -2, -15]) === 'x^2 - 2x - 15')
t('it folds signs onto the operator', polynomial([2, 7, -4]) === '2x^2 + 7x - 4')
t('it drops zero terms', polynomial([1, 0, -25]) === 'x^2 - 25')
t('a leading negative has no operator', polynomial([-6, 24]) === '-6x + 24')
t('an all-zero polynomial is 0', polynomial([0, 0]) === '0')
t('a linear factor from its root', factorFor(5) === '(x - 5)' && factorFor(-3) === '(x + 3)')
t('a fraction reduces', fraction(4, 6) === '2/3')
t('a fraction normalises the sign onto the front', fraction(1, -8) === '-1/8')
t('an integral fraction loses its denominator', fraction(10, 5) === '2')
t('a sum of fractions puts the sign on the operator',
  sumOfFractions([{ numerator: -3, denominator: '(x + 1)' }, { numerator: -3, denominator: '(x - 9)' }])
  === '-3/(x + 1) - 3/(x - 9)')
t('a positive second term still gets a plus',
  sumOfFractions([{ numerator: 1, denominator: '(x - 2)' }, { numerator: 5, denominator: '(x - 2)^2' }])
  === '1/(x - 2) + 5/(x - 2)^2')
t('everything rendered parses back', [
  polynomial([1, -2, -15]), polynomial([2, 7, -4]), polynomial([-6, 24]),
  sumOfFractions([{ numerator: -3, denominator: '(x + 1)' }, { numerator: -2, denominator: '(x - 9)' }]),
].every(s => tryParse(s, X).ok))

group('the generator PRNG is deterministic and unbiased')
t('the same seed gives the same draw', (() => {
  const a = rngFrom(1234), b = rngFrom(1234)
  return [0, 1, 2, 3, 4].every(() => a.int(1, 100) === b.int(1, 100))
})())
t('different seeds give different draws', rngFrom(1).int(1, 1000) !== rngFrom(2).int(1, 1000))
t('nonZero is never zero', (() => {
  for (let s = 0; s < 500; s += 1) if (rngFrom(s).nonZero(1, 5) === 0) return false
  return true
})())
t('nonZero takes both signs roughly evenly', (() => {
  let neg = 0
  for (let s = 0; s < 2000; s += 1) if (rngFrom(s).nonZero(1, 5) < 0) neg += 1
  return neg > 850 && neg < 1150
})(), 'a biased sign would make every instance look alike')
t('variantSeedFor separates points', variantSeedFor(1, 'a', 0) !== variantSeedFor(1, 'b', 0))
t('variantSeedFor separates attempts — this is what makes a re-attempt different',
  variantSeedFor(1, 'factor-monic', 0) !== variantSeedFor(1, 'factor-monic', 1))
t('variantSeedFor is stable across calls',
  variantSeedFor(1, 'factor-monic', 3) === variantSeedFor(1, 'factor-monic', 3))

group('agreeAtPoints — a proof for bounded degree, not a spot check')
t('two spellings of the same quadratic agree',
  agreeAtPoints(p('x^2 - 2x - 15'), p('(x + 3)(x - 5)'), 'x').agree)
t('a sign error is caught', !agreeAtPoints(p('x^2 - 2x - 15'), p('x^2 + 2x - 15'), 'x').agree)
t('and it names where', agreeAtPoints(p('x^2 + 1'), p('x^2 + 2'), 'x').disagreedAt !== undefined)
t('the inverse pair agrees',
  agreeAtPoints(p('1/(x + 3) + 2/(x - 5)'), p('(3x + 1)/((x + 3)(x - 5))'), 'x').agree)
t('poles are skipped rather than failed', (() => {
  const r = agreeAtPoints(p('1/(x - 2)'), p('1/(x - 2)'), 'x')
  return r.agree && r.skipped >= 1
})())
t('too few usable points refuses rather than passing',
  !agreeAtPoints(p('1/(x - 2)'), p('1/(x - 2)'), 'x', 100).agree)

/**
 * The load-bearing test for this whole feature. Every generator, swept across
 * many seeds: an instance is either declined by the generator or passes every
 * check in validateInstance. A formatting bug in `polynomial`, a sign error in a
 * construction, or a degenerate draw that slipped through all surface here
 * rather than in front of a learner.
 */
group('every generator, swept')
const SWEEP = 250
for (const g of GENERATORS) {
  let valid = 0
  let declined = 0
  const invalid = []
  for (let s = 0; s < SWEEP; s += 1) {
    const task = generate(g.id, s)
    if (task) { valid += 1; continue }
    const why = explain(g.id, s)
    if (why.length === 1 && /degenerate/.test(why[0])) declined += 1
    else invalid.push(`seed ${s}: ${why.join('; ')}`)
  }
  t(`${g.id} produces only valid instances`, invalid.length === 0, invalid.slice(0, 2).join(' | '))
  t(`${g.id} produces some instances`, valid > SWEEP / 4, `only ${valid} of ${SWEEP}`)
  void declined
}

group('generated instances are reconstructible from their id alone')
t('an id round-trips', (() => {
  const parsed = parseTaskId(taskIdFor('gen-factor-monic', 42))
  return parsed.generatorId === 'gen-factor-monic' && parsed.seed === 42
})())
t('an authored id is not mistaken for a generated one', parseTaskId('factor-monic-1') === null)
t('a generated id contains an @ and no authored id does',
  GENERATORS.every(g => taskIdFor(g.id, 1).includes('@')) && TASKS.every(task => !task.id.includes('@')))
t('rebuilding from the id gives a byte-identical task', (() => {
  for (const g of GENERATORS) {
    const first = generateFrom(g.id, 9000)
    if (!first) return false
    const again = generatedTaskById(first.id)
    if (JSON.stringify(again) !== JSON.stringify(first)) return false
  }
  return true
})(), 'the verify route depends on this')
t('taskById resolves a generated id', (() => {
  const made = generateFrom('gen-factor-monic', 77)
  return taskById(made.id)?.given === made.given
})())
t('taskById still resolves an authored id', taskById('factor-monic-1')?.given === 'x^2 - 2x - 15')
t('an unknown generator resolves to nothing', generatedTaskById('gen-nope@1') === null)
t('a malformed seed resolves to nothing', generatedTaskById('gen-factor-monic@notanumber') === null)
t('generate does not silently walk to another seed — the id must mean one instance', (() => {
  // Find a seed the generator declines, and confirm generate() returns null for it
  // rather than quietly producing the next valid draw.
  for (let s = 0; s < 400; s += 1) {
    if (generate('gen-factor-monic', s) === null) return generate('gen-factor-monic', s) === null
  }
  return false
})())
t('generateFrom reports the seed it landed on, inside the id', (() => {
  const made = generateFrom('gen-factor-monic', 0)
  const parsed = parseTaskId(made.id)
  return generate(parsed.generatorId, parsed.seed) !== null
})())

group('generated instances satisfy every invariant the authored ones do')
const SAMPLE = GENERATORS.map(g => generateFrom(g.id, 31337)).filter(Boolean)
t('one instance per generator was produced', SAMPLE.length === GENERATORS.length)
t('every one names a real knowledge point',
  SAMPLE.every(task => !!knowledgePointById(O, task.knowledgePointId)))
t('every one declares its symbols', SAMPLE.every(task => task.variables.length > 0))
t('every given parses under its own declarations',
  SAMPLE.every(task => tryParse(task.given, task.variables.map(v => v.name)).ok))
t('every reference parses under its own declarations',
  SAMPLE.every(task => tryParse(task.reference, task.variables.map(v => v.name)).ok))
t('every reference satisfies its own demanded shape',
  SAMPLE.filter(task => task.form && shapeHolds(task, task.reference) !== true).length === 0,
  SAMPLE.filter(task => task.form && shapeHolds(task, task.reference) !== true).map(t2 => t2.id).join(', '))
t('no given already has the shape it asks for',
  SAMPLE.filter(task => task.form && shapeHolds(task, task.given) === true).length === 0,
  SAMPLE.filter(task => task.form && shapeHolds(task, task.given) === true).map(t2 => t2.id).join(', '))
t('only verifiable kinds are generated', SAMPLE.every(task => isVerifiableKind(task.kind)))
t('every generated id is unique', new Set(SAMPLE.map(task => task.id)).size === SAMPLE.length)
t('no generated id collides with an authored one', (() => {
  const authored = new Set(TASKS.map(task => task.id))
  return SAMPLE.every(task => !authored.has(task.id))
})())

group('a generated evaluate instance is ruled correctly, with no worker')
const GEN_EVALS = SAMPLE.filter(task => task.kind === 'evaluate')
t('there are some', GEN_EVALS.length >= 3, `${GEN_EVALS.length}`)
const genRulings = await Promise.all(GEN_EVALS.map(task => ruleEvaluate(task, task.reference, NO_WORKER)))
t('each rules its own reference correct',
  genRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  genRulings.map((r, i) => `${GEN_EVALS[i].id}:${r.status === 'ruled' ? r.verdict.ruling : r.status}`).join(', '))
t('a wrong answer to a generated instance is incorrect, not inconclusive',
  (await ruleEvaluate(GEN_EVALS[0], '999999', NO_WORKER)).verdict.ruling === 'incorrect')
t('no generated evaluate instance is an authoring fault — the re-derivation agrees',
  genRulings.every(r => r.verdict.ruling !== 'inconclusive'))

group('the scheduler serves variants only when asked')
const freshTable = {}
t('without a variant seed the set is authored-only', (() => {
  const a = assemble({ ontology: O, strengths: freshTable, now: NOW, size: 20 })
  return a.tasks.length > 0 && a.tasks.every(task => !task.id.includes('@'))
})())
t('with a variant seed, generated instances appear', (() => {
  const a = assemble({ ontology: O, strengths: freshTable, now: NOW, size: 20, variantSeed: 1 })
  return a.tasks.some(task => task.id.includes('@'))
})())
t('the same history gives the same set, so an instance can be rebuilt from a report', (() => {
  const a = assemble({ ontology: O, strengths: freshTable, now: NOW, size: 20, variantSeed: 1 })
  const b = assemble({ ontology: O, strengths: freshTable, now: NOW, size: 20, variantSeed: 1 })
  return JSON.stringify(a.tasks.map(x => x.id)) === JSON.stringify(b.tasks.map(x => x.id))
})())
/**
 * SPEC-LEARNING §7, made executable: a learner who has attempted a point gets a
 * different instance of the same objective next time, not the same numbers.
 */
t('a scored attempt changes the instance for that point', (() => {
  const before = variantsForPointIds('expand-binomials', 0)
  const after = variantsForPointIds('expand-binomials', 1)
  return before.length > 0 && after.length > 0 && before.join() !== after.join()
})())
t('and the problem text actually differs, not just the id', (() => {
  const a = generateFrom('gen-expand-binomials', variantSeedFor(1, 'expand-binomials', 0))
  const b = generateFrom('gen-expand-binomials', variantSeedFor(1, 'expand-binomials', 1))
  return a.given !== b.given
})())
t('an unchanged attempt count serves the same instance, so an inconclusive ruling does not discard the work',
  variantsForPointIds('expand-binomials', 2).join() === variantsForPointIds('expand-binomials', 2).join())

group('every knowledge point with a generator keeps its coverage')
t('each generator names a knowledge point that exists',
  GENERATORS.every(g => !!knowledgePointById(O, g.knowledgePointId)))
t('generatorsForPoint finds them',
  GENERATORS.every(g => generatorsForPoint(g.knowledgePointId).some(x => x.id === g.id)))
t('no two generators share an id', new Set(GENERATORS.map(g => g.id)).size === GENERATORS.length)
t('every generator says what varies', GENERATORS.every(g => g.varies.length > 10))
t('validateInstance refuses an instance whose reference is wrong', (() => {
  const broken = { ...taskById('factor-monic-1'), reference: '(x + 3)(x - 6)' }
  return validateInstance(broken, 2).some(s => /differ at/.test(s))
})())
t('validateInstance refuses a task that asks for nothing', (() => {
  const trivial = {
    id: 'x', knowledgePointId: 'factor-monic', kind: 'transform_to_form',
    prompt: '', given: '(x + 3)(x - 5)', reference: '(x + 3)(x - 5)',
    form: 'factored', variables: [{ name: 'x' }],
  }
  return validateInstance(trivial, 2).some(s => /asks for nothing|same string/.test(s))
})())
/**
 * The cross-check, and the one place the generator gate and the authored set
 * legitimately disagree.
 *
 * `validateInstance` refuses anything it cannot *prove*, which is right for a
 * generator — never serve a machine-made problem whose answer you have not
 * verified. An author is allowed to assert what the local arithmetic cannot
 * settle: `root-as-exponent-1` asks for 9^(1/2), which has no rational value
 * here and is ruled by the worker instead.
 *
 * So the assertion is "every authored task validates, except the ones that are
 * knowingly worker-ruled, and that set is exactly one". Weakening it to "most
 * tasks validate" would have let a real authoring error hide behind this.
 */
const authoredValidation = TASKS.map(task => ({ id: task.id, problems: validateInstance(task, 6) }))
  .filter(x => x.problems.length > 0)
t('every authored task validates, with no exceptions left',
  authoredValidation.length === 0,
  authoredValidation.map(x => `${x.id}: ${x.problems.join('; ')}`).join(' | '))

// ---------------------------------------------------------------------------
// The counterexample kind
// ---------------------------------------------------------------------------

group('ruleCounterexample — cheap to verify, expensive to find')
const claimTask = taskById('break-terms-are-not-factors-1')
const broke = async answer => rule(claimTask, answer, NO_WORKER)
t('the claim is an equation, which is what makes the kind rulable',
  parseExpression(claimTask.given, ['x']).kind === 'equation')
t('a witness that makes the sides differ is correct',
  (await broke('1')).verdict.ruling === 'correct')
t('and the ruling names both values', /the left side is 2\/3 and the right side is 3\/5/.test((await broke('1')).verdict.method))
t('a different witness is equally correct — there is no single answer',
  (await broke('2')).verdict.ruling === 'correct')
/**
 * x = 0 is the one point where (x+m)/(x+n) really does equal m/n. A learner who
 * offers it has made a precise error, and being told "the claim survives this
 * point" is the whole feedback.
 */
t('the one point where the claim holds is rejected, not accepted',
  (await broke('0')).verdict.ruling === 'incorrect')
t('and it says the claim survived', /both sides equal 3\/5, so the claim survives/.test((await broke('0')).verdict.brokeAt.detail))
t('an excluded point does not refute the claim', (await broke('-5')).verdict.ruling === 'incorrect')
t('and it explains that nothing was compared there',
  /the left side is undefined, so the two were never compared/.test((await broke('-5')).verdict.brokeAt.detail))
t('an answer that is not a point breaks at step 1', (await broke('x + 1')).verdict.brokeAt.step === 1)
t('an unreadable answer is not a ruling', (await broke('1 +')).status === 'unreadable')
t('an irrational answer is inconclusive rather than wrong',
  (await broke('sqrt(2)')).verdict.ruling === 'inconclusive')
const notAnEquation = await rule({ ...claimTask, given: '(x + 3)/(x + 5)' }, '1', NO_WORKER)
t('a non-equation claim is refused as an authoring fault',
  notAnEquation.verdict.ruling === 'inconclusive'
  && /must state an equation/.test(notAnEquation.verdict.method))
t('the shipped witness actually works, which the validator also checks',
  validateInstance(claimTask, 0).length === 0, validateInstance(claimTask, 0).join('; '))
t('a witness where both sides agree fails validation', (() => {
  const bad = { ...claimTask, reference: '0' }
  return validateInstance(bad, 0).some(s => /both sides agree/.test(s))
})())
t('a witness at an excluded point fails validation', (() => {
  const bad = { ...claimTask, reference: '-5' }
  return validateInstance(bad, 0).some(s => /one side is undefined/.test(s))
})())

// ---------------------------------------------------------------------------
// The second subject, and what it broke
// ---------------------------------------------------------------------------

const X2 = EXPONENTS_AND_LOGARITHMS

group('a second subject the schema was not designed around')
t('it is registered', ONTOLOGIES.length === 3 && getOntology('exponents-and-logarithms') === X2)
t('it reports no structural problems', ontologyProblems(X2).length === 0, JSON.stringify(ontologyProblems(X2)))
t('its fidelity claims match what its options can do', fidelityMismatches(X2).length === 0)
t('it has a prerequisite-respecting teaching order', teachingOrder(X2)?.length === X2.concepts.length)
t('and no cycles', cycles(X2).length === 0)
t('every concept has at least one knowledge point',
  X2.concepts.every(c => c.knowledgePoints.length > 0))
t('every knowledge point has a subgoal-labelled worked example',
  allKnowledgePoints(X2).every(p => p.workedExample.subgoals.length >= 2))
t('every objective names a task kind', X2.concepts.every(c => c.objectives.every(o => o.taskKinds.length > 0)))
t('it assembles into a real Facet, guided because one concept cannot be checked', (() => {
  const facet = conceptFacet(X2)
  return facet.enforcement === 'guided' && !!facet.caveat && facet.options.length === X2.concepts.length
})())
t('no knowledge point id collides with the first subject', pointIdCollisions().length === 0,
  pointIdCollisions().join(', '))
t('ontologyForPoint routes a point to its own subject',
  ontologyForPoint('log-of-product') === X2 && ontologyForPoint('factor-monic') === O)
t('an unknown point routes nowhere rather than to the default',
  ontologyForPoint('no-such-point') === null)

/**
 * The edge kinds were the real question — whether they describe anything beyond
 * the subject they were invented for. `encompasses` in particular: xe1 says the
 * logarithm rules exercise the exponent rules, which is a stronger instance than
 * anything in rational expressions, because the two rules are the same fact
 * through an inverse rather than merely adjacent.
 */
group('the edge kinds survived a subject they were not invented for')
t('it has prerequisite edges', edgesOfKind(X2, 'prerequisite').length >= 5)
t('it has encompasses edges', edgesOfKind(X2, 'encompasses').length >= 3)
t('exercising the log rules credits the exponent rules',
  encompassedBy(X2, 'logarithm-rules').includes('exponent-rules'))
t('credit reaches further than one hop', (() => {
  const closure = encompassedClosure(X2, 'solving-exponential-equations')
  return closure.has('logarithm-definition') && closure.size >= 1
})())
t('it has two interference pairs, both with stated reasons',
  edgesOfKind(X2, 'interferes_with').length === 2
  && edgesOfKind(X2, 'interferes_with').every(e => !!e.rationale))
t('the exponent and log rules interfere, despite one encompassing the other', (() => {
  const interferes = interferesWith(X2, 'exponent-rules').includes('logarithm-rules')
  const encompasses = encompassedBy(X2, 'logarithm-rules').includes('exponent-rules')
  return interferes && encompasses
})(), 'the kinship that makes the credit edge true is what makes them confusable')
t('the interference reason is retrievable for the UI',
  /multiplication becomes addition/.test(interferenceReason(X2, 'exponent-rules', 'logarithm-rules')))

group('reviewing a candidate, and recording a no')
t('the first subject has no candidate left unreviewed', pendingCandidates(O).length === 0)
t('all three of its candidates were declined', rejectedCandidates(O).length === 3)
t('every rejection states a reason', rejectedCandidates(O).every(e => !!e.rationale))
t('a rejected edge is still a candidate, so it still gates nothing',
  rejectedCandidates(O).every(e => e.kind === 'candidate_prerequisite'))
t('rejecting did not change the teaching order', teachingOrder(O)?.length === O.concepts.length)
/**
 * The load-bearing property: a rejection must NOT shrink the denominator.
 * Deleting declined edges instead would make a bad proposal mechanism look good,
 * which is the opposite of what the rate is for.
 */
t('promotionRate still counts declined edges as proposed', (() => {
  const rate = promotionRate(O)
  return rate.proposed === 13 && rate.promoted === 10
})(), JSON.stringify(promotionRate(O)))
t('reviewStatus separates "said no" from "nobody looked"', (() => {
  const s = reviewStatus(O)
  return s.promoted === 10 && s.rejected === 3 && s.pending === 0 && s.reviewedRate === 1
})(), JSON.stringify(reviewStatus(O)))
t('the second subject still has pending candidates, so the rate stays a measurement',
  pendingCandidates(X2).length === 2 && reviewStatus(X2).reviewedRate < 1,
  JSON.stringify(reviewStatus(X2)))
t('an edge that is both promoted and rejected is reported', (() => {
  const broken = { ...O, edges: [...O.edges, { id: 'z1', from: 'factor-monic', to: 'factor-monic', kind: 'candidate_prerequisite', promotedBy: 'a', rejectedBy: 'b', rationale: 'x' }] }
  return ontologyProblems(broken).some(s => /both promoted and rejected/.test(s))
})())
t('a rejection with no reason is reported', (() => {
  const broken = { ...O, edges: [...O.edges, { id: 'z2', from: 'polynomial-arithmetic', to: 'factoring-quadratics', kind: 'candidate_prerequisite', rejectedBy: 'a' }] }
  return ontologyProblems(broken).some(s => /rejection with no stated reason/.test(s))
})())
t('rejecting an edge that is already in force is reported', (() => {
  const broken = { ...O, edges: [...O.edges, { id: 'z3', from: 'polynomial-arithmetic', to: 'factoring-quadratics', kind: 'prerequisite', rejectedBy: 'a', rationale: 'x' }] }
  return ontologyProblems(broken).some(s => /already in force/.test(s))
})())

// ---------------------------------------------------------------------------
// Deriving the graph from task structure
// ---------------------------------------------------------------------------

const sig = s => signatureOf(p(s), 'x')

group('shape signatures')
t('a factored quadratic', (() => {
  const s = sig('(x + 3)(x - 5)')
  return s.forms.join() === 'factored' && !s.isQuotient && s.numeratorDegree === 2 && s.topLevelFactors === 2
})())
t('an expanded quadratic', (() => {
  const s = sig('x^2 - 2x - 15')
  return s.forms.join() === 'expanded' && s.topLevelTerms === 3 && s.numeratorDegree === 2
})(), JSON.stringify(sig('x^2 - 2x - 15')))
t('a quotient reports both degrees', (() => {
  const s = sig('(3x + 1)/((x + 3)(x - 5))')
  return s.isQuotient && s.numeratorDegree === 1 && s.denominatorDegree === 2
})())
t('a sum of fractions is partial_fractions and not a quotient', (() => {
  const s = sig('1/(x + 3) + 2/(x - 5)')
  return s.forms.join() === 'partial_fractions' && !s.isQuotient
})())
t('a bare linear is in BOTH expanded and factored — the ambiguity the guard exists for',
  sig('x + 3').forms.length === 2)

group('the discriminating guard — without it every concept encompasses every other')
t('a bare linear is not discriminating', !isDiscriminating(sig('x + 3')))
t('a bare monomial is not discriminating, despite being degree 2',
  !isDiscriminating(sig('x^2')), JSON.stringify(sig('x^2')))
t('a real expanded quadratic is', isDiscriminating(sig('x^2 - 2x - 15')))
t('a real product of two factors is', isDiscriminating(sig('(x + 3)(x - 5)')))
t('a quotient with a non-constant denominator is', isDiscriminating(sig('(x + 3)/(x + 5)')))
t('a shape in no named form is not', !isDiscriminating(sig('(x + 1)^2')))

group('subtrees and shape comparison')
t('properSubtrees excludes the root', (() => {
  const subs = properSubtrees(p('(x + 3)(x - 5)'))
  return !subs.some(n => n.kind === 'multiply')
})())
t('it reaches into a quotient on both sides', (() => {
  const subs = properSubtrees(p('(3x + 1)/((x + 3)(x - 5))')).map(n => describeShape(signatureOf(n, 'x')))
  return subs.length >= 4
})())
t('sameShape distinguishes expanded from factored',
  !sameShape(sig('x^2 - 2x - 15'), sig('(x + 3)(x - 5)')))
t('sameShape distinguishes a monomial from a polynomial of the same degree',
  !sameShape(sig('x^2'), sig('x^2 - 2x - 15')))
t('sameShape matches two factored quadratics',
  sameShape(sig('(x + 3)(x - 5)'), sig('(x - 2)(x - 7)')))
t('sameCoarseShape ignores degree, which sameShape does not', (() => {
  const a = sig('(x + 4)/(x + 1)^2')
  const b = sig('(2x + 1)/((x - 1)(x^2 + 1))')
  return sameCoarseShape(a, b) && !sameShape(a, b)
})())

group('shapedTasks — the evidence base')
t('it shapes the authored transform tasks', shapedTasks(O, 0).length > 10)
t('it excludes evaluate tasks, whose reference is a bare number',
  shapedTasks(O, 0).every(x => !x.taskId.startsWith('discriminant')))
t('generated variants multiply the evidence',
  shapedTasks(O, 10).length > shapedTasks(O, 0).length * 3)
t('every shaped task names a concept in the ontology',
  shapedTasks(O, 5).every(x => !!conceptById(O, x.conceptId)))

/**
 * These lock in the derivation's actual result. They are regression locks on a
 * measurement, not aspirations — if a generator or a form checker changes, the
 * numbers move and these should be re-read rather than patched.
 */
group('what structure actually recovers')
const DERIVED = deriveEdges(O, 20)
const INTERFERENCE = deriveInterference(O, 20)
const CMP = {
  encompasses: compareWithAuthored(O, DERIVED, 'encompasses'),
  prerequisite: compareWithAuthored(O, DERIVED, 'candidate_prerequisite'),
  interference: compareWithAuthored(O, INTERFERENCE, 'interferes_with'),
}
t('it recovers that simplifying a fraction exercises factoring',
  CMP.encompasses.confirmed.some(e => e.from === 'simplifying-rational' && e.to === 'factoring-quadratics'))
t('and that decomposing one does too',
  CMP.encompasses.confirmed.some(e => e.from === 'partial-fractions-linear' && e.to === 'factoring-quadratics'))
t('encompasses recall is partial, not total', CMP.encompasses.recall > 0.2 && CMP.encompasses.recall < 0.9,
  `${CMP.encompasses.recall}`)
t('it recovers the authored interference between the two decomposition templates',
  CMP.interference.confirmed.some(e =>
    [e.from, e.to].sort().join('|') === 'partial-fractions-quadratic|partial-fractions-repeated'))
/**
 * The headline finding, asserted so it cannot quietly change: structure is much
 * better at "what does this exercise" than at "what must come first". That is
 * SPEC-LEARNING §2's own warning — a dependency edge is not a pedagogical
 * prerequisite — showing up as a number.
 */
t('prerequisite recall is far worse than encompasses recall',
  CMP.prerequisite.recall < CMP.encompasses.recall,
  `prereq ${CMP.prerequisite.recall} vs encompasses ${CMP.encompasses.recall}`)
t('most authored prerequisite edges have no structural trace at all',
  CMP.prerequisite.authoredOnly.length >= 7, `${CMP.prerequisite.authoredOnly.length}`)
t('both precision and recall are reported, so neither can flatter the method',
  [CMP.encompasses, CMP.prerequisite, CMP.interference].every(c =>
    typeof c.recall === 'number' && (c.precision === null || typeof c.precision === 'number')))
t('precision is low, which is why nothing is promoted',
  CMP.encompasses.precision < 0.5 && CMP.prerequisite.precision < 0.5)
t('a rate over an empty denominator is null rather than zero', (() => {
  const empty = compareWithAuthored({ ...O, edges: [] }, [], 'encompasses')
  return empty.recall === null && empty.precision === null
})())

group('derived edges are quarantined like every other import')
const CANDIDATES = asCandidateEdges(DERIVED)
t('there are some', CANDIDATES.length > 5)
t('every one is a candidate', CANDIDATES.every(e => e.kind === 'candidate_prerequisite'))
t('not one names a promoter — a derivation is not a promoter',
  CANDIDATES.every(e => e.promotedBy === undefined))
t('every rationale names the criterion and the support count',
  CANDIDATES.every(e => /Derived from task structure by/.test(e.rationale) && /observation\(s\)/.test(e.rationale)))
t('every rationale admits the blind spot',
  CANDIDATES.every(e => /may name the wrong concept/.test(e.rationale)))
t('both endpoints are real concepts, unlike the scrape importer\'s edges',
  CANDIDATES.every(e => !!conceptById(O, e.from) && !!conceptById(O, e.to)))
t('merging them into the ontology reports no problems', (() => {
  const merged = { ...O, edges: [...O.edges, ...CANDIDATES] }
  return ontologyProblems(merged).length === 0
})(), JSON.stringify(ontologyProblems({ ...O, edges: [...O.edges, ...CANDIDATES] })))
t('and changes no walk, because candidates gate nothing', (() => {
  const merged = { ...O, edges: [...O.edges, ...CANDIDATES] }
  return JSON.stringify(teachingOrder(merged)) === JSON.stringify(teachingOrder(O))
    && cycles(merged).length === 0
})())
t('but it does move the promotion rate, since they are proposals', (() => {
  const merged = { ...O, edges: [...O.edges, ...CANDIDATES] }
  return promotionRate(merged).rate < promotionRate(O).rate
})())
t('the summary refuses to present the derivation as settled',
  summariseDerivation([CMP.encompasses]).some(l => /Nothing here is promoted/.test(l)))

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

// ---------------------------------------------------------------------------
// The third subject: the arithmetic underneath, and what authoring it did
// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN THE HEADERS, not the shape of the data.
 *
 * ontology-arithmetic.ts says three things that are easy to assert and easy to
 * get wrong by a later edit: that authoring a foundation tightens the gate
 * rather than widening it, that the session becomes a full one exactly one
 * concept in, and that the subject is rulable with no worker. Each is checked
 * here against the real registry, because each is the kind of claim that would
 * otherwise rot into a comment that used to be true.
 */
const A = ARITHMETIC_FOUNDATIONS
const COLD = {}

group('arithmetic-foundations, the subject underneath the other two')
t('it is registered FIRST — registry order is the curriculum order', ONTOLOGIES[0] === A)

/**
 * THE DEFAULT SUBJECT MUST BE PRACTISABLE FROM NOTHING.
 *
 * `ONTOLOGIES[0]` is what /api/learn/session, /learn and the scratchpad route
 * all use when no subject is asked for, so whatever sits at index 0 is the
 * first thing a new account is served. It therefore has to assemble a non-empty
 * set against an empty strength table.
 *
 * This is a guard against a regression that already happened once rather than a
 * hypothetical: authoring arithmetic put real gates under the previous default,
 * and the symptom was an empty practice tab on a fresh account — zero tasks and
 * a `blocked` list, which is `assemble` behaving correctly and the product
 * being broken. Stated against index 0 rather than against this subject by
 * name, so it keeps holding when a fourth subject is authored below this one.
 */
const defaultSet = assemble({
  ontology: ONTOLOGIES[0], strengths: {}, now: '2026-10-23T12:00:00Z',
})
t('the default subject serves a non-empty set on a cold account',
  defaultSet.tasks.length > 0,
  `${defaultSet.tasks.length} tasks; blocked: ${defaultSet.blocked.map(b => b.conceptId).join(', ')}`)
t('and it is the subject with a root that needs nothing',
  roots(ONTOLOGIES[0]).some(id => gatingPrerequisitesOf(ONTOLOGIES[0], id).length === 0))
t('and resolves by id', getOntology('arithmetic-foundations') === A)
t('it has no internal faults', ontologyProblems(A).length === 0, ontologyProblems(A).join('; '))
t('five concepts, fifteen knowledge points',
  A.concepts.length === 5 && allKnowledgePoints(A).length === 15,
  `${A.concepts.length} concepts, ${allKnowledgePoints(A).length} points`)
t('every concept is teachable — this is a syllabus, not a map',
  A.concepts.every(c => isTeachable(A, c.id)))
t('every knowledge point has a task, which neither older subject manages',
  allKnowledgePoints(A).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(A).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))

t('place value is the only root', (() => {
  const r = roots(A)
  return r.length === 1 && r[0] === 'place-value'
})(), roots(A).join(', '))
t('the curriculum order starts at place value and is acyclic',
  teachingOrder(A)?.[0] === 'place-value' && cycles(A).length === 0)

/**
 * The entry point, before and after — the claim the whole file rests on.
 *
 * `size` and `maxPerConcept` are left at their defaults (8 and 3) because the
 * claim is about what a learner actually gets, not about what the scheduler
 * could be configured to give.
 */
group('what authoring a foundation did to the first session')
const coldSet = assemble({ ontology: A, strengths: COLD, now: '2026-10-23T12:00:00Z' })
t('a cold account gets three tasks, all from place value',
  coldSet.tasks.length === 3 && coldSet.tasks.every(x => conceptOfPoint(A, x.knowledgePointId).id === 'place-value'),
  `${coldSet.tasks.length} tasks`)
t('and the other four concepts are reported blocked rather than silently absent',
  coldSet.blocked.length === 4,
  coldSet.blocked.map(b => b.conceptId).join(', '))
t('each blocked concept names a TEACHABLE thing to go and do', coldSet.blocked.every(b =>
  b.missing.length > 0 && b.missing.every(m => isTeachable(A, m))))

/**
 * A CLAIM OPENS ITS OWN CONCEPT AND NOTHING ELSE, INCLUDING NOTHING ABOVE IT.
 *
 * Worth asserting on this subject specifically, because it is the subject an
 * adult is most likely to want to skip, and because the obvious reading of the
 * claim feature is the wrong one: claiming `place-value` does NOT open
 * `integer-arithmetic`. `introducible` deliberately does not pass `claimed`
 * into its own recursion, so a claim is never evidence about anything
 * downstream — the only thing that satisfies a prerequisite is strength.
 *
 * So skipping arithmetic is a per-concept act: you claim each concept you want
 * to be served problems from. That is more friction than it first appears and
 * it is the safe direction — the worst a bluff achieves is being handed
 * problems you cannot do.
 */
t('claiming place value opens place value', introducible(
  A, COLD, 'place-value', '2026-10-23T12:00:00Z', new Set(['place-value'])))
t('but does NOT open integer arithmetic above it — a claim never propagates', !introducible(
  A, COLD, 'integer-arithmetic', '2026-10-23T12:00:00Z', new Set(['place-value'])))

/**
 * The three-wide band, and the first full session in the build.
 *
 * Claiming the three siblings opens them, and `place-value` is a root so it was
 * never shut — four open concepts, twelve candidate tasks, and the session
 * comes back FULL at the default size of 8. This is the first place anywhere in
 * the build where `size` binds before the per-concept cap of 3, and it is the
 * reason the three were authored as siblings rather than as a chain: a chain
 * would have yielded 3 tasks at every step of it.
 *
 * Both limits are visible in `skipped`, which is why that field exists: two
 * tasks are dropped by the interference and the rest because the set was
 * already full. A scheduler that returned 8 without saying which cause stopped
 * it would read as "that is all there is".
 */
const BAND = ['order-of-operations', 'negative-numbers', 'divisibility']
const bandSet = assemble({
  ontology: A, strengths: COLD, now: '2026-10-23T12:00:00Z', claimed: new Set(BAND),
})
const bandConcepts = new Set(bandSet.tasks.map(x => conceptOfPoint(A, x.knowledgePointId).id))
t('claiming the band opens all three', BAND.every(id =>
  introducible(A, COLD, id, '2026-10-23T12:00:00Z', new Set(BAND))))
t('the session is full at eight — the first time size binds before the cap',
  bandSet.tasks.length === 8, `${bandSet.tasks.length}`)
t('drawn from three concepts, so the cap is no longer what decides the set',
  bandConcepts.size === 3, [...bandConcepts].join(', '))
t('the interference holds: signs and precedence are never in one set',
  !(bandConcepts.has('negative-numbers') && bandConcepts.has('order-of-operations')),
  [...bandConcepts].join(', '))
t('and both limits are named in skipped, not just the one that happened to bind', (() => {
  const reasons = bandSet.skipped.map(s => s.reason)
  return reasons.some(r => /must not be practised alongside/.test(r))
    && reasons.some(r => /already full at 8/.test(r))
})(), bandSet.skipped.map(s => s.reason).join(' | '))

/**
 * Every task in this subject is settled locally.
 *
 * `ruleEvaluate` against a verifier config with no worker — if any of these
 * came back inconclusive the subject would be ungradable on a deployment
 * without one, which is the one property its header claims that a reader cannot
 * check by eye.
 */
group('the third subject is gradable with no worker')
const ARITH_TASKS = allKnowledgePoints(A).flatMap(p => tasksForPoint(p.id))
t('fifteen tasks, one per point', ARITH_TASKS.length === 15, `${ARITH_TASKS.length}`)
t('all of them are evaluate', ARITH_TASKS.every(x => x.kind === 'evaluate'))
t('every one declares integer symbols rather than real ones',
  ARITH_TASKS.every(x => x.variables.every(v => v.assumptions?.integer === true)))
t('every reference is exactly reproducible from the given — no worker consulted',
  ARITH_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }))
const arithRulings = await Promise.all(ARITH_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  arithRulings.every(r => r.verdict.ruling === 'correct'),
  arithRulings.map((r, i) => `${ARITH_TASKS[i].id}:${r.verdict.ruling}`)
    .filter((_, i) => arithRulings[i].verdict.ruling !== 'correct').join(', '))
t('and a wrong one is ruled incorrect rather than inconclusive — the engine settled it',
  (await ruleEvaluate(taskById('precedence-1'), '20', NO_WORKER)).verdict.ruling === 'incorrect')

// NOTE: the companion claim — that authoring these five TIGHTENED the gate on
// the two algebra subjects, so neither is introducible on a cold account any
// more — is asserted in tests/atlas.mjs, which is the harness that builds the
// composed map. It cannot be checked here: the gates run through
// `algebra-foundations.links`, and those edges only exist in `MATHEMATICS`.

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
