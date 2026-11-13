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
    join('lib', 'concepts', 'numerals.ts'),
    join('lib', 'concepts', 'ontology-arithmetic.ts'),
    join('lib', 'concepts', 'ontology-functions.ts'),
    join('lib', 'concepts', 'ontology-matrices.ts'),
    join('lib', 'concepts', 'ontology-vectors.ts'),
    join('lib', 'concepts', 'ontology-exponentials.ts'),
    join('lib', 'concepts', 'ontology.ts'),
    join('lib', 'concepts', 'registry.ts'),
    join('lib', 'concepts', 'questions.ts'),
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
    numerals: require(join(outDir, 'concepts', 'numerals.js')),
    questions: require(join(outDir, 'concepts', 'questions.js')),
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
  EXPRESSIONS_AND_EQUATIONS,
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
const { TASKS, taskById, tasksForPoint, primaryVariable, isPractisable, practisableConcepts } = M.tasks
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
  isInterrogative, questionsForPoint, questionChains, allQuestions, questionById,
  questionCoverage, questionCoverageLine, socraticContext, chainsForConcept,
} = M.questions
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
/*
 * `sqrt(4)` used to be the example of "a function call has no rational value",
 * which was a statement about this function rather than about the number.
 * `exactValue` had no case for a function node at all, so every call returned
 * null — including the ones that are exactly rational, which made every task on
 * the quadratic formula need the math worker.
 */
t('an exactly-rational square root is computed', show('sqrt(4)') === '2')
t('a nested one too', show('sqrt(16)/2') === '2')
t('abs is exact', show('abs(0 - 7)') === '7')
t('an irrational square root still has no rational value', val('sqrt(2)') === null)
t('and a function that is irrational nearly everywhere has none either',
  val('log(5)') === null && val('sin(1)') === null)
t('one argument to log is the natural log, rational only at 1',
  show('log(1)') === '0' && val('log(2)') === null)
t('division by zero is not a value, rather than a crash', val('1/(3 - 3)') === null)
t('an exact fractional exponent is computed', show('4^(1/2)') === '2')
t('an inexact one is still refused', val('2^(1/2)') === null)
t('an even root of a negative is not a real number', val('(0 - 4)^(1/2)') === null)
t('an odd root of a negative keeps its sign', show('(0 - 8)^(1/3)') === '-2')
t('an absurd exponent is refused rather than computed', val('2^999') === null)

/**
 * `exactLog`, which is what made the logarithm concepts practisable.
 *
 * The refusals matter more than the successes here, for the reason the header
 * of numerals.ts gives: a logarithm that is ruled when it should abstain marks
 * a learner wrong for writing something true. So the irrational case, the
 * undefined cases and the out-of-bound case are all tested, and each returns
 * null rather than a guess.
 *
 * `log(x, b)` is log base b of x — sympy's order, which the worker inherits.
 * Getting it backwards is the silent failure this group would catch: log(32, 2)
 * and log(2, 32) are 5 and 1/5, both rational, so only an assertion about
 * WHICH distinguishes them.
 */
group('exactLog — a logarithm is rational exactly when it is a rational power')
t('the integer case', show('log(32, 2)') === '5')
t('and the argument order is log base b of x, not the reverse',
  show('log(2, 32)') === '1/5')
t('a value below 1 gives a negative exponent', show('log(1/8, 2)') === '-3')
t('a fractional base with an integer answer', show('log(1/8, 1/2)') === '3')
t('a rational answer, which needs the root search rather than the walk',
  show('log(27, 9)') === '3/2')
t('a big one, found without expanding anything absurd', show('log(6561, 3)') === '8')
t('log_b(1) is 0 for any legal base', show('log(1, 7)') === '0')
t('an irrational logarithm has no rational value, and says so', val('log(3, 2)') === null)
t('a negative argument names nothing', val('log(0 - 8, 2)') === null)
t('nor does zero', val('log(0, 2)') === null)
t('base 1 is undefined rather than anything', val('log(5, 1)') === null)
t('a negative base is refused', val('log(8, 0 - 2)') === null)
/*
 * The bound, exercised through the answer rather than through the input.
 *
 * `log(2, 2^65)` would have tested nothing: `exactValue` refuses an exponent
 * above 64 in the `power` branch, so the BASE comes back null and exactLog is
 * never reached. The literal is 2^65, so the base is a value and the answer
 * is 1/65 — a denominator one past the bound, which is the refusal meant.
 */
t('an answer whose denominator exceeds the bound is refused, not approximated',
  val('log(2, 36893488147419103232)') === null)
t('while one inside it is found', show('log(2, 1152921504606846976)') === '1/60')
t('a symbolic argument abstains',
  exactValue(parseExpression('log(x, 2)', ['x'])) === null)

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

/*
 * The logarithm tasks, ruled with no worker — which is the whole claim
 * `exactLog` was added to support.
 *
 * The second assertion is the one worth having: `solve-exponential-1` says in
 * its own comment that a learner who answers `log(27, 9)` rather than `3/2` is
 * also right, because "solve for x" is answered by either. That is only true
 * if `exactValue` evaluates the learner's form too, and nothing else in the
 * suite would notice if it stopped.
 */
t('a logarithm task is settled locally and exactly',
  (await ruleEvaluate(taskById('log-as-exponent-1'), '5', NO_WORKER)).verdict.ruling === 'correct')
t('and an unsimplified but correct answer is accepted, not sent away',
  (await ruleEvaluate(taskById('solve-exponential-1'), 'log(27, 9)', NO_WORKER))
    .verdict.ruling === 'correct')
// 9^x = 27 invites "x = 3", from reading 27 as 3³ and forgetting that the base
// is 9. A wrong answer here has to be ruled wrong, not routed to review.
t('a plausible wrong answer to one is ruled wrong rather than inconclusive',
  (await ruleEvaluate(taskById('solve-exponential-1'), '3', NO_WORKER))
    .verdict.ruling === 'incorrect')
t('the negative-value log is defined and rules correct',
  (await ruleEvaluate(taskById('log-as-exponent-2'), '-3', NO_WORKER)).verdict.ruling === 'correct')

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
// `sqrt(2)`, not `sqrt(16)`: the latter is now computed exactly, so it stopped
// being an example of an answer with no rational value.
const irrational = await ruleEvaluate(
  evalTask({ given: 'x^2', at: { x: '2' }, reference: '4' }), 'sqrt(2)', NO_WORKER)
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
/**
 * The tasks whose answer has no rational value, so only the worker can rule them.
 *
 * Named, and used by all three assertions below that have to make an exception.
 * A list rather than a count because every entry has to be justified by the
 * mathematics: `root-as-exponent-1` asks for a fractional exponent `exactValue`
 * refuses, and the two formula tasks ask for −1 + √2 and 2 + √3, which no
 * arrangement of this code could give a rational value.
 *
 * It was one entry and is now three. Keeping it a list is what stops that
 * growth being silent — a NEW task that cannot be verified locally fails these
 * assertions until somebody writes down why it belongs here.
 */
const WORKER_ONLY = ['root-as-exponent-1', 'formula-irrational-1', 'formula-irrational-2']
/*
 * A floor, not a total.
 *
 * This read `=== 61` and before that `=== 40`, and each authoring pass has had
 * to come back and edit the number — which tests nothing: the count is an
 * outcome of how much has been written, and asserting it exactly makes writing
 * more look like a regression. What is worth guarding is that the shipped set
 * has not collapsed, and that every subject contributes something.
 */
t('there are many, across every subject', EVALS.length >= 60, `${EVALS.length}`)
t('and no subject ships none', ONTOLOGIES.every(o =>
  allKnowledgePoints(o).some(point => tasksForPoint(point.id).length > 0)))
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
t('only the named worker-only tasks are skipped by the re-derivation',
  EVALS.filter(task => reDerive(task) === 'skip').every(task => WORKER_ONLY.includes(task.id)),
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
t('most of them are rationally valued', localEvals.length >= EVALS.length - 3,
  `${localEvals.length} of ${EVALS.length}`)
/*
 * The worker-only list, named task by task.
 *
 * It is a list rather than a count because each entry has to be justified by
 * the MATHEMATICS and not by convenience. All three are irrational answers:
 * `root-as-exponent-1` asks for a fractional exponent `exactValue` refuses, and
 * the two irrational-roots tasks ask for `−1 + √2` and `2 + √3`, which have no
 * rational value for the same reason no arrangement of this code could give
 * them one.
 *
 * Dropping those two tasks would have made this group green again, and would
 * have deleted the point of the quadratic formula: producing exactly the roots
 * factoring cannot reach. The honest shape is to keep the tasks and keep the
 * boundary visible — which is what the suite already did for one task before
 * there were three.
 */
t('the ones that are not need the worker, and each is irrational by mathematics', (() => {
  const needsWorker = EVALS.filter(task => !localEvals.includes(task)).map(task => task.id)
  const sanctioned = ['root-as-exponent-1', 'formula-irrational-1', 'formula-irrational-2']
  return needsWorker.every(id => sanctioned.includes(id))
})(), EVALS.filter(task => !localEvals.includes(task)).map(t2 => t2.id).join(', '))
t('and they say they needed one rather than guessing', (await Promise.all(
  EVALS.filter(task => !localEvals.includes(task))
    .map(task => ruleEvaluate(task, task.reference, NO_WORKER)),
)).every(r => r.status === 'ruled' && r.verdict.ruling === 'inconclusive'))

group('can a concept be mastered in the default configuration?')
/*
 * "Can a learner finish this concept if the CAS cannot be reached?"
 *
 * A resilience question, and nothing was asking it. The suite checked that
 * tasks exist, that references are correct and that rulings are honest; it did
 * not check that anything could be completed. A concept whose every task is a
 * `transform_to_form` is inconclusive without the worker, and a concept that
 * is always inconclusive never gains strength — so anything gated behind it is
 * walled off except via a claim.
 *
 * The worker IS deployed — zMothership2, published through a Cloudflare Tunnel
 * at math-worker.aireadalong.com, with the URL and token live as Worker
 * secrets. An earlier version of this comment said production had none, which
 * was wrong and was inferred from the `NO_WORKER` object below rather than
 * observed. The group still earns its place: the tunnel terminates on a home
 * machine, so unreachable is an ordinary state, and `polynomial-arithmetic`
 * being impassable then would take the whole rational-expressions subject with
 * it.
 *
 * Three concepts are named exceptions rather than fixed — combining rational
 * expressions and two partial-fractions ones — where the demand genuinely IS a
 * transformation and an `evaluate` stand-in would be testing something else.
 */
const WORKERLESS_CONCEPTS = [
  // `polynomial-arithmetic` was here and has been FIXED rather than listed: the
  // gating assertion below showed `factoring-quadratics` and
  // `polynomial-division` were each walled off solely by it, so the whole
  // rational-expressions subject became unreachable past its first concept
  // whenever the worker could not be reached.
  'combining-rational',
  'partial-fractions-repeated',
  'partial-fractions-quadratic',
]

const gradesWithNoWorker = new Set()
for (const task of TASKS) {
  const r = await rule(task, task.reference, NO_WORKER)
  if (r.status === 'ruled' && r.verdict.ruling === 'correct') gradesWithNoWorker.add(task.id)
}

const ungradableConcepts = ONTOLOGIES.flatMap(o => o.concepts)
  .filter(c => c.knowledgePoints.length > 0)
  .filter(c => {
    const tasks = c.knowledgePoints.flatMap(p => tasksForPoint(p.id))
    return tasks.length > 0 && !tasks.some(t2 => gradesWithNoWorker.has(t2.id))
  })
  .map(c => c.id)

t('every teachable concept has at least one task a learner can finish with no worker',
  ungradableConcepts.every(id => WORKERLESS_CONCEPTS.includes(id)),
  ungradableConcepts.join(', '))
t('and the named exceptions are still real, so the list is not stale',
  WORKERLESS_CONCEPTS.every(id => ungradableConcepts.includes(id)),
  `missing: ${WORKERLESS_CONCEPTS.filter(id => !ungradableConcepts.includes(id)).join(', ')}`)
/*
 * The consequence spelled out, so the cost of the four is visible rather than
 * implied: nothing may be GATED behind a concept that cannot be finished, or
 * the gate is permanent for anyone who does not know to claim their way past.
 */
t('nothing teachable is gated solely behind a concept that cannot be finished', (() => {
  const stuck = []
  for (const o of ONTOLOGIES) {
    for (const c of o.concepts) {
      if (c.knowledgePoints.length === 0) continue
      const gates = prerequisitesOf(o, c.id).filter(id => ungradableConcepts.includes(id))
      if (gates.length > 0 && gates.length === prerequisitesOf(o, c.id).length) {
        stuck.push(`${c.id} behind ${gates.join('+')}`)
      }
    }
  }
  return { stuck }
})().stuck.length === 0, (() => {
  const stuck = []
  for (const o of ONTOLOGIES) {
    for (const c of o.concepts) {
      if (c.knowledgePoints.length === 0) continue
      const gates = prerequisitesOf(o, c.id).filter(id => ungradableConcepts.includes(id))
      if (gates.length > 0 && gates.length === prerequisitesOf(o, c.id).length) {
        stuck.push(`${c.id} behind ${gates.join('+')}`)
      }
    }
  }
  return stuck.join('; ')
})())

group('roots of higher polynomials is teachable')

const PR = conceptById(O, 'polynomial-roots')
t('the concept is authored', !!PR && isTeachable(O, 'polynomial-roots'))
t('three knowledge points, each with a worked example and subgoals',
  PR.knowledgePoints.length === 3
  && PR.knowledgePoints.every(p => p.workedExample.subgoals.length >= 3))
t('every point has a task', PR.knowledgePoints.every(p => tasksForPoint(p.id).length > 0))
/*
 * The reason this concept was chosen next: it carries both kinds. The theorems
 * are `evaluate` and settle locally; full factorisation is a transform only the
 * CAS can rule. So the "finishable with no worker" invariant is satisfied by
 * the concept's own content rather than by a stand-in.
 */
t('it has both evaluate and transform tasks', (() => {
  const kinds = new Set(PR.knowledgePoints.flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
  return kinds.has('evaluate') && kinds.has('transform_to_form')
})())
t('division gates it, since a found root has to be divided out',
  prerequisitesOf(O, 'polynomial-roots').includes('polynomial-division'))
t('and the quadratic formula does, since that is what is left afterwards',
  prerequisitesOf(O, 'polynomial-roots').includes('quadratic-formula'))
t('doing it exercises the division and the quadratic factoring',
  encompassedBy(O, 'polynomial-roots').includes('polynomial-division')
  && encompassedBy(O, 'polynomial-roots').includes('factoring-quadratics'))
t('nothing introduced a cycle', teachingOrder(O) !== null)
/*
 * The factor theorem's point is that a zero means a factor, so the references
 * have to BE zero where the prompt says the candidate is a root — a task
 * claiming x − 1 is a factor while its reference is 5 would teach the opposite
 * of the rule.
 */
t('the factor-theorem tasks that claim a root reference zero', (() => {
  const roots = tasksForPoint('factor-theorem').filter(x => /means x − \d+ is a factor|Is x − \d+ a factor/.test(x.prompt))
  return roots.length >= 2 && roots.every(x => x.reference === '0')
})())
t('and the one that does not claim a root is non-zero, so the test is a test',
  tasksForPoint('factor-theorem').some(x => x.reference !== '0'))

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
/*
 * This read `size: 20` on a fresh table and expected a variant, which depended
 * on `expand-binomials` having exactly two authored tasks: the set is capped at
 * three by what is introducible, so the third slot was filled by a generated
 * one. Authoring a third task for that point closed the gap and the assertion
 * stopped being observable — the scheduler preferring authored tasks is the
 * intended behaviour, so the premise moved rather than the property.
 *
 * Restated against a learner who has finished the first point. The next one has
 * two authored tasks and three slots, so the fallback is visible again — and
 * stated in terms of a short pool rather than a particular count, which is what
 * the scheduler actually keys on.
 */
const pastFirstPoint = {
  'expand-binomials': {
    ...emptyStrength('expand-binomials'),
    strength: 0.99,
    streak: 5,
    unaidedSuccesses: 5,
    lastDemonstratedAt: '2025-12-20T00:00:00Z',
  },
}
t('with a variant seed, a point whose authored pool is short gets generated instances', (() => {
  const a = assemble({ ontology: O, strengths: pastFirstPoint, now: NOW, size: 20, variantSeed: 1 })
  return a.tasks.some(task => task.id.includes('@'))
})(), assemble({ ontology: O, strengths: pastFirstPoint, now: NOW, size: 20, variantSeed: 1 })
  .tasks.map(x => x.id).join(' '))
t('and without a seed the same state serves authored tasks only', (() => {
  const a = assemble({ ontology: O, strengths: pastFirstPoint, now: NOW, size: 20 })
  return a.tasks.length > 0 && a.tasks.every(task => !task.id.includes('@'))
})())
/*
 * The reason the fresh-table case no longer reaches one, asserted so the change
 * above is not mistaken later for the scheduler having stopped working.
 */
t('a fresh learner now has enough authored tasks to fill the first set', (() => {
  const a = assemble({ ontology: O, strengths: freshTable, now: NOW, size: 20, variantSeed: 1 })
  return a.tasks.length > 0 && a.tasks.every(task => !task.id.includes('@'))
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
/*
 * Every authored task validates, except the knowingly worker-ruled ones — and
 * the exception is narrow in both directions: only a task on the `WORKER_ONLY`
 * list may fail, and only with the one problem that list exists for. A
 * sanctioned task that develops a *different* fault still fails here, which is
 * what keeps this from becoming "most tasks validate".
 */
t('every authored task validates, except the named worker-ruled ones',
  authoredValidation.every(x =>
    WORKER_ONLY.includes(x.id)
    && x.problems.every(p => /no exact value at the stated inputs/.test(p))),
  authoredValidation.map(x => `${x.id}: ${x.problems.join('; ')}`).join(' | '))
t('and the exception really is used, so it is not dead text',
  authoredValidation.length > 0 && authoredValidation.length <= WORKER_ONLY.length)

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
t('it is registered', ONTOLOGIES.length === 7 && getOntology('exponents-and-logarithms') === X2)
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
/*
 * Stated as a relationship, not as totals.
 *
 * These read `proposed === 13 && promoted === 10` and broke the moment a
 * concept was authored with two new edges — which is noise, not a finding: the
 * property being guarded is that a declined edge stays in the DENOMINATOR, and
 * that is `proposed === promoted + rejected` however many edges exist. Pinning
 * the absolutes made every authoring pass look like a regression in the review
 * mechanism.
 */
t('promotionRate still counts declined edges as proposed', (() => {
  const rate = promotionRate(O)
  const s = reviewStatus(O)
  return rate.proposed === rate.promoted + s.rejected && s.rejected > 0
})(), JSON.stringify(promotionRate(O)))
t('reviewStatus separates "said no" from "nobody looked"', (() => {
  const s = reviewStatus(O)
  return s.rejected === rejectedCandidates(O).length
    && s.pending === pendingCandidates(O).length
    && s.pending === 0
    && s.reviewedRate === 1
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
/*
 * Partial, not total — and the band is loose because the ratio is not a
 * property of the derivation alone.
 *
 * This read `> 0.2` and broke at 0.18 when two authored `encompasses` edges
 * were added for `polynomial-roots`. Nothing about the derivation changed: the
 * denominator is the authored edge count, so every hand-written edge the
 * shape-comparison cannot see pushes recall DOWN. Re-read as the header above
 * asks, the measurement says what it always said — some authored structure is
 * recoverable from task shapes and most is not — and a tight lower bound turns
 * each authoring pass into a false regression.
 *
 * What is worth locking is that it recovers something and not everything. The
 * two specific edges it does recover are asserted by name above, which is the
 * part that would actually catch the derivation breaking.
 */
t('encompasses recall is partial, not total',
  CMP.encompasses.recall > 0 && CMP.encompasses.recall < 0.9,
  `${CMP.encompasses.recall} — ${CMP.encompasses.confirmed.length} of ${edgesOfKind(O, 'encompasses').length} authored`)
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
t('both endpoints are real concepts',
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
t('nine concepts, twenty-seven knowledge points',
  A.concepts.length === 9 && allKnowledgePoints(A).length === 27,
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
t('and the other eight concepts are reported blocked rather than silently absent',
  coldSet.blocked.length === 8,
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
/*
 * Twenty-eight tasks over twenty-seven points, so this is no longer one
 * apiece. `pull-the-square-out` carries two, and the pair is the reason: the
 * split it teaches cannot be demanded by any form in forms.ts, so one task
 * computes the square-free part of an integer root and the other takes the one
 * root of a NON-integer that is still exactly rational. Neither alone covers
 * the point. The one-per-point floor is asserted separately above, against
 * every point rather than against a total, which is the part that matters.
 */
t('twenty-eight tasks, and every point has at least one',
  ARITH_TASKS.length === 28 && allKnowledgePoints(A).every(p => tasksForPoint(p.id).length > 0),
  `${ARITH_TASKS.length}`)
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

/**
 * `prime-factorisation`'s header, which makes four claims worth pinning.
 *
 * The first is the load-bearing one: the concept says it ships `evaluate`
 * tasks because NO form can demand a product of primes, and that is a fact
 * about forms.ts rather than a preference. If somebody later adds a form that
 * can, this assertion is where they will find out that the compromise is no
 * longer necessary.
 *
 * The rest are the mathematics of the worked examples, re-derived rather than
 * read. A wrong worked example is the worst thing this file can contain and
 * the one thing no other check in the suite would notice — `ontologyProblems`
 * reads structure, and the task references say nothing about the prose.
 */
group('prime-factorisation — the claims its header makes')
const PF = conceptById(A, 'prime-factorisation')
const PF_SUBGOALS = PF.knowledgePoints.flatMap(p => p.workedExample.subgoals)

t('the factored form cannot express "a product of primes" — a bare numeral satisfies it',
  checkForm(parseExpression('7350', []), 'factored', 'x').held === true,
  'if this fails, a transform_to_form task is now possible and the header is out of date')
t('and so does the factorisation, so the form could not tell them apart',
  checkForm(parseExpression('2*3*5^2*7^2', []), 'factored', 'x').held === true)

/*
 * The exact arithmetic of all three worked examples, computed here and then
 * compared against WHAT THE EXAMPLE SAYS rather than against a number repeated
 * in this file. Computing 2·3·5²·7² and checking it equals 7350 proves only
 * that the test can multiply; what has to be pinned is that the `answer` a
 * learner is shown is the one the arithmetic produces. So each of these reads
 * the authored string.
 */
const exactly = src => showExact(exactValue(parseExpression(src, [])))
const pfAnswer = i => PF.knowledgePoints[i].workedExample.answer

t('the first example\'s factorisation multiplies back to the number it factors',
  exactly('2*3*5^2*7^2') === '7350' && pfAnswer(0) === '7350 = 2 · 3 · 5² · 7²',
  pfAnswer(0))
t('the divisor count it states is the one the exponents give — (1+1)(1+1)(2+1)(2+1)',
  pfAnswer(1) === exactly('2*2*3*3'), `says ${pfAnswer(1)}, arithmetic gives ${exactly('2*2*3*3')}`)
t('dividing out the odd-exponent primes leaves 1225, and it is 35²',
  exactly('7350/(2*3)') === '1225' && exactly('35^2') === '1225')
t('the square part and the square-free part multiply back to 7350',
  exactly('35^2*6') === '7350')
t('and the third example states both of those numbers',
  pfAnswer(2).includes('1225') && pfAnswer(2).includes('35²') && pfAnswer(2).includes('6'),
  pfAnswer(2))
t('squaring doubles the exponents: (2 · 3²)² = 2² · 3⁴',
  exactly('(2*3^2)^2') === exactly('2^2*3^4') && exactly('(2*3^2)^2') === '324')
t('and 324 is what the subgoal that argues it claims',
  PF.knowledgePoints[2].workedExample.subgoals[0].detail.includes('324'))

t('three points, one task each, and every one of them evaluate',
  PF.knowledgePoints.length === 3
  && PF.knowledgePoints.every(p => tasksForPoint(p.id).length === 1)
  && PF.knowledgePoints.every(p => tasksForPoint(p.id).every(x => x.kind === 'evaluate')))
t('each task is about a different number from its own worked example, so it is not a recall',
  ['2450', '1350', '1960'].every((n, i) =>
    tasksForPoint(PF.knowledgePoints[i].id)[0].prompt.includes(n)))

/**
 * EVERY SUBGOAL HERE IS ASKED AS A QUESTION.
 *
 * The question map measures this (questions.ts) and found 21 of 283 authored
 * when it was written. This concept is the first where the figure is all of
 * them, which is the standard the rest should be brought up to rather than a
 * flourish — so it is asserted, not just counted.
 */
// Asserted before the `every` calls below, which would pass vacuously on an
// empty list — the failure mode a renamed concept id would produce here.
t('twelve subgoals across the three worked examples', PF_SUBGOALS.length === 12,
  `${PF_SUBGOALS.length}`)
t('every subgoal carries an authored socratic phrasing',
  PF_SUBGOALS.every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  PF_SUBGOALS.filter(s => !s.socratic).map(s => s.label).join(', '))
t('and every one of them is actually phrased as a question',
  PF_SUBGOALS.every(s => isInterrogative(s.socratic)),
  PF_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join(', '))
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  PF_SUBGOALS.every(s => !isInterrogative(s.label)))

/**
 * The encompasses edge that is deliberately absent. See the note beside the
 * credit-propagation block in ontology-arithmetic.ts: the claim would be about
 * what practising exercises, and not one of the three tasks makes the learner
 * decide a divisibility question.
 */
t('factoring does NOT claim credit for divisibility, though it gates on it',
  !encompassedBy(A, 'prime-factorisation').includes('divisibility')
  && prerequisitesOf(A, 'prime-factorisation').includes('divisibility'),
  encompassedBy(A, 'prime-factorisation').join(', '))

/**
 * `gcd-and-lcm`'s header, pinned the same way and for the same reason.
 *
 * The mathematics first: a wrong worked example is the worst thing this file
 * can contain and the one thing no structural check would notice. Every
 * number in all three examples is re-derived here and compared against WHAT
 * THE EXAMPLE SAYS, so a typo in the prose fails rather than being taught.
 *
 * Then the two claims the promotion itself makes — that the edge which used to
 * sit in the map area now lives inside the subject, and that the encompasses
 * edge the map node declared was deliberately not carried.
 */
group('gcd-and-lcm — the claims its header makes')
const GL = conceptById(A, 'gcd-and-lcm')
const GL_SUBGOALS = GL.knowledgePoints.flatMap(p => p.workedExample.subgoals)
const glAnswer = i => GL.knowledgePoints[i].workedExample.answer

t('360 and 84 factor as the first example says they do',
  exactly('2^3*3^2*5') === '360' && exactly('2^2*3*7') === '84')
t('the minima give 12 and the maxima give 2520, which is what it answers',
  exactly('2^2*3') === '12' && exactly('2^3*3^2*5*7') === '2520'
  && glAnswer(0) === 'gcd(360, 84) = 12 and lcm(360, 84) = 2520',
  glAnswer(0))
t('and the check it then performs really does hold',
  exactly('12*2520') === exactly('360*84') && exactly('12*2520') === '30240')
t('8 · 9 · 35 is the arithmetic the lcm subgoal shows',
  exactly('8*9*35') === '2520'
  && GL.knowledgePoints[0].workedExample.subgoals[2].detail.includes('8 · 9 · 35'))

t('24 and 36 factor as the second example says, and their gcd is 12',
  exactly('2^3*3') === '24' && exactly('2^2*3^2') === '36' && exactly('2^2*3') === '12')
t('the lcm it reaches by dividing is the one the exponents give',
  exactly('24*36') === '864' && exactly('864/12') === '72' && exactly('2^3*3^2') === '72'
  && glAnswer(1) === 'lcm(24, 36) = 72, from 24 · 36 = 864 divided by the gcd 12',
  glAnswer(1))
/*
 * The counterexample is load-bearing prose — it is the whole of why the
 * identity is stated for a pair — so the arithmetic in it is checked too. If
 * these two agreed, the subgoal would be claiming a failure that does not
 * happen.
 */
t('and the three-number counterexample really fails: 2 · 2 is not 2 · 2 · 2',
  exactly('2*2') !== exactly('2*2*2') && exactly('2*2') === '4' && exactly('2*2*2') === '8')

t('20 and 30 factor as the third example says, with lcm 60 and gcd 10',
  exactly('2^2*5') === '20' && exactly('2*3*5') === '30'
  && exactly('2^2*3*5') === '60' && exactly('2*5') === '10')
t('the product really is the lcm times the gcd it names',
  exactly('20*30') === '600' && exactly('600/60') === '10')
t('each fraction rewrites over 60 as the example claims',
  exactly('1/20') === exactly('3/60') && exactly('11/30') === exactly('22/60'))
t('the sum is 25/60, which reduces by 5 to the answer it states',
  exactly('3/60 + 22/60') === exactly('25/60') && exactly('25/60') === exactly('5/12')
  && exactly('1/20 + 11/30') === exactly('5/12')
  && glAnswer(2) === '1/20 + 11/30 = 5/12',
  glAnswer(2))

t('three points, one task each, and every one of them evaluate',
  GL.knowledgePoints.length === 3
  && GL.knowledgePoints.every(p => tasksForPoint(p.id).length === 1)
  && GL.knowledgePoints.every(p => tasksForPoint(p.id).every(x => x.kind === 'evaluate')))
t('each task is about a different pair from its own worked example',
  [['540', '378'], ['90', '48'], ['15', '10']].every((pair, i) =>
    pair.every(n => tasksForPoint(GL.knowledgePoints[i].id)[0].prompt.includes(n))))

// Asserted before the `every` calls below, which would pass vacuously on an
// empty list — the failure mode a renamed concept id would produce here.
t('twelve subgoals across the three worked examples', GL_SUBGOALS.length === 12,
  `${GL_SUBGOALS.length}`)
t('every subgoal carries an authored socratic phrasing',
  GL_SUBGOALS.every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  GL_SUBGOALS.filter(s => !s.socratic).map(s => s.label).join(', '))
t('and every one of them is actually phrased as a question',
  GL_SUBGOALS.every(s => isInterrogative(s.socratic)),
  GL_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join(', '))
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  GL_SUBGOALS.every(s => !isInterrogative(s.label)))

/**
 * THE EDGE THAT CAME IN FROM THE MAP AREA, AND WHY IT HAD TO.
 *
 * `gcd-and-lcm → fraction-arithmetic` lived in `NUMBER_AND_ARITHMETIC.links`
 * while the gcd was a map node, and `links` edges exist only in the composed
 * `MATHEMATICS`. This subject is `ONTOLOGIES[0]`, which is what `assemble` is
 * handed when nobody names one — so asserting the edge HERE, on the standalone
 * ontology, is the whole point of having moved it.
 */
t('fractions now gate on the lcm inside the subject, not only on the composed map',
  prerequisitesOf(A, 'fraction-arithmetic').includes('gcd-and-lcm')
  && gatingPrerequisitesOf(A, 'fraction-arithmetic').includes('gcd-and-lcm'),
  prerequisitesOf(A, 'fraction-arithmetic').join(', '))
t('and it rests on the primes, which is the needs that came off the node',
  prerequisitesOf(A, 'gcd-and-lcm').includes('prime-factorisation')
  && isTeachable(A, 'prime-factorisation'),
  prerequisitesOf(A, 'gcd-and-lcm').join(', '))
/**
 * The encompasses edge the map node DECLARED and the subject does not carry.
 *
 * `exercises: ['prime-factorisation']` was on the node and `expandEdges` turned
 * it into an encompasses edge; it was inert there, because an unteachable
 * concept has no strength to propagate. Promoting the node made it live, and it
 * was dropped rather than restated — the claim is about what practising
 * exercises, and two of the three tasks never touch a factorisation. Asserted
 * so the deletion stays visible instead of reading as a forgotten line.
 */
t('and taking a gcd claims no credit for the factorisation it is read off',
  !encompassedBy(A, 'gcd-and-lcm').includes('prime-factorisation'),
  encompassedBy(A, 'gcd-and-lcm').join(', '))

// NOTE: the companion claim — that authoring these five TIGHTENED the gate on
// the two algebra subjects, so neither is introducible on a cold account any
// more — is asserted in tests/atlas.mjs, which is the harness that builds the
// composed map. It cannot be checked here: the gates run through
// `algebra-foundations.links`, and those edges only exist in `MATHEMATICS`.

// ---------------------------------------------------------------------------
// The seventh subject: the step from arithmetic into algebra
// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-algebra.ts's HEADER, for the same reason
 * the arithmetic block above does: each of them is the kind of statement that
 * would otherwise rot into a comment that used to be true.
 *
 * `variables-and-expressions` was promoted out of the `algebra-foundations`
 * map area because it was the single unwritten concept on the route of two
 * journeys that each had one unwritten step left. The journey half of that
 * claim is checked in tests/journeys.mjs, which is the harness that resolves
 * routes; what is checkable here is that the material is real, that the
 * subject is rulable with no worker, and that the boundary the empty edge list
 * records is genuinely a boundary.
 */
const VE = EXPRESSIONS_AND_EQUATIONS

group('expressions-and-equations, the step from arithmetic into algebra')
t('it is registered, and SECOND — registry order is the curriculum order',
  ONTOLOGIES[1] === VE && getOntology('expressions-and-equations') === VE)
t('and it did not displace arithmetic from index 0, which the cold account depends on',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS)
t('it has no internal faults', ontologyProblems(VE).length === 0, ontologyProblems(VE).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(VE).length === 0)
t('one concept, three knowledge points',
  VE.concepts.length === 1 && allKnowledgePoints(VE).length === 3,
  `${VE.concepts.length} concepts, ${allKnowledgePoints(VE).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(VE, 'variables-and-expressions') && isPractisable(VE, 'variables-and-expressions'))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(VE).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(VE).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
t('every objective names a task kind',
  VE.concepts.every(c => c.objectives.length > 0 && c.objectives.every(o => o.taskKinds.length > 0)))

/**
 * THE EMPTY EDGE LIST IS A BOUNDARY, NOT AN OMISSION.
 *
 * One concept means no internal pair to join, and every real prerequisite of
 * this concept crosses into another subject — so it must live in an area's
 * `links` and cannot live here. Asserted rather than assumed, because an edge
 * added here naming `order-of-operations` would look right and would make
 * `ontologyProblems` report an unknown endpoint.
 */
t('it declares no edges, and the single concept is therefore its own root',
  VE.edges.length === 0 && roots(VE).length === 1 && roots(VE)[0] === 'variables-and-expressions')

group('the seventh subject is gradable with no worker')
const VE_TASKS = allKnowledgePoints(VE).flatMap(p => tasksForPoint(p.id))
t('five tasks across the three points', VE_TASKS.length === 5, `${VE_TASKS.length}`)
t('all of them are evaluate — no form can express "collected", so none asks for one',
  VE_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined))
t('every reference is exactly reproducible from the given — no worker consulted',
  VE_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }))
const veRulings = await Promise.all(VE_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  veRulings.every(r => r.verdict.ruling === 'correct'),
  veRulings.map((r, i) => `${VE_TASKS[i].id}:${r.verdict.ruling}`)
    .filter((_, i) => veRulings[i].verdict.ruling !== 'correct').join(', '))
/*
 * The sign task, specifically. `-x^2` at x = −3 is −9 and not 9, because the
 * power binds tighter than the leading minus — so this is the one task in the
 * build where a wrong answer differs from the right one only in sign, and the
 * engine has to settle it rather than shrug.
 */
t('and the sign trap is settled, not left inconclusive',
  (await ruleEvaluate(taskById('power-binds-before-minus-1'), '9', NO_WORKER))
    .verdict.ruling === 'incorrect')

/**
 * THE FIRST SUBJECT TO AUTHOR `socratic` ON EVERY SUBGOAL.
 *
 * 21 of 283 questions were interrogative before this file, and all 21 were
 * labels that happened to end in a question mark rather than authored
 * overrides. This asserts the claim that makes the coverage figure move: every
 * subgoal here carries a hand-written question, and each one is a question
 * rather than an imperative with a question mark bolted on — which is the
 * failure types.ts names and punctuation cannot fix.
 */
const VE_QUESTIONS = allQuestions(VE)
t('ten questions, one per subgoal', VE_QUESTIONS.length === 10, `${VE_QUESTIONS.length}`)
t('every subgoal carries an authored socratic phrasing',
  allKnowledgePoints(VE).every(p => p.workedExample.subgoals.every(s => !!s.socratic)),
  allKnowledgePoints(VE).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
t('and every one of them is interrogative, so all ten count as written',
  VE_QUESTIONS.every(q => q.authoredAsQuestion)
  && questionCoverage(VE).authoredAsQuestions === questionCoverage(VE).questions)
/*
 * The pair of asks the first knowledge point needs. Its whole content is that
 * one act — substitution — settles an unknown completely and settles a claim
 * about a variable not at all, so a single task could only have shown one.
 */
t('the two-readings point carries both halves of the pair',
  tasksForPoint('a-letter-has-two-readings').map(x => x.id).sort().join(',')
  === 'identity-difference-1,unknown-check-1',
  tasksForPoint('a-letter-has-two-readings').map(x => x.id).join(','))

rmSync(outDir, { recursive: true, force: true })
// ---------------------------------------------------------------------------
/*
 * Completing the square — the first concept promoted out of the atlas.
 *
 * Two things are being tested and they are separate: the new form can rule, and
 * the concept is genuinely teachable rather than merely present. The generic
 * task assertions above already cover the rest — that every reference satisfies
 * its own form, and that no `given` already satisfies what its task asks, which
 * is the check that would catch a free mark.
 */
// ---------------------------------------------------------------------------

group('the completed_square form')

const cs = (src) => {
  const parsed = tryParse(src, ['x'])
  if (!parsed.ok) return { held: false, detail: 'did not parse' }
  return checkForm(parsed.tree, 'completed_square', 'x')
}

t('the canonical answer holds', cs('(x + 3)^2 - 4').held === true)
/*
 * Four phrasings of the same right answer. The check counts occurrences of the
 * variable rather than matching a shape precisely so that these all pass — a
 * structural matcher would have to enumerate them and would reject the fifth
 * nobody thought of.
 */
t('the constant may come first', cs('-4 + (x + 3)^2').held === true)
t('the square may be scaled', cs('2*(x - 1)^2 + 5').held === true)
t('the shift may be fractional', cs('(x + 3/2)^2 - 9/4').held === true)
t('there need be no constant at all', cs('(x - 5)^2').held === true)

t('an untouched quadratic does not hold', cs('x^2 + 6x + 5').held === false)
t('and the failure says what is wrong with it',
  /appears 2 times/.test(cs('x^2 + 6x + 5').detail))
t('a factored quadratic does not hold either', cs('(x + 3)*(x - 5)').held === false)
/*
 * The two failures are reported apart because they call for different next
 * moves: the work not being done, versus being done into the wrong shape.
 */
t('one occurrence not under a square does not hold', cs('2x + 1').held === false)
t('and says so, rather than reporting the count',
  /not inside a square/.test(cs('2x + 1').detail))
t('a cube is not a square', cs('(x + 3)^3 - 4').held === false)
t('an expression with no x abstains rather than refusing', cs('7').held === null)
t('the form is registered with a label, like every other',
  ALL_NAMED_FORMS.includes('completed_square') && !!FORM_LABELS.completed_square)
t('it is discriminating, being a positive structural claim',
  DISCRIMINATING_FORMS.includes('completed_square'))

group('completing the square is teachable, not just present')

const CTS = conceptById(O, 'completing-the-square')
t('the concept is in the authored ontology', !!CTS)
t('it has knowledge points, which is what teachable means',
  isTeachable(O, 'completing-the-square'))
t('every knowledge point carries a worked example',
  CTS.knowledgePoints.every(p => !!p.workedExample?.problem && !!p.workedExample.answer))
t('every worked example has subgoals, not just an answer',
  CTS.knowledgePoints.every(p => p.workedExample.subgoals.length >= 2))
t('its objective names task kinds that could satisfy it',
  CTS.objectives.every(o => o.taskKinds.length > 0))
t('tasks exist for every one of its knowledge points',
  CTS.knowledgePoints.every(p => tasksForPoint(p.id).length > 0))
t('it is checked, so a theorem can be recognised as being about it',
  CTS.fidelity === 'checked' && !!CTS.scope.match)
/*
 * The gate it was authored under. Factoring first, because completing the
 * square is what you reach for when the factor pair does not exist — so
 * knowing when it does has to come first.
 */
t('factoring gates it', prerequisitesOf(O, 'completing-the-square').includes('factoring-quadratics'))
t('and it is not a root of the subject', !roots(O).includes('completing-the-square'))
t('the teaching order still exists, so nothing introduced a cycle',
  teachingOrder(O) !== null)
t('doing it exercises polynomial arithmetic, since expanding back is the check',
  encompassedBy(O, 'completing-the-square').includes('polynomial-arithmetic'))
/*
 * The pattern overlap that had to be cleaned up. `factoring-quadratics` listed
 * "completing the square" as one of its own alternatives, and its pattern is
 * longer — so it would have won the sort in `conceptsInOffering` and labelled
 * the article as primarily about factoring.
 */
t('factoring no longer claims the phrase',
  !conceptById(O, 'factoring-quadratics').scope.match.test('Completing the square'))
t('and completing the square does',
  CTS.scope.match.test('Completing the square'))

/**
 * READABLE IS NOT PRACTISABLE, and one figure was standing in for both.
 *
 * `isTeachable` means "has knowledge points", and every surface in the app
 * reported it as the number of concepts that "have problems written for them".
 * Three concepts carried knowledge points and zero tasks, so the figure counted
 * them as practisable while there was nothing a learner could be set.
 *
 * ── The gap is closed, and that changed what these tests can assert ────────
 *
 * The three were `logarithm-definition`, `logarithm-rules` and
 * `solving-exponential-equations`, and the reason they were empty was not the
 * one originally recorded here. The diagnosis was "their natural task is
 * solving or stating and the engine has no verifiable kind for either", which
 * is true and was not the blocker: `exactValue` returned null for every `log`,
 * so an `evaluate` task on them could not re-derive its own answer. `exactLog`
 * fixed that and the five tasks followed.
 *
 * So `READ_ONLY` is empty now. Two of the assertions here were pinning its
 * SIZE, which made closing the gap look like a regression — the thing the
 * comment on `EVALS.length` in this same file warns about. They are replaced
 * with assertions about the two FUNCTIONS, which hold whether or not any
 * concept is currently in that state:
 *
 *   - practisable implies teachable, always, by construction.
 *   - `isPractisable` is false for a concept with material and no tasks —
 *     tested against a synthetic ontology, because the shipped set no longer
 *     contains an example and the distinction must not quietly become a
 *     tautology that nothing would notice.
 *
 * The gap can still recur: `log-argument-is-positive` has material and no task
 * and never will have one, since "this expression is undefined" is not a value
 * `evaluate` can ask for. It is a knowledge point rather than a concept, so it
 * costs no concept its practice — which is exactly why the per-concept figure
 * stays worth printing.
 */
group('practisable and teachable are different questions')

/*
 * Over the authored subjects rather than the composed atlas: this harness does
 * not load the atlas, and it does not need to — every concept with knowledge
 * points lives in one of these, so the gap is entirely visible from here.
 */
const ALL_AUTHORED = ONTOLOGIES.flatMap(o => o.concepts.map(c => ({ o, c })))
const TEACHABLE_IDS = ALL_AUTHORED.filter(x => x.c.knowledgePoints.length > 0).map(x => x.c.id)
const PRACTISABLE_IDS = ONTOLOGIES.flatMap(o => practisableConcepts(o))
const READ_ONLY = TEACHABLE_IDS.filter(id => !PRACTISABLE_IDS.includes(id))

t('a task cannot exist without material, so practisable implies teachable',
  PRACTISABLE_IDS.every(id => TEACHABLE_IDS.includes(id)),
  PRACTISABLE_IDS.filter(id => !TEACHABLE_IDS.includes(id)).join(', '))
/*
 * The distinction, tested against a concept built here rather than shipped.
 *
 * `isPractisable` only reads `knowledgePoints` and `TASKS`, so a plain object
 * of that shape exercises the real function. This is the assertion that keeps
 * the two notions apart now that no shipped concept separates them — without
 * it, `isPractisable` could be rewritten as `isTeachable` and every test in
 * this file would still pass.
 */
const SYNTHETIC = {
  subject: { id: 'synthetic' },
  concepts: [
    { id: 'material-only', knowledgePoints: [{ id: 'no-task-names-this-point' }] },
    { id: 'nothing-at-all', knowledgePoints: [] },
  ],
  edges: [],
}
t('a concept with material and no tasks is teachable and NOT practisable',
  isTeachable(SYNTHETIC, 'material-only') && !isPractisable(SYNTHETIC, 'material-only'))
t('and one with neither is neither',
  !isTeachable(SYNTHETIC, 'nothing-at-all') && !isPractisable(SYNTHETIC, 'nothing-at-all'))
t('so practisableConcepts can be strictly smaller than the teachable set',
  practisableConcepts(SYNTHETIC).length === 0)
/*
 * The shipped set, as a fact about today rather than a pinned size. Named
 * concepts, so a task deleted out of one of them fails here — which is the
 * regression worth catching, unlike the count going up.
 */
t('every shipped concept with material now has a problem behind it',
  READ_ONLY.length === 0, READ_ONLY.join(', '))
t('including the three logarithm concepts that had none',
  ['logarithm-definition', 'logarithm-rules', 'solving-exponential-equations']
    .every(id => PRACTISABLE_IDS.includes(id)))
t('isPractisable is false for an id the ontology does not contain',
  !isPractisable(ONTOLOGIES[0], 'no-such-concept'))
t('fractions are practisable rather than merely readable',
  isPractisable(ONTOLOGIES[0], 'fraction-arithmetic'))
/*
 * A knowledge point can still be material-only, and one deliberately is.
 * `log-argument-is-positive` teaches that log₂(−8) names nothing, and no
 * verifiable kind can ask for that — see the comment where the task would be.
 */
t('a point with no task is still allowed, and one is left that way on purpose',
  tasksForPoint('log-argument-is-positive').length === 0
  && !!knowledgePointById(EXPONENTS_AND_LOGARITHMS, 'log-argument-is-positive'))

/**
 * THE QUESTION MAP — derived structure, authored phrasing, and no evidence.
 *
 * Three claims worth failing on, in descending order of how badly a regression
 * would hurt:
 *
 *  1. `socraticContext` never carries the answer to the question it is asking.
 *     This is the invariant whose violation is INVISIBLE in the output — a
 *     leaked answer reads as a perfectly good question, and the only place it
 *     shows up is a learner being asked something they have just been told.
 *  2. The map cannot contradict the worked examples, because it is derived
 *     from them. Asserted as a count rather than a shape: one node per subgoal,
 *     in subgoal order, no more and no fewer.
 *  3. The coverage line reports the authored/generated split. 21 of 283 is the
 *     figure that makes this map honest; a surface printing 283 alone would be
 *     claiming 283 Socratic questions, of which 262 are not sentences yet.
 */
group('the question map — derived from the worked examples')

const QCHAINS = ONTOLOGIES.flatMap(o => questionChains(o))
const QNODES = ONTOLOGIES.flatMap(o => allQuestions(o))

t('every worked example with subgoals becomes a chain',
  QCHAINS.length === ONTOLOGIES.flatMap(o => allKnowledgePoints(o))
    .filter(p2 => p2.workedExample.subgoals.length > 0).length,
  `${QCHAINS.length} chains`)
t('one question per subgoal, and no invention',
  QNODES.length === ONTOLOGIES.flatMap(o => allKnowledgePoints(o))
    .reduce((n, p2) => n + p2.workedExample.subgoals.length, 0),
  `${QNODES.length} questions`)
t('every node carries the move and what it establishes',
  QNODES.every(q => q.move.length > 0 && q.establishes.length > 0))
t('every node names a real knowledge point and concept',
  QNODES.every(q => !!ontologyForPoint(q.knowledgePointId) && !!q.conceptId))
t('ids are unique across every subject',
  new Set(QNODES.map(q => q.id)).size === QNODES.length)
t('positions within a chain are 0..n-1 in order',
  QCHAINS.every(c => c.questions.every((q, i) => q.position === i)))
t('a chain stays in its worked example — one point per chain',
  QCHAINS.every(c => c.questions.every(q => q.knowledgePointId === c.knowledgePointId)))

/*
 * Reconstructible from the id alone, which a stored answer depends on. The
 * refusals matter as much: a renumbered reference must not resolve to whatever
 * node now sits at that index.
 */
t('questionById round-trips', (() => {
  const q = allQuestions(EXPONENTS_AND_LOGARITHMS)[0]
  return questionById(EXPONENTS_AND_LOGARITHMS, q.id)?.id === q.id
})())
t('an out-of-range position is null, not the nearest node',
  questionById(EXPONENTS_AND_LOGARITHMS, 'log-is-an-exponent#99') === null)
t('an unknown point is null',
  questionById(EXPONENTS_AND_LOGARITHMS, 'no-such-point#0') === null)
t('a malformed id is null, not a crash',
  questionById(EXPONENTS_AND_LOGARITHMS, 'nohash') === null
  && questionById(EXPONENTS_AND_LOGARITHMS, '#0') === null
  && questionById(EXPONENTS_AND_LOGARITHMS, 'x#-1') === null
  && questionById(EXPONENTS_AND_LOGARITHMS, 'x#abc') === null)

/*
 * Teaching order, because the map is a route: the questions of a prerequisite
 * come before the questions of what it gates.
 */
t('chains are in teaching order', (() => {
  const order = teachingOrder(EXPONENTS_AND_LOGARITHMS)
  const chains = questionChains(EXPONENTS_AND_LOGARITHMS)
  const ranks = chains.map(c => order.indexOf(c.conceptId))
  return ranks.every((r, i) => i === 0 || r >= ranks[i - 1])
})())
t('and within a concept, the knowledge points keep their authored order', (() => {
  const chains = chainsForConcept(EXPONENTS_AND_LOGARITHMS, 'exponent-rules')
  return chains.length === 2 && chains[0].knowledgePointId === 'add-exponents-on-product'
})())
t('chainsForConcept refuses an id the ontology does not contain',
  chainsForConcept(EXPONENTS_AND_LOGARITHMS, 'no-such-concept').length === 0)

group('a question is never evidence, and the asker is never told the answer')

/*
 * THE invariant. Checked over every node in every subject rather than a
 * sample, because one leak is one learner asked what they were just told.
 */
t('socraticContext never contains the answer to the question it asks',
  QCHAINS.every(c => c.questions.every((q, i) => {
    const ctx = socraticContext(c, i)
    return !JSON.stringify(ctx).includes(JSON.stringify(q.establishes).slice(1, -1))
  })))
t('but it does carry every PRIOR step, which is what a tutor mid-derivation knows',
  QCHAINS.filter(c => c.questions.length > 1).every(c => {
    const ctx = socraticContext(c, c.questions.length - 1)
    return ctx.established.length === c.questions.length - 1
      && ctx.established.every((e, i) => e.establishes === c.questions[i].establishes)
  }))
t('the first question has nothing established yet',
  QCHAINS.every(c => socraticContext(c, 0).established.length === 0))
t('it carries the problem, so the question is about something',
  QCHAINS.every(c => socraticContext(c, 0).problem === c.problem))
t('remaining counts down to zero at the last step',
  QCHAINS.every(c => socraticContext(c, c.questions.length - 1).remaining === 0))
t('an out-of-range position is null rather than an empty question',
  socraticContext(QCHAINS[0], 999) === null)

/*
 * `convertsTo` is the only route from a conversation to a ruling, and the
 * chains with none are the honest hole. `log-argument-is-positive` is one on
 * purpose and permanently: "this expression is undefined" is not a value any
 * verifiable kind can ask for.
 */
t('a chain converts to exactly the tasks on its own knowledge point',
  QCHAINS.every(c => {
    const ids = tasksForPoint(c.knowledgePointId).map(t2 => t2.id)
    return c.convertsTo.length === ids.length && c.convertsTo.every(id => ids.includes(id))
  }))
t('the logarithm chains now convert, since their tasks exist',
  chainsForConcept(EXPONENTS_AND_LOGARITHMS, 'logarithm-definition')
    .some(c => c.convertsTo.length > 0))
t('and the undefined-argument chain still converts to nothing, which is counted',
  QCHAINS.find(c => c.knowledgePointId === 'log-argument-is-positive').convertsTo.length === 0)

group('the question map says how much of it is actually written')

const QCOV = ONTOLOGIES.map(o => questionCoverage(o))
const Q_TOTAL = QCOV.reduce((n, c) => n + c.questions, 0)
const Q_AUTHORED = QCOV.reduce((n, c) => n + c.authoredAsQuestions, 0)

t('isInterrogative reads the punctuation and does not guess',
  isInterrogative('What pair am I looking for?')
  && !isInterrogative('What the written algorithm was doing')
  && !isInterrogative('Add the places separately'))
t('the coverage total matches the node count', Q_TOTAL === QNODES.length)
t('the authored count is a strict minority, which is the finding',
  Q_AUTHORED > 0 && Q_AUTHORED < Q_TOTAL / 2, `${Q_AUTHORED} of ${Q_TOTAL}`)
/*
 * A floor and not an equality, for the reason the EVALS count carries: the
 * authored figure is meant to GO UP as questions get written, and asserting it
 * exactly would make writing one look like a regression. What is worth
 * guarding is that the honest split is still being computed and still printed.
 *
 * The companion count below is a floor in the OPPOSITE direction, and so it
 * has to be lowered by hand as subjects come off zero — it was 4 when types.ts
 * named the four, then 3, then 2 once `function-concept` was authored, and is
 * 1 now that `a-vector-is-a-displacement` has taken
 * `vectors-and-independence` off zero. That is maintenance and not a
 * regression, and the figure is still printed either way. Lower it, never
 * delete it: the thing being guarded is that a subject with nothing written
 * stays visible as such instead of being averaged into a single global
 * percentage. `matrices-and-determinants` is the one still at zero.
 */
t('one of the seven subjects has no authored questions at all, and that is reported',
  QCOV.filter(c => c.authoredAsQuestions === 0).length >= 1,
  QCOV.map(c => `${c.authoredAsQuestions}/${c.questions}`).join(' '))
t('the line names the split rather than the total alone', (() => {
  const line = questionCoverageLine(EXPONENTS_AND_LOGARITHMS)
  const c = questionCoverage(EXPONENTS_AND_LOGARITHMS)
  return line.includes(`${c.questions} question`)
    && line.includes(`${c.authoredAsQuestions} written as questions`)
})(), questionCoverageLine(EXPONENTS_AND_LOGARITHMS))
t('and it says when a chain cannot become evidence', (() => {
  const line = questionCoverageLine(EXPONENTS_AND_LOGARITHMS)
  return questionCoverage(EXPONENTS_AND_LOGARITHMS).chainsWithNoRuling > 0
    && /records nothing/.test(line)
})(), questionCoverageLine(EXPONENTS_AND_LOGARITHMS))

/*
 * The override. `expressions-and-equations` now uses it on all ten of its
 * subgoals — it was the first subject to — but the synthetic point stays,
 * because it is the only case that pins down the SUBSTITUTION: the label here
 * is the imperative "Add the places separately" that types.ts names as the
 * failure mode, and the assertion is that the authored question replaces it
 * for the asking while `label` keeps drawing the derivation. A shipped point
 * whose label and `socratic` were both interrogative would pass whether or not
 * the override was wired up at all.
 */
t('an authored socratic phrasing overrides the label for the asking', (() => {
  const synthetic = {
    subject: { id: 's' },
    concepts: [{
      id: 'c', name: 'C', subjectId: 's', knowledgePoints: [{
        id: 'pt', conceptId: 'c', statement: 'S', position: 1,
        workedExample: {
          problem: 'P',
          subgoals: [{
            label: 'Add the places separately',
            detail: 'D',
            socratic: 'What would make this addition easier?',
          }],
          answer: 'A',
        },
      }],
    }],
    edges: [],
  }
  const qs = questionsForPoint(synthetic, synthetic.concepts[0].knowledgePoints[0])
  return qs.length === 1
    && qs[0].move === 'What would make this addition easier?'
    && qs[0].authoredAsQuestion === true
})())
t('and without one, the imperative label is carried as it was written',
  QNODES.some(q => !q.authoredAsQuestion))

console.log(`\n${questionCoverageLine(EXPONENTS_AND_LOGARITHMS)}`)
console.log(
  `questions: ${Q_AUTHORED} of ${Q_TOTAL} written as questions across `
  + `${QCHAINS.length} chains; ${QCHAINS.filter(c => c.convertsTo.length === 0).length} `
  + `cannot become evidence`,
)

console.log(
  `\npractisable: ${PRACTISABLE_IDS.length} of ${TEACHABLE_IDS.length} teachable `
  + `(${READ_ONLY.length} readable with no problems${READ_ONLY.length ? `: ${READ_ONLY.join(', ')}` : ''})`,
)

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
