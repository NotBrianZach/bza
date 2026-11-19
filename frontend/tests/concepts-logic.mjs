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
    join('lib', 'concepts', 'socratic.ts'),
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
    socratic: require(join(outDir, 'concepts', 'socratic.js')),
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
  exactValue, substitute, showExact, ruleEvaluate, rule, ruleTransform,
  asSurd, sameSurd, showSurd,
} = M.verify
const { agreeAtPoints } = M.numerals
const {
  isInterrogative, questionsForPoint, questionChains, allQuestions, questionById,
  questionCoverage, questionCoverageLine, socraticContext, chainsForConcept,
} = M.questions
const {
  openingsForConcept, openingForPoint, chainForPoint, unmetBefore, walkTerminus,
  revealOf, unphrasedQuestion, socraticPrompt, nudgePrompt, promptFor,
} = M.socratic
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

/*
 * The two forms that make a claim about an integer subterm rather than about
 * the top-level shape of the answer.
 *
 * They exist because three authored arithmetic concepts each worked around
 * their absence — see the headers of `prime-factorisation`, `gcd-and-lcm` and
 * `roots-and-irrationals`, all of which compute WITH a factorisation they are
 * handed because neither `factored` nor `radical_free` could ask for one.
 *
 * The abstention cases are the ones worth having. A form check that GUESSED
 * would mark a learner wrong for writing something the checker was too simple
 * to read, and both of these can be handed input they genuinely cannot rule:
 * a symbolic radicand, or a number too large to factorise.
 */
group('form: prime_factored')
const pfac = s => checkForm(p(s), 'prime_factored', 'x')
t('a collected factorisation holds', pfac('2*3*5^2*7^2').held === true)
t('the same primes written out flat hold too — nothing demands the repeats collect',
  pfac('2*3*5*5*7*7').held === true)
t('THE INPUT IS REFUSED, which is the whole point of the form',
  pfac('7350').held === false)
t('…and the message hands back the factorisation, since the learner has not started',
  /2 · 3 · 5\^2 · 7\^2/.test(pfac('7350').detail))
t('a single prime is already a product of primes, as x + 3 is already factored',
  pfac('7').held === true)
t('one composite factor among primes is refused, and named',
  pfac('2*3*25').held === false && /25/.test(pfac('2*3*25').detail))
t('a sum is refused', pfac('2 + 3').held === false)
t('a fraction is refused', pfac('6/2').held === false)
t('anything with a letter in it is refused', pfac('2*3*x').held === false)
t('a composite power is refused — 4^2 is not a prime power', pfac('4^2').held === false)
t('a prime power with a prime exponent still reads as one prime',
  pfac('2^3').held === true && /2\^3/.test(pfac('2^3').detail))
t('a number past the factorisation ceiling abstains rather than hanging',
  pfac('1000000000000031').held === null)
t('…and says so', /too large/.test(pfac('1000000000000031').detail))

/*
 * `asSurd` — the normal form that makes a surd comparison a decision.
 *
 * For distinct square-free r the numbers √r are linearly independent over the
 * rationals, so two single-term surds are equal exactly when their normal forms
 * agree. The abstentions matter as much as the equalities: a sum of surds is
 * NOT handled, and must return null rather than a guess.
 */
group('asSurd — simple surds in normal form')
const sd = s => asSurd(p(s))
const sshow = s => (sd(s) === null ? 'null' : showSurd(sd(s)))
t('an unsimplified root normalises', sshow('sqrt(720)') === '12*sqrt(5)')
t('an already-simplified one is unchanged', sshow('12*sqrt(5)') === '12*sqrt(5)')
t('and the two are therefore the same number', sameSurd(sd('sqrt(720)'), sd('12*sqrt(5)')))
t('a perfect square comes out rational', sshow('sqrt(144)') === '12')
t('a rational is a surd with radicand 1', sshow('7/4') === '7/4' && sd('7/4').r === 1n)
t('a root of a fraction rationalises', sshow('sqrt(49/16)') === '7/4')
t('a non-square fraction keeps a whole radicand', sshow('sqrt(1/2)') === '1/2*sqrt(2)')
t('a fractional exponent is the same thing written differently',
  sameSurd(sd('720^(1/2)'), sd('sqrt(720)')))
t('radicands combine and re-normalise — sqrt6 * sqrt15 = 3 sqrt10',
  sshow('sqrt(6)*sqrt(15)') === '3*sqrt(10)')
t('a quotient of surds rationalises its denominator',
  sshow('sqrt(6)/sqrt(3)') === 'sqrt(2)')
t('a negated surd keeps its sign', sshow('-sqrt(8)') === '-2*sqrt(2)')
t('a coefficient multiplies through', sshow('3*sqrt(8)') === '6*sqrt(2)')
t('sqrt(1) is 1, not a radicand of 1 times something odd', sshow('sqrt(1)') === '1')
t('sqrt(0) is 0', sshow('sqrt(0)') === '0')
// The abstentions. Each of these must reach the worker rather than be guessed.
t('A SUM OF SURDS ABSTAINS — deciding those needs real algebraic machinery',
  sd('sqrt(2) + sqrt(3)') === null)
t('an irrational constant abstains', sd('pi') === null)
t('a symbol abstains', sd('x') === null)
// An IRRATIONAL cube root abstains — this handles square roots only. A cube
// root that comes out rational is simply a rational, and `8^(1/3)` is 2, so
// reading it as one is right rather than an overreach.
t('an irrational cube root abstains — this handles square roots only',
  sd('2^(1/3)') === null)
t('…but a cube root that IS rational is read as that rational',
  sshow('8^(1/3)') === '2')
t('a negative radicand abstains rather than going complex', sd('sqrt(-4)') === null)
t('a radicand past the ceiling abstains', sd('sqrt(1000000000000031)') === null)
// Distinct square-free radicands must never compare equal, which is the
// linear-independence property the whole approach rests on.
t('distinct square-free radicands are different numbers',
  !sameSurd(sd('sqrt(2)'), sd('sqrt(3)'))
  && !sameSurd(sd('2*sqrt(3)'), sd('3*sqrt(2)')))

group('form: surd_reduced')
const sr = s => checkForm(p(s), 'surd_reduced', 'x')
t('a square-free radicand holds', sr('12*sqrt(5)').held === true)
t('THE UNSIMPLIFIED ROOT IS REFUSED — radical_free could not say this',
  sr('sqrt(720)').held === false)
t('…and the message names the square to take out and what comes out of it',
  /square 144/.test(sr('sqrt(720)').detail) && /12 can still come out/.test(sr('sqrt(720)').detail))
t('radical_free disagrees with both, which is why this form had to be added',
  checkForm(p('12*sqrt(5)'), 'radical_free', 'x').held === false
  && checkForm(p('sqrt(720)'), 'radical_free', 'x').held === false)
t('a rational answer satisfies it — nothing is under a radical', sr('7/4').held === true)
t('so does an ordinary polynomial, which is why it is not discriminating',
  sr('x^2 - 2x - 15').held === true)
t('a sum of surds is ruled on every radicand, not just the first',
  sr('sqrt(5) + sqrt(50)').held === false && sr('sqrt(5) + sqrt(7)').held === true)
t('a fractional exponent is the same claim written differently',
  sr('720^(1/2)').held === false)
t('a symbolic radicand abstains rather than guessing', sr('sqrt(x)').held === null)
t('…and a radicand too large to factorise abstains too',
  sr('sqrt(1000000000000031)').held === null)
// Both of these reached the "too large" branch before being special-cased:
// factoriseInteger returns null for them, and that null means "not answerable"
// rather than "big". A wrong message is a smaller bug than a wrong ruling and
// is still worth not shipping.
t('a radicand of 1 is already reduced, not "too large"',
  sr('sqrt(1)').held === true && !/too large/.test(sr('sqrt(1)').detail))
t('and so is 0', sr('sqrt(0)').held === true)
t('a negative radicand abstains rather than having its sign stripped',
  sr('sqrt(-4)').held === null && /negative/.test(sr('sqrt(-4)').detail))

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

/*
 * Every symbol a task USES is declared — which is what this assertion was
 * always for, and is strictly stronger than the `variables.length > 0` it
 * replaced.
 *
 * The old form was a proxy, and it was the proxy that made ontology.ts record
 * "every task must declare a symbol, so 'what is gcd(48, 180)' has no honest
 * shape in this schema at all". That conclusion was about this line rather than
 * about the schema: a task whose given and reference are both numeric has no
 * symbol to declare, and demanding a vestigial one would have it lie about what
 * it uses. Such a task is now gradable with no worker (see `ruleTransform`
 * step 2a), so there is nothing left for a declaration to buy it.
 *
 * What a declaration is actually needed FOR is unchanged and still checked: the
 * two assertions below parse the given and the reference under exactly the
 * declared names, so an undeclared symbol fails to parse and is caught there.
 * This one catches the subtler case those two cannot — a symbol that parses
 * because it was declared somewhere else in the list, and a declaration list
 * that has drifted from the expression it describes.
 */
t('every symbol a task uses is declared, and a numeric task needs no declarations',
  TASKS.every(task => {
    const declared = task.variables.map(v => v.name)
    const given = tryParse(task.given, declared)
    const reference = tryParse(task.reference, declared)
    if (!given.ok || !reference.ok) return false
    const used = new Set([...symbolsIn(given.tree), ...symbolsIn(reference.tree)])
    return [...used].every(s => declared.includes(s))
  }))
t('…and the numeric ones are exactly the tasks that declare nothing',
  TASKS.filter(task => task.variables.length === 0)
    .every(task => symbolsIn(tryParse(task.given, []).tree ?? { kind: 'integer', value: '0' }).length === 0),
  `${TASKS.filter(t2 => t2.variables.length === 0).length} task(s) declare no symbols`)
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
/*
 * `transform_to_form` settled with NO WORKER, which this file previously said
 * was out of scope — "whether an answer is mathematically equivalent to another
 * needs a CAS, the CAS is the worker, and a test that faked it would be
 * asserting the fake".
 *
 * That is still true of the general case and these assertions do not touch it.
 * What changed is a narrow class: when neither side has a free symbol and
 * `exactValue` settles both, equivalence is bigint comparison rather than CAS
 * work. No worker is faked below — NO_WORKER has a null url, so any assertion
 * here that reached the worker would come back `inconclusive` and fail.
 *
 * This is what lets `arithmetic-foundations` ask the question its
 * `prime-factorisation` concept actually teaches instead of a proxy for it.
 */
group('transform_to_form settled by exact arithmetic — no worker, no CAS')
const pfTask = taskById('prime-factorisation-factorise-1')
t('the factorisation is accepted, and the worker was never consulted',
  (await ruleTransform(pfTask, '2*3*5*7*11', NO_WORKER)).verdict.ruling === 'correct')
t('…and the method says so rather than naming a CAS',
  /no worker was needed/.test((await ruleTransform(pfTask, '2*3*5*7*11', NO_WORKER)).verdict.method))
t('THE INPUT HANDED BACK IS REFUSED — the free mark this form exists to close',
  (await ruleTransform(pfTask, '2310', NO_WORKER)).verdict.ruling === 'incorrect')
t('…and it is refused at the FORM step, before equivalence is even considered',
  (await ruleTransform(pfTask, '2310', NO_WORKER)).verdict.brokeAt.step === 1)
// A composite factorisation is in the wrong shape AND would be caught by the
// form check first; a product of primes with the wrong value is in the right
// shape and has to be caught by the exact comparison at step 2.
t('a product of primes with the wrong value fails at the equivalence step',
  (await ruleTransform(pfTask, '2*3*5*7*13', NO_WORKER)).verdict.brokeAt.step === 2)
t('…and the message names both numbers',
  /2730/.test((await ruleTransform(pfTask, '2*3*5*7*13', NO_WORKER)).verdict.brokeAt.detail)
  && /2310/.test((await ruleTransform(pfTask, '2*3*5*7*13', NO_WORKER)).verdict.brokeAt.detail))
t('a partly-factored answer is refused, naming the composite factor',
  (await ruleTransform(pfTask, '2*3*385', NO_WORKER)).verdict.ruling === 'incorrect')
/*
 * And the same path for surds, which is what `surd_reduced` was waiting on.
 *
 * `exactValue` still refuses an irrational surd — that has not changed and is
 * asserted below, because it is why this needed `asSurd` rather than being
 * free. What `asSurd` adds is a normal form, so √1008 and 12√7 are decided
 * against each other without a CAS and without either having a rational value.
 */
t('exactValue alone still cannot settle a surd — asSurd is what made this possible',
  exactValue(parseExpression('sqrt(1008)', [])) === null
  && exactValue(parseExpression('12*sqrt(7)', [])) === null)
const srTask = taskById('simplify-a-surd-1')
t('the simplified surd is accepted with no worker',
  (await ruleTransform(srTask, '12*sqrt(7)', NO_WORKER)).verdict.ruling === 'correct')
t('…and the method names the surd comparison rather than a CAS',
  /surd comparison/.test((await ruleTransform(srTask, '12*sqrt(7)', NO_WORKER)).verdict.method))
t('THE UNSIMPLIFIED ROOT IS REFUSED, at the form step',
  (await ruleTransform(srTask, 'sqrt(1008)', NO_WORKER)).verdict.ruling === 'incorrect'
  && (await ruleTransform(srTask, 'sqrt(1008)', NO_WORKER)).verdict.brokeAt.step === 1)
t('a partly-simplified root is refused, naming what can still come out',
  (await ruleTransform(srTask, '2*sqrt(252)', NO_WORKER)).verdict.ruling === 'incorrect')
t('a square-free but WRONG radicand fails at the equivalence step, not the form step',
  (await ruleTransform(srTask, '12*sqrt(5)', NO_WORKER)).verdict.brokeAt.step === 2)
t('a decimal approximation is refused — exactness is the point of the concept',
  (await ruleTransform(srTask, '31.75', NO_WORKER)).verdict.ruling === 'incorrect')
// The remaining limit, pinned so nobody assumes it goes further than it does.
t('a SUM of surds still abstains and would need the worker',
  asSurd(parseExpression('sqrt(2) + sqrt(3)', [])) === null)

/*
 * The evaluate free mark, closed.
 *
 * `ruleEvaluate` used to ask an answer for two things only: no free symbol, and
 * exact equality with the given at its inputs. Substituting the inputs and
 * stopping satisfies both, so `2/3 + 1/4` was ruled CORRECT for a task asking
 * for 2/3 + 1/4 — no fraction added, full credit. It affected every evaluate
 * task in the build, not one subject's, and the suite's existing free-mark
 * guard could not see it because that guard filters to tasks with a `form`.
 *
 * The replacement is structural, not a simplicity demand. The two assertions
 * about `solve-exponential-1` below are the ones that matter in the other
 * direction: an unsimplified but genuinely worked answer must still pass, or
 * the fix would have cost more than the bug.
 */
group('ruleEvaluate — the answer has to be worked, not just substituted')
const fa = taskById('fraction-add-1')
t('THE SUBSTITUTED GIVEN IS REFUSED — this was a free mark on every evaluate task',
  (await ruleEvaluate(fa, '2/3 + 1/4', NO_WORKER)).verdict.ruling === 'incorrect')
t('…and the complaint is that the arithmetic has not been done, not that it is wrong',
  /rather than its value/.test((await ruleEvaluate(fa, '2/3 + 1/4', NO_WORKER)).verdict.brokeAt.detail))
t('…and it is refused before equivalence, since equivalence would have said yes',
  (await ruleEvaluate(fa, '2/3 + 1/4', NO_WORKER)).verdict.brokeAt.step === 1)
t('the actual value still rules correct', (await ruleEvaluate(fa, '11/12', NO_WORKER)).verdict.ruling === 'correct')
t('an unreduced but worked answer is still correct — this is not a simplicity demand',
  (await ruleEvaluate(fa, '22/24', NO_WORKER)).verdict.ruling === 'correct')
t('a wrong answer is still wrong, at step 2',
  (await ruleEvaluate(fa, '3/7', NO_WORKER)).verdict.brokeAt.step === 2)
// The guard that keeps the check honest when there is no arithmetic to do: if
// the given at its inputs IS a bare number, an answer identical to it is the
// only correct answer rather than a refusal to work.
t('a task whose given at its inputs is already a numeral still accepts that numeral',
  (await ruleEvaluate(
    { ...fa, given: 'a', variables: [fa.variables[0]], at: { a: '7' }, reference: '7' },
    '7', NO_WORKER,
  )).verdict.ruling === 'correct')
/*
 * The two tasks a first version of this check broke. Both are correctly
 * designed and both are pinned here, because each fails for a different reason
 * and a fix that restored only one would look like it had worked.
 */
t('a value whose rendering coincides with the expression producing it is not a dodge',
  // given `b/2` at b = 3 renders as "3/2", and so does its value. There is no
  // step being skipped — this is the only right answer.
  (await ruleEvaluate(taskById('complete-odd-b-h-1'), '3/2', NO_WORKER)).verdict.ruling === 'correct')
t('and the one task that deliberately accepts its unevaluated form says so in data',
  TASKS.filter(x => x.acceptsUnevaluated).map(x => x.id).join(',') === 'solve-exponential-1',
  TASKS.filter(x => x.acceptsUnevaluated).map(x => x.id).join(',') || 'none')
t('…which is what keeps log(27, 9) accepted now that the default is to refuse',
  (await ruleEvaluate(taskById('solve-exponential-1'), 'log(27, 9)', NO_WORKER))
    .verdict.ruling === 'correct')
t('…while the same task still refuses a wrong answer',
  (await ruleEvaluate(taskById('solve-exponential-1'), '3', NO_WORKER)).verdict.ruling === 'incorrect')

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

/*
 * The second counterexample task, and the reason it is worth its own
 * assertions rather than riding on the first.
 *
 * `even-root-needs-nonnegative` is a DOMAIN restriction, and two other domain
 * restrictions in this engine have no rulable task precisely because of their
 * domains — `cancelling-keeps-the-hole` and `log-argument-is-positive`, both
 * recorded where their task would be. So "a domain point got a counterexample
 * task" is the kind of thing that looks like the mistake those notes warn
 * about, and the distinction is what these pin down: the claim
 * (x^2)^(1/2) = x is total on the reals, so its separating points are ordinary
 * ones and nothing here depends on substituting an excluded point.
 *
 * The negative-x assertions are the load-bearing ones. If `exactValue` ever
 * stopped taking the even root of a positive rational — the capability
 * `exactLog`'s neighbour `exactRoot` provides — the left side would go null
 * and this task would start telling learners their correct witness leaves a
 * side undefined. That failure is invisible in the shipped set otherwise.
 */
const rootClaim = taskById('break-even-root-needs-nonnegative-1')
const brokeRoot = async answer => rule(rootClaim, answer, NO_WORKER)
t('the domain point now has a task, so its chain can become evidence',
  tasksForPoint('even-root-needs-nonnegative').length === 1)
t('its claim is an equation, like the kind requires',
  parseExpression(rootClaim.given, ['x']).kind === 'equation')
t('the shipped witness validates with no worker',
  validateInstance(rootClaim, 0).length === 0, validateInstance(rootClaim, 0).join('; '))
t('a negative witness breaks the claim',
  (await brokeRoot('-3')).verdict.ruling === 'correct')
t('and the ruling names |x| against x rather than an undefined side',
  /the left side is 3 and the right side is -3/.test((await brokeRoot('-3')).verdict.method),
  (await brokeRoot('-3')).verdict.method)
t('a different negative works too — every one of them is a witness',
  (await brokeRoot('-1/2')).verdict.ruling === 'correct')
/*
 * The non-negative half, which is the actual content of the knowledge point:
 * the power rule is not merely unreliable, it holds exactly where x >= 0 and
 * fails exactly where x < 0. A learner offering 4 has to be told the claim
 * SURVIVED, not that they mis-substituted.
 */
t('a positive value is rejected because the claim survives it',
  (await brokeRoot('4')).verdict.ruling === 'incorrect')
t('and it says so in those terms',
  /both sides equal 4, so the claim survives/.test((await brokeRoot('4')).verdict.brokeAt.detail),
  (await brokeRoot('4')).verdict.brokeAt.detail)
t('zero is the boundary and the claim survives there too',
  (await brokeRoot('0')).verdict.ruling === 'incorrect')
/*
 * And the negative result that keeps the note on the task honest: no witness
 * for this claim is ever refused as an excluded point, because there are none.
 * Asserted by exercising the branch that WOULD fire — the message the other
 * task produces at x = −5 must not be producible here at any integer point.
 */
t('no point on this claim is an excluded one, unlike the first task',
  (await Promise.all(['-4', '-2', '-1', '0', '1', '2', '5'].map(brokeRoot)))
    .every(r => !/is undefined, so the two were never compared/.test(r.verdict.brokeAt?.detail ?? '')))

// ---------------------------------------------------------------------------
// The second subject, and what it broke
// ---------------------------------------------------------------------------

const X2 = EXPONENTS_AND_LOGARITHMS

group('a second subject the schema was not designed around')
/*
 * The count is the ONLY assertion a new subject trips, and it lives inside the
 * SECOND subject's block — far from anything about adding one. The ninth
 * promotion recorded that as a trap worth grepping for before starting, and the
 * tenth hit it again, so it is now named here rather than only there: whoever
 * registers an eleventh subject will find this line from the failure message
 * and nowhere else.
 *
 * It stays a literal rather than becoming `>= 9`. What it is really asserting
 * is that this subject is registered at all, and a floor would pass with the
 * subject absent as long as somebody else had added two.
 */
t('it is registered, and the registry now holds ten subjects',
  ONTOLOGIES.length === 10 && getOntology('exponents-and-logarithms') === X2,
  `${ONTOLOGIES.length} subjects: ${ONTOLOGIES.map(o => o.subject.id).join(', ')}`)
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
t('twelve concepts, thirty-six knowledge points',
  A.concepts.length === 12 && allKnowledgePoints(A).length === 36,
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
t('and the other eleven concepts are reported blocked rather than silently absent',
  coldSet.blocked.length === 11,
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
 * Thirty-three tasks over thirty points, so this is no longer one apiece.
 * `pull-the-square-out` carries THREE: the split it teaches can now be
 * demanded directly (`surd_reduced` + the `asSurd` comparison), and the two
 * older tasks stay because they cover different ground — the square-free part
 * of an integer root, and the one root of a NON-integer that is still exactly
 * rational. The one-per-point floor is asserted separately above, against every
 * point rather than against a total, which is the part that matters.
 *
 * `decimal-representation` added three points and three tasks, one apiece. It
 * wanted a fourth kind and could not have one: what the concept teaches is how
 * to WRITE a rational number, and 0.125 and 1/8 are the same number, so no
 * equivalence check can prefer one. Its header in ontology-arithmetic.ts names
 * the form that would fix it.
 *
 * `real-number-line` added three points and three tasks, one apiece again, and
 * it is the first concept here whose shortfall no form could close: two of its
 * three points conclude in a claim about an infinite set ("the mean move never
 * runs out", "no rational bound is least"), and a `NamedForm` is a claim about
 * the shape of one expression. So each of its tasks asks a step of the
 * argument and says in the prompt which step, which is the proxy rule held to
 * rather than stretched.
 *
 * `ratio-and-rate` added three points and three tasks, one apiece, and it is
 * the first concept in this subject that owes no proxy apology at all — which
 * is a property of the concept rather than of better asks. All three of its
 * points are about a NUMBER: a share, a price per kilogram, and the gap
 * between the proportional and additive readings. Set that against
 * `real-number-line` directly above, where every task had to stand in for a
 * claim about an infinite set. The block in tasks.ts makes the comparison in
 * full.
 */
t('thirty-nine tasks, and every point has at least one',
  ARITH_TASKS.length === 39 && allKnowledgePoints(A).every(p => tasksForPoint(p.id).length > 0),
  `${ARITH_TASKS.length}`)
/*
 * NOT "all of them are evaluate" any more, and the change is the point rather
 * than an exception to be tolerated.
 *
 * That assertion was a proxy for the property this group is named after. It
 * held because `evaluate` was the only kind settleable without the worker, so
 * "all evaluate" and "all gradable locally" were the same set — and the concept
 * headers in this subject record the cost: no form could demand a product of
 * primes, so each task handed the factorisation over and asked for the
 * multiplication back.
 *
 * `prime_factored` plus `ruleTransform`'s exact-arithmetic step made the two
 * sets differ, so the proxy is replaced by the thing it stood for. The kind
 * split is still asserted, as a figure rather than a constraint, so that a kind
 * arriving here unnoticed is still visible.
 */
t('two are transform_to_form and the rest evaluate — both graded locally',
  ARITH_TASKS.filter(x => x.kind === 'evaluate').length === 37
  && ARITH_TASKS.filter(x => x.kind === 'transform_to_form').length === 2,
  ARITH_TASKS.reduce((acc, x) => ({ ...acc, [x.kind]: (acc[x.kind] ?? 0) + 1 }), {}),
)
t('…and they are the two forms that constrain an integer subterm',
  ARITH_TASKS.filter(x => x.kind === 'transform_to_form').map(x => x.form).sort().join(',')
    === 'prime_factored,surd_reduced')
t('every one declares integer symbols rather than real ones, and the numeric tasks declare none',
  ARITH_TASKS.every(x => x.variables.every(v => v.assumptions?.integer === true))
  && ARITH_TASKS.filter(x => x.variables.length === 0).length === 2)
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  ARITH_TASKS.filter(x => x.kind === 'evaluate').every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }))
// Both transform tasks' two sides are settled the same exact way, which is the
// whole reason they are allowed in a subject with this contract. `asSurd` rather
// than `exactValue`, since one of the two pairs is irrational on both sides.
t('and each transform task\'s given and reference are the same number exactly',
  ARITH_TASKS.filter(x => x.kind === 'transform_to_form').every(x => {
    const given = asSurd(parseExpression(x.given, []))
    const reference = asSurd(parseExpression(x.reference, []))
    return given !== null && reference !== null && sameSurd(given, reference)
  }))
t('…and for the surd task neither side has a rational value, so exactValue could not have done it',
  (() => {
    const x = ARITH_TASKS.find(t2 => t2.form === 'surd_reduced')
    return exactValue(parseExpression(x.given, [])) === null
      && exactValue(parseExpression(x.reference, [])) === null
  })())
t('…while the integer pair is settled by plain rational arithmetic, the narrower tool',
  ARITH_TASKS.filter(x => x.form === 'prime_factored').every(x => {
    const given = exactValue(parseExpression(x.given, []))
    const reference = exactValue(parseExpression(x.reference, []))
    return given !== null && reference !== null && showExact(given) === showExact(reference)
  }))
const arithRulings = await Promise.all(
  ARITH_TASKS.map(x => (x.kind === 'transform_to_form' ? ruleTransform : ruleEvaluate)(
    x, x.reference, NO_WORKER,
  )))
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

t('the factored form still cannot express "a product of primes" — a bare numeral satisfies it',
  checkForm(parseExpression('7350', []), 'factored', 'x').held === true,
  'symbol-relative by design: degree 0 reads as irreducible, which is what protects x + 3')
t('and so does the factorisation, so THAT form cannot tell them apart',
  checkForm(parseExpression('2*3*5^2*7^2', []), 'factored', 'x').held === true)
t('but prime_factored now can, which is what reopens transform_to_form here',
  checkForm(parseExpression('7350', []), 'prime_factored', 'x').held === false
  && checkForm(parseExpression('2*3*5^2*7^2', []), 'prime_factored', 'x').held === true,
  'the header\'s "no form can demand this" compromise is now optional rather than forced')

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

/*
 * The first point now carries TWO tasks, and the second one is the concept's
 * own ask rather than a proxy for it: "write 2310 as a product of primes",
 * which `prime_factored` made expressible. The three evaluate tasks stay —
 * they teach the check, the divisor count and the square part, which are
 * different moves and not substitutes for the factorisation itself.
 */
t('three points; the first has the factorisation task beside its evaluate one',
  PF.knowledgePoints.length === 3
  && tasksForPoint(PF.knowledgePoints[0].id).length === 2
  && PF.knowledgePoints.slice(1).every(p => tasksForPoint(p.id).length === 1),
  PF.knowledgePoints.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
t('and the one that is not evaluate asks for the factorisation with the form that can demand it',
  (() => {
    const transforms = PF.knowledgePoints.flatMap(p => tasksForPoint(p.id))
      .filter(x => x.kind !== 'evaluate')
    return transforms.length === 1
      && transforms[0].kind === 'transform_to_form'
      && transforms[0].form === 'prime_factored'
  })())
t('each point is about a different number from its own worked example, so it is not a recall',
  ['2450', '1350', '1960'].every((n, i) =>
    tasksForPoint(PF.knowledgePoints[i].id).some(x => x.prompt.includes(n))))
t('…and the factorisation task uses a fourth number again',
  tasksForPoint(PF.knowledgePoints[0].id).some(x => x.prompt.includes('2310')))

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
t('four concepts, twelve knowledge points',
  VE.concepts.length === 4 && allKnowledgePoints(VE).length === 12,
  `${VE.concepts.length} concepts, ${allKnowledgePoints(VE).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(VE, 'variables-and-expressions') && isPractisable(VE, 'variables-and-expressions'))
t('and so is the solve, which is the half of the subject\'s name that was mapped only',
  isTeachable(VE, 'linear-equations') && isPractisable(VE, 'linear-equations'))
t('and so is the system, which three files had argued could not be authored at all',
  isTeachable(VE, 'systems-of-linear-equations')
  && isPractisable(VE, 'systems-of-linear-equations'))
t('and so is the row reduction, which two more files had argued the same about',
  isTeachable(VE, 'gaussian-elimination')
  && isPractisable(VE, 'gaussian-elimination'))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(VE).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(VE).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
t('every objective names a task kind',
  VE.concepts.every(c => c.objectives.length > 0 && c.objectives.every(o => o.taskKinds.length > 0)))

/**
 * THE EDGE LIST WAS EMPTY AND THAT WAS A BOUNDARY, NOT AN OMISSION — AND THE
 * SECOND CONCEPT IS WHAT MADE IT NON-EMPTY WITHOUT MOVING THE BOUNDARY.
 *
 * While there was one concept there was no internal pair to join, and every
 * real prerequisite of it crossed into another subject, so each had to live in
 * an area's `links`. That is still true of `variables-and-expressions`: both
 * of its own prerequisites are in `arithmetic-foundations` and both are in
 * `ALGEBRA_FOUNDATIONS.links` to this day.
 *
 * `linear-equations` arrived with exactly one `needs`, pointing at the concept
 * already here — so its stranded edge belongs in this ontology and cost `links`
 * nothing. One edge is therefore the whole internal structure, and the root is
 * unchanged: the reading still comes before the solving.
 *
 * Both halves are asserted. The count catches an edge invented here naming
 * `order-of-operations`, which would look right and would make
 * `ontologyProblems` report an unknown endpoint; the named root catches the
 * edge being added backwards, which nothing else would — a reversed
 * prerequisite is a valid ontology that teaches the subject in the wrong order.
 *
 * THE THIRD CONCEPT MADE IT TWO, BY THE SAME MECHANISM, AND THE SUBJECT IS NOW
 * A CHAIN OF THREE. `systems-of-linear-equations` also declared exactly one
 * `needs`, also pointing at a concept already here — `linear-equations`,
 * promoted one change earlier — so its stranded edge belongs in this ontology
 * too and cost `links` nothing. The root is unchanged for a third time: the
 * reading still comes before the solving, which comes before solving two at
 * once.
 *
 * THE EDGES ARE NOW CHECKED BY NAME RATHER THAN BY POSITION, which is the one
 * thing about this change worth more than a renumbered count. `VE.edges[0]`
 * read correctly while there was one edge and reads correctly today, and it
 * stops meaning anything the moment the edges are reordered or the chain
 * forks: a positional check would quietly start asserting the wrong edge, and
 * `ontologyProblems` would not object, because an edge hung off the wrong
 * authored parent is a perfectly valid ontology that teaches the subject in
 * the wrong order. ontology-geometry.ts reached the same conclusion when the
 * geometry subject stopped being a chain.
 */
/**
 * THE FOURTH CONCEPT COST `links` AN ENTRY, WHICH ENDED THE RUN, AND BROUGHT
 * THE FIRST EDGE HERE THAT IS NOT A PREREQUISITE.
 *
 * `gaussian-elimination` declared TWO `needs`. One pointed at
 * `systems-of-linear-equations`, authored here, so it is the third prerequisite
 * below. The other pointed at `matrices-and-maps`, authored in
 * `matrices-and-determinants` — and an ontology may only name concepts it
 * contains, so that one could not come here and is in `LINEAR_ALGEBRA.links`
 * instead. The file's own comment predicted this ("it will stop being cheap the
 * moment something is authored that an area node depends on") and the
 * prediction is asserted from the far side in tests/atlas.mjs, where the links
 * entry lives.
 *
 * The node also declared `exercises`, which the atlas expands into an
 * `encompasses` edge for free. Restating it here is a different claim — what
 * PRACTISING this material exercises, against the tasks that exist — so it is
 * asserted as its own thing rather than counted among the prerequisites. It is
 * the first non-prerequisite edge this subject has, which is why the count
 * alone would no longer say what it used to.
 */
const edgeFromTo = (o, from, to) => o.edges.find(e => e.from === from && e.to === to)
t('it declares four edges, three of them prerequisites, and the reading is still the root',
  VE.edges.length === 4
  && VE.edges.filter(e => e.kind === 'prerequisite').length === 3
  && roots(VE).length === 1 && roots(VE)[0] === 'variables-and-expressions',
  `${VE.edges.length} edge(s), roots: ${roots(VE).join(', ')}`)
t('and all three are edges the promoted nodes arrived carrying, each pointing the way it was written',
  [['variables-and-expressions', 'linear-equations'],
    ['linear-equations', 'systems-of-linear-equations'],
    ['systems-of-linear-equations', 'gaussian-elimination']].every(([from, to]) => {
    const e = edgeFromTo(VE, from, to)
    return !!e && e.kind === 'prerequisite' && !!e.promotedBy
  }),
  VE.edges.map(e => `${e.from}->${e.to} ${e.kind}`).join(' | '))
/*
 * The credit edge, by name and by direction. `encompasses` reads
 * "exercising `from` also exercises `to`", so this one has to run from the row
 * reduction DOWN to the two-equation solve and not the other way — backwards it
 * would claim that practising a 2×2 system discharges review on a 3×3 forward
 * pass, which is false and which no other check would catch, a reversed edge
 * being a perfectly valid ontology.
 */
t('and the fourth is the credit edge, pointing from the row reduction down to the system',
  (() => {
    const e = edgeFromTo(VE, 'gaussian-elimination', 'systems-of-linear-equations')
    return !!e && e.kind === 'encompasses' && !!e.promotedBy && !!e.rationale
      && !edgeFromTo(VE, 'systems-of-linear-equations', 'gaussian-elimination')
        ?.kind.includes('encompasses')
  })(),
  VE.edges.filter(e => e.kind !== 'prerequisite')
    .map(e => `${e.from}=>${e.to} ${e.kind}`).join(' | ') || 'none')
/*
 * And the claim the credit edge makes, measured rather than asserted: the
 * forward pass's last step is the two-equation elimination, so the two tasks
 * share an expression. That is the evidence for the edge — without it the
 * rationale is a plausible sentence, and ontology-arithmetic.ts declines an
 * `encompasses` elsewhere for exactly the want of this.
 */
t('the edge is earned — the forward pass is ruled by the two-equation elimination\'s own expression',
  taskById('gaussian-forward-pass-for-z-1').given
    === taskById('solve-system-eliminate-for-y-1').given
  && JSON.stringify(taskById('gaussian-forward-pass-for-z-1').at)
    !== JSON.stringify(taskById('solve-system-eliminate-for-y-1').at),
  `${taskById('gaussian-forward-pass-for-z-1').given} at reduced vs original coefficients`)
/*
 * And the chain in order, as a walk rather than as a string. `teachingOrder`
 * is what the scheduler reads, so this asserts the claim the subject's own
 * `covers` paragraph makes about itself — and it fails loudly if an edge is
 * reversed, which the two checks above cannot, since a backwards edge is still
 * an edge between the right pair.
 */
t('and the four sit in the order the subject claims to teach them',
  teachingOrder(VE).join(' ')
    === 'variables-and-expressions linear-equations systems-of-linear-equations '
      + 'gaussian-elimination',
  teachingOrder(VE).join(' '))

group('the seventh subject is gradable with no worker')
const VE_TASKS = allKnowledgePoints(VE).flatMap(p => tasksForPoint(p.id))
t('twenty-five tasks across the twelve points', VE_TASKS.length === 25, `${VE_TASKS.length}`)
t('all of them are evaluate — no form can express "collected" and no kind can express "solve"',
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
 * THE FIRST SUBJECT TO AUTHOR `socratic` ON EVERY SUBGOAL, AND STILL THE ONLY
 * ONE WHERE THAT IS TRUE OF EVERY CONCEPT IN IT.
 *
 * 21 of 283 questions were interrogative before this file, and all 21 were
 * labels that happened to end in a question mark rather than authored
 * overrides. This asserts the claim that makes the coverage figure move: every
 * subgoal here carries a hand-written question, and each one is a question
 * rather than an imperative with a question mark bolted on — which is the
 * failure types.ts names and punctuation cannot fix.
 *
 * It is asserted over the whole subject rather than per concept deliberately,
 * so a concept added here without its questions written fails this rather than
 * diluting a fraction somewhere else. `linear-equations` is the first concept
 * to arrive under that rule and it brought twelve more, which is why the
 * figures above moved by twelve on both sides at once.
 *
 * `systems-of-linear-equations` is the second and brought another twelve, four
 * subgoals to each of three points. That is the rule doing the job it was
 * written for rather than being tested by it: the concept was authored knowing
 * this assertion existed, so the questions were written with the material
 * instead of being a later pass over it. Twelve subgoals is also where the
 * cost of the rule shows — an interrogative phrasing for every step is roughly
 * half the writing in a concept, and the subject-wide form is what stops that
 * cost being quietly skipped on the third concept because the first two
 * already carry the fraction.
 */
const VE_QUESTIONS = allQuestions(VE)
t('forty-six questions, one per subgoal', VE_QUESTIONS.length === 46, `${VE_QUESTIONS.length}`)
t('every subgoal carries an authored socratic phrasing',
  allKnowledgePoints(VE).every(p => p.workedExample.subgoals.every(s => !!s.socratic)),
  allKnowledgePoints(VE).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
/*
 * Stated as the whole subject rather than as a numeral, which is the form the
 * claim should always have had: the figure in this line has been renumbered
 * three times and the claim has not changed once. Every question here is
 * written and every one of them is a question.
 */
t('and every one of them is interrogative, so the subject\'s whole fraction is written',
  VE_QUESTIONS.every(q => q.authoredAsQuestion)
  && questionCoverage(VE).authoredAsQuestions === questionCoverage(VE).questions,
  `${questionCoverage(VE).authoredAsQuestions} of ${questionCoverage(VE).questions}`)
/*
 * The pair of asks the first knowledge point needs. Its whole content is that
 * one act — substitution — settles an unknown completely and settles a claim
 * about a variable not at all, so a single task could only have shown one.
 */
t('the two-readings point carries both halves of the pair',
  tasksForPoint('a-letter-has-two-readings').map(x => x.id).sort().join(',')
  === 'identity-difference-1,unknown-check-1',
  tasksForPoint('a-letter-has-two-readings').map(x => x.id).join(','))

/**
 * THE SOLVE TASKS, CHECKED AGAINST THE EQUATIONS THEY CLAIM TO SOLVE.
 *
 * This group exists because the assertion above it cannot do this job, and the
 * difference is the whole risk in expressing a solve as an `evaluate`.
 *
 * "Every reference is exactly reproducible from the given" checks that the
 * task is self-consistent — that the author's answer really is what `given`
 * evaluates to at `at`. It would pass with every equation in every prompt
 * wrong, because `given` carries the SOLUTION FORMULA and nothing in the task
 * data carries the equation. A learner reads the equation; the engine rules
 * against the formula. If those two disagree, a correct answer is marked wrong
 * and nothing in the build says so.
 *
 * So the equations are restated here as left and right sides, independently of
 * the task data, and the reference is substituted into them. This catches a
 * sign error in a `given` — `(c + b)/a` against `(c - b)/a` is the difference
 * between the two one-sided tasks and the easiest thing in the subject to get
 * backwards.
 */
group('the solve tasks really solve the equations their prompts state')

/** The exact value of an expression under an assignment, or null. */
const valueAt = (src, assignment) => {
  const names = Object.keys(assignment)
  const at = {}
  for (const [name, raw] of Object.entries(assignment)) at[name] = parseExpression(raw, [])
  return exactValue(substitute(parseExpression(src, names), at))
}

const SOLVES = [
  { id: 'solve-linear-one-sided-1', lhs: '3*x - 7', rhs: '11' },
  { id: 'solve-linear-non-integer-1', lhs: '4*x + 5', rhs: '12' },
  { id: 'collect-unknown-both-sides-1', lhs: '5*x + 4', rhs: '2*x + 19' },
  { id: 'collect-from-the-other-side-1', lhs: '5*x + 4', rhs: '2*x + 19' },
]
t('each reference, put back into its own equation, makes the two sides equal',
  SOLVES.every(({ id, lhs, rhs }) => {
    const x = taskById(id).reference
    const left = valueAt(lhs, { x })
    const right = valueAt(rhs, { x })
    return left !== null && right !== null && showExact(left) === showExact(right)
  }),
  SOLVES.map(({ id, lhs, rhs }) => {
    const x = taskById(id).reference
    return `${id}@${x}: ${showExact(valueAt(lhs, { x }))} vs ${showExact(valueAt(rhs, { x }))}`
  }).join(' | '))
/*
 * The two one-sided tasks differ in the sign of b and nothing else, which is
 * the one thing a reader of either task alone cannot see. `3x − 7 = 11` undoes
 * a subtraction so its solution ADDS; `4x + 5 = 12` undoes an addition. A
 * learner who has memorised one shape rather than the move gets exactly one of
 * them right, and that is the only signal this build can take on the
 * difference — so the pair has to stay a pair.
 */
t('the one-sided pair really does undo in opposite directions',
  taskById('solve-linear-one-sided-1').given === '(c + b)/a'
  && taskById('solve-linear-non-integer-1').given === '(c - b)/a',
  `${taskById('solve-linear-one-sided-1').given} | `
  + `${taskById('solve-linear-non-integer-1').given}`)
t('and one answer is deliberately not an integer, so the division cannot be guessed past',
  taskById('solve-linear-non-integer-1').reference === '7/4',
  taskById('solve-linear-non-integer-1').reference)
/*
 * The knowledge point's fourth subgoal, as a ruling rather than as prose: the
 * answer does not depend on which side the unknown is cleared from. Two
 * different `given`s at the SAME inputs reaching the same number is what makes
 * that checkable at all, and it is why the second task exists.
 */
t('the two-sided pair clears opposite sides and still lands on one number',
  taskById('collect-unknown-both-sides-1').given
    !== taskById('collect-from-the-other-side-1').given
  && JSON.stringify(taskById('collect-unknown-both-sides-1').at)
    === JSON.stringify(taskById('collect-from-the-other-side-1').at)
  && taskById('collect-unknown-both-sides-1').reference
    === taskById('collect-from-the-other-side-1').reference,
  `${taskById('collect-unknown-both-sides-1').given} and `
  + `${taskById('collect-from-the-other-side-1').given} both give `
  + `${taskById('collect-unknown-both-sides-1').reference}`)

/**
 * THE NON-INVERTIBLE STEP, COMPUTED RATHER THAN ASSERTED.
 *
 * This is the one place the subject says anything about a solution SET, and it
 * can only say it about one number at a time — which is exactly the limit
 * ontology-algebra.ts records. So the claim is checked where it is makeable:
 * the two equations AGREE at 3 and DISAGREE at 1, which is the solution set
 * having changed, evaluated rather than described.
 *
 * Both halves are needed. Agreement at 3 is what says the step did not simply
 * break the equation; disagreement at 1 is the solution it created. Either one
 * alone is consistent with a typo in the other task's `given`.
 */
t('multiplying through by x − 1 keeps the old solution and adds one the original rejects', (() => {
  const original = '2*x - 6'
  const multiplied = '(x - 1)*(2*x - 6)'
  const keeps = showExact(valueAt(original, { x: '3' })) === '0'
    && showExact(valueAt(multiplied, { x: '3' })) === '0'
  const adds = showExact(valueAt(multiplied, { x: '1' })) === '0'
    && showExact(valueAt(original, { x: '1' })) !== '0'
  return keeps && adds
})(),
  `at 3: ${showExact(valueAt('2*x - 6', { x: '3' }))}/`
  + `${showExact(valueAt('(x - 1)*(2*x - 6)', { x: '3' }))}; `
  + `at 1: ${showExact(valueAt('2*x - 6', { x: '1' }))}/`
  + `${showExact(valueAt('(x - 1)*(2*x - 6)', { x: '1' }))}`)
t('and the two tasks that show it ask about the same number, one per side',
  taskById('gained-solution-satisfies-the-new-equation-1').at.x
    === taskById('gained-solution-fails-the-original-1').at.x
  && taskById('gained-solution-satisfies-the-new-equation-1').reference === '0'
  && taskById('gained-solution-fails-the-original-1').reference !== '0',
  `x=${taskById('gained-solution-satisfies-the-new-equation-1').at.x}: `
  + `${taskById('gained-solution-satisfies-the-new-equation-1').reference} and `
  + `${taskById('gained-solution-fails-the-original-1').reference}`)

/**
 * THE SYSTEM TASKS, CHECKED AGAINST THE SYSTEMS THEIR PROMPTS STATE.
 *
 * Same job as the group above and a sharper need for it. Those tasks' `given`s
 * are solution formulas in three or four coefficients; these are Cramer's
 * expressions in six, and `(c*e - b*f)/(a*e - b*d)` differs from the y version
 * `(a*f - c*d)/(a*e - b*d)` in which numerator, in which order, and in two
 * signs. Nothing in the task data carries the SYSTEM — the learner reads two
 * equations and the engine rules against an expression in letters — so a
 * transposed numerator would mark a correct answer wrong and the
 * self-consistency check would pass, because the formula really does evaluate
 * to what the author claimed it does.
 *
 * So each system is restated here as pairs of sides, independently of the task
 * data, and the pair is substituted into BOTH equations. One equation is not
 * enough: the x the formula produces satisfies one of the two equations for
 * almost any sign error, since each equation alone admits a whole line.
 */
group('the system tasks really solve the systems their prompts state')

const SYSTEMS = [
  {
    label: '2x + 3y = 12 with 5x − y = 13',
    eqs: [['2*x + 3*y', '12'], ['5*x - y', '13']],
    // Both coordinates come from tasks here, which is the only system where
    // that is true — it is the one the point about a pair is made on.
    x: () => taskById('solve-system-eliminate-for-x-1').reference,
    y: () => taskById('solve-system-eliminate-for-y-1').reference,
  },
  {
    label: 'y = 2x − 1 with 3x + 2y = 12, by substitution',
    eqs: [['y', '2*x - 1'], ['3*x + 2*y', '12']],
    x: () => taskById('solve-system-by-substitution-1').reference,
    y: () => '3',
  },
  {
    label: 'the same system as 2x − y = 1 with 3x + 2y = 12, by elimination',
    eqs: [['2*x - y', '1'], ['3*x + 2*y', '12']],
    x: () => taskById('solve-system-same-point-by-elimination-1').reference,
    y: () => '3',
  },
]
t('each reference, put back into both of its own equations, makes every side agree',
  SYSTEMS.every(({ eqs, x, y }) => {
    const at = { x: x(), y: y() }
    return eqs.every(([lhs, rhs]) => {
      const left = valueAt(lhs, at)
      const right = valueAt(rhs, at)
      return left !== null && right !== null && showExact(left) === showExact(right)
    })
  }),
  SYSTEMS.map(({ label, eqs, x, y }) => {
    const at = { x: x(), y: y() }
    return `${label} @(${at.x}, ${at.y}): ` + eqs
      .map(([l, r]) => `${showExact(valueAt(l, at))}=${showExact(valueAt(r, at))}`).join(' ')
  }).join(' | '))
/*
 * The pair that is a PAIR, which is the whole answer to the refusal this
 * concept overturned. A point is not a value and is two values, so it costs
 * two tasks — and the two have to be the same system, or they are two
 * unrelated numbers. Asserted as identical inputs with different `given`s,
 * which is the only way "two coordinates of one point" is visible in the data.
 */
t('the two coordinates of the point come from one system, differing only in which is asked for',
  JSON.stringify(taskById('solve-system-eliminate-for-x-1').at)
    === JSON.stringify(taskById('solve-system-eliminate-for-y-1').at)
  && taskById('solve-system-eliminate-for-x-1').given
    !== taskById('solve-system-eliminate-for-y-1').given
  && taskById('solve-system-eliminate-for-x-1').reference
    !== taskById('solve-system-eliminate-for-y-1').reference,
  `${taskById('solve-system-eliminate-for-x-1').given} -> `
  + `${taskById('solve-system-eliminate-for-x-1').reference}, `
  + `${taskById('solve-system-eliminate-for-y-1').given} -> `
  + `${taskById('solve-system-eliminate-for-y-1').reference}`)
/*
 * And the two routes at one system, which is the second knowledge point's
 * fourth subgoal as a ruling. Unlike the `collect-*` pair one concept down,
 * BOTH the expression and the inputs differ here — the two methods do not
 * agree on how many coefficients the system has, substitution taking five and
 * elimination six — so the only thing that can be asserted is that the number
 * out is the same. That is also the only thing worth asserting.
 */
t('substitution and elimination reach the same x from different expressions and different inputs',
  taskById('solve-system-by-substitution-1').given
    !== taskById('solve-system-same-point-by-elimination-1').given
  && JSON.stringify(taskById('solve-system-by-substitution-1').at)
    !== JSON.stringify(taskById('solve-system-same-point-by-elimination-1').at)
  && taskById('solve-system-by-substitution-1').reference
    === taskById('solve-system-same-point-by-elimination-1').reference,
  `${taskById('solve-system-by-substitution-1').reference} and `
  + `${taskById('solve-system-same-point-by-elimination-1').reference}`)

/**
 * THE TWO DEGENERATE OUTCOMES, COMPUTED RATHER THAN DESCRIBED.
 *
 * This is the place the solution-set limit genuinely binds, so it is the place
 * the assertion has to be most careful about what it is claiming. No task asks
 * how many solutions a system has. What the two leftover tasks ask for is the
 * number the elimination hands back when both letters cancel, and the claim
 * being checked here is that those two numbers really are produced by the two
 * systems in the prompts — which the self-consistency check cannot see, since
 * `a*b - c` evaluates to the author's answer whatever the prompts say.
 *
 * Three things are checked and they fail differently:
 *
 *  - Doubling 2x + 3y = 7 produces a left side IDENTICAL to 4x + 6y, which is
 *    why both letters cancel together rather than one of them. Checked at two
 *    unrelated pairs, because two expressions agreeing at one point is not
 *    identity.
 *  - The inconsistent system admits nothing, exhibited constructively: any
 *    pair on 2x + 3y = 7 sends 4x + 6y to 14, so it cannot be 11. Two such
 *    pairs are used, one of them not a lattice point.
 *  - The dependent system admits both exhibited pairs — the task's (1/2, 2)
 *    and the worked example's (−1, 3) — which is what makes "infinitely many"
 *    evidenced rather than asserted. A leftover of 0 alone would only say the
 *    second equation added no condition.
 */
group('the degenerate systems really are degenerate, and in the two different ways')

const DOUBLED = '2*(2*x + 3*y)'
const SECOND_LEFT = '4*x + 6*y'
t('doubling the first equation gives the second system\'s left side exactly, so both letters go at once',
  [{ x: '1', y: '4' }, { x: '-3', y: '1/2' }].every(at =>
    showExact(valueAt(DOUBLED, at)) === showExact(valueAt(SECOND_LEFT, at))),
  [{ x: '1', y: '4' }, { x: '-3', y: '1/2' }]
    .map(at => `${showExact(valueAt(DOUBLED, at))} vs ${showExact(valueAt(SECOND_LEFT, at))}`)
    .join(' | '))
t('the leftover pair shares its expression and its first two inputs, differing in the third',
  taskById('inconsistent-system-leftover-1').given
    === taskById('dependent-system-leftover-1').given
  && taskById('inconsistent-system-leftover-1').at.a
    === taskById('dependent-system-leftover-1').at.a
  && taskById('inconsistent-system-leftover-1').at.b
    === taskById('dependent-system-leftover-1').at.b
  && taskById('inconsistent-system-leftover-1').at.c
    !== taskById('dependent-system-leftover-1').at.c,
  `${taskById('inconsistent-system-leftover-1').given} at c=`
  + `${taskById('inconsistent-system-leftover-1').at.c} and c=`
  + `${taskById('dependent-system-leftover-1').at.c}`)
t('and the two answers are the two outcomes: non-zero for no solutions, zero for a repeated equation',
  taskById('inconsistent-system-leftover-1').reference !== '0'
  && taskById('dependent-system-leftover-1').reference === '0',
  `${taskById('inconsistent-system-leftover-1').reference} and `
  + `${taskById('dependent-system-leftover-1').reference}`)
/*
 * The inconsistency, constructively. Not "no pair satisfies both" — that is
 * not checkable by substitution — but the reason there is none: every pair
 * satisfying the first equation sends the second's left side to 14, and the
 * second equation says 11.
 */
t('every pair on the first equation sends the second left side to 14, which the 11 cannot be',
  [{ x: '2', y: '1' }, { x: '1/2', y: '2' }].every(at =>
    showExact(valueAt('2*x + 3*y', at)) === '7'
    && showExact(valueAt(SECOND_LEFT, at)) === '14'),
  [{ x: '2', y: '1' }, { x: '1/2', y: '2' }]
    .map(at => `(${at.x}, ${at.y}): ${showExact(valueAt('2*x + 3*y', at))} then `
      + `${showExact(valueAt(SECOND_LEFT, at))}`).join(' | '))
/*
 * And the dependent case, exhibited at the two pairs the material names — the
 * task's and the worked example's. Two different solutions is the smallest
 * thing that distinguishes "infinitely many" from "one", and the task's y
 * differs from the worked example's on purpose, so this also catches the two
 * being quietly made the same.
 */
t('the dependent system admits both exhibited pairs, which the task and the example chose apart',
  (() => {
    const y = taskById('dependent-system-pick-a-y-1').at.d
    const x = taskById('dependent-system-pick-a-y-1').reference
    const exhibited = [{ x, y }, { x: '-1', y: '3' }]
    return y !== '3'
      && exhibited.every(at => showExact(valueAt('2*x + 3*y', at)) === '7'
        && showExact(valueAt(SECOND_LEFT, at)) === '14')
  })(),
  `task (${taskById('dependent-system-pick-a-y-1').reference}, `
  + `${taskById('dependent-system-pick-a-y-1').at.d}) and example (-1, 3)`)
t('and the task\'s x is deliberately not an integer, so the line is not read as its lattice points',
  taskById('dependent-system-pick-a-y-1').reference === '1/2',
  taskById('dependent-system-pick-a-y-1').reference)
/*
 * The number the third knowledge point's last subgoal is about, which is the
 * one claim tying the concept's three points into one concept: ae − bd is what
 * the first point's answer is divided by, and it is zero exactly in the
 * degenerate cases. Asserted on both systems, because the claim is a
 * difference between them and either alone is consistent with the expression
 * being wrong.
 */
t('the deciding number is zero for the degenerate pair and not for the system with a point',
  showExact(valueAt('a*e - b*d', { a: '2', b: '3', d: '4', e: '6' })) === '0'
  && showExact(valueAt('a*e - b*d', { a: '2', b: '3', d: '5', e: '-1' })) === '-17'
  && taskById('solve-system-eliminate-for-x-1').given.endsWith('/(a*e - b*d)'),
  `${showExact(valueAt('a*e - b*d', { a: '2', b: '3', d: '4', e: '6' }))} and `
  + `${showExact(valueAt('a*e - b*d', { a: '2', b: '3', d: '5', e: '-1' }))}`)

/**
 * THE ROW-REDUCTION TASKS, CHECKED AGAINST THE SYSTEMS THEIR PROMPTS STATE.
 *
 * Same job as the two groups above and the sharpest need for it yet, because
 * these `given`s are a step further from the prompt than any others in the
 * build. They are ONE STEP of the forward pass carried out in general, at the
 * REDUCED coefficients — numbers that appear nowhere in the prompt and that the
 * learner is expected to produce. So "every reference is reproducible from the
 * given" is nearly vacuous here: `(a*f - c*d)/(a*e - b*d)` at the author's
 * inputs evaluates to the author's answer whether or not those inputs are what
 * the stated three equations actually reduce to, and whether or not the triple
 * solves anything.
 *
 * Three independent things are therefore checked against the equations
 * themselves, restated here as left and right sides:
 *
 *  - The triple the three tasks produce satisfies ALL THREE original equations.
 *    One or two would not do: each equation alone admits a whole plane, and two
 *    of them admit a line, so a sign error in any `given` survives a check
 *    against fewer than three.
 *  - The reduced rows the `at`s claim really are what the pass produces,
 *    checked as identities rather than at a point — `x + 2y − z` less
 *    `x + y + z` IS `y − 2z`, at two unrelated triples, which is what makes the
 *    inputs to the elimination task honest.
 *  - The emptied-row systems empty, constructively: the first two equations
 *    force 2x + 3y to 8 for every triple satisfying them, so a third equation
 *    asking for 11 cannot be met and one asking for 8 asks for nothing.
 */
group('the row-reduction tasks really solve the systems their prompts state')

const GAUSS_EQS = [
  ['x + y + z', '6'],
  ['x + 2*y - z', '2'],
  ['2*x - y + z', '3'],
]
t('the triple the three tasks produce satisfies all three of the equations in their prompts',
  (() => {
    const at = {
      x: taskById('gaussian-back-substitute-for-x-1').reference,
      y: taskById('gaussian-back-substitute-for-y-1').reference,
      z: taskById('gaussian-forward-pass-for-z-1').reference,
    }
    return GAUSS_EQS.every(([lhs, rhs]) => {
      const left = valueAt(lhs, at)
      const right = valueAt(rhs, at)
      return left !== null && right !== null && showExact(left) === showExact(right)
    })
  })(),
  (() => {
    const at = {
      x: taskById('gaussian-back-substitute-for-x-1').reference,
      y: taskById('gaussian-back-substitute-for-y-1').reference,
      z: taskById('gaussian-forward-pass-for-z-1').reference,
    }
    return `(${at.x}, ${at.y}, ${at.z}): ` + GAUSS_EQS
      .map(([l, r]) => `${showExact(valueAt(l, at))}=${showExact(valueAt(r, at))}`).join(' ')
  })())
/*
 * The reduced rows, as identities. This is the check that the elimination
 * task's inputs are the right numbers: a=1, b=−2, c=−4 claims the second
 * reduced row is y − 2z = −4, and d=−3, e=−1, f=−9 claims the third is
 * −3y − z = −9. Both are checked as left sides agreeing everywhere rather than
 * at one triple, since two expressions agreeing at a point is not identity.
 */
t('the reduced rows the elimination task takes as inputs are what the pass really produces',
  (() => {
    const x = taskById('gaussian-forward-pass-for-z-1').at
    const rows = [
      // second equation less the first
      { got: '(x + 2*y - z) - (x + y + z)', claimed: `${x.a}*y + (${x.b})*z`, rhs: x.c, from: '2 - 6' },
      // third equation less twice the first
      { got: '(2*x - y + z) - 2*(x + y + z)', claimed: `(${x.d})*y + (${x.e})*z`, rhs: x.f, from: '3 - 12' },
    ]
    return rows.every(({ got, claimed, rhs, from }) =>
      [{ x: '1', y: '1', z: '1' }, { x: '-2', y: '3', z: '1/2' }].every(at =>
        showExact(valueAt(got, at)) === showExact(valueAt(claimed, at)))
      && showExact(valueAt(from, {})) === showExact(valueAt(rhs, {})))
  })(),
  JSON.stringify(taskById('gaussian-forward-pass-for-z-1').at))
/*
 * And the emptied row, constructively rather than by the leftover alone. The
 * first two equations' left sides ADD to 2x + 3y, so any triple satisfying both
 * sends it to 6 + 2 = 8 — which is why a third equation asking for 11 can be
 * met by nothing and one asking for 8 adds no condition. Checked at two triples
 * on the dependent system, one of them not a lattice point, and the second is
 * the one the task produces.
 */
t('the first two equations force 2x + 3y to 8, so the 11 is impossible and the 8 asks nothing',
  (() => {
    const z = taskById('gaussian-free-variable-pick-a-z-1').at.c
    const x = taskById('gaussian-free-variable-pick-a-z-1').reference
    const triples = [{ x: '7', y: '-2', z: '1' }, { x, y: '-3', z }]
    const sumsToIt = [{ x: '5', y: '-1', z: '1/3' }, { x: '-2', y: '4', z: '2' }].every(at =>
      showExact(valueAt('(x + y + z) + (x + 2*y - z)', at))
        === showExact(valueAt('2*x + 3*y', at)))
    return z !== '1' && sumsToIt && triples.every(at =>
      showExact(valueAt('x + y + z', at)) === '6'
      && showExact(valueAt('x + 2*y - z', at)) === '2'
      && showExact(valueAt('2*x + 3*y', at)) === '8')
  })(),
  [{ x: '7', y: '-2', z: '1' },
    { x: taskById('gaussian-free-variable-pick-a-z-1').reference, y: '-3',
      z: taskById('gaussian-free-variable-pick-a-z-1').at.c }]
    .map(at => `(${at.x}, ${at.y}, ${at.z}): 2x+3y=${showExact(valueAt('2*x + 3*y', at))}`)
    .join(' | '))
t('the leftover pair shares its expression and its first two inputs, differing in the third',
  taskById('gaussian-emptied-row-contradiction-1').given
    === taskById('gaussian-emptied-row-dependent-1').given
  && taskById('gaussian-emptied-row-contradiction-1').at.a
    === taskById('gaussian-emptied-row-dependent-1').at.a
  && taskById('gaussian-emptied-row-contradiction-1').at.b
    === taskById('gaussian-emptied-row-dependent-1').at.b
  && taskById('gaussian-emptied-row-contradiction-1').at.c
    !== taskById('gaussian-emptied-row-dependent-1').at.c
  && taskById('gaussian-emptied-row-contradiction-1').reference !== '0'
  && taskById('gaussian-emptied-row-dependent-1').reference === '0',
  `${taskById('gaussian-emptied-row-contradiction-1').given}: `
  + `${taskById('gaussian-emptied-row-contradiction-1').reference} and `
  + `${taskById('gaussian-emptied-row-dependent-1').reference}`)
t('and the free-variable answer is deliberately not an integer, as the two-unknown one is',
  taskById('gaussian-free-variable-pick-a-z-1').reference === '17/2',
  taskById('gaussian-free-variable-pick-a-z-1').reference)

/**
 * TWO AUTHORING HABITS THE NEW CONCEPT CHANGED, BOTH ASSERTED SO THE CHANGE IS
 * NOT QUIETLY UNDONE.
 *
 * `taskKinds` naming only what ships. `variables-and-expressions` names
 * `justify` on two objectives and no `justify` task exists anywhere in the
 * build — defensible on the letter of types.ts, since a justify task WOULD
 * evidence them, and still a claim with nothing behind it. The three
 * objectives on `linear-equations` name only `evaluate`, and each was phrased
 * so `evaluate` genuinely evidences it: the third asks for the VALUE at the
 * number a bad step created, not for an account of why the step was bad. The
 * account is asked for in `socratic`, where an unrulable question belongs.
 *
 * Asserted as a property of this concept rather than of the subject, because
 * the older concept legitimately fails it and renaming its kinds would be a
 * separate change with its own argument to make.
 */
const SOLVE_CONCEPT = VE.concepts.find(c => c.id === 'linear-equations')
const SHIPPED_KINDS = new Set(VE_TASKS.map(x => x.kind))
t('every objective on the solve names only a kind the subject actually ships',
  SOLVE_CONCEPT.objectives.length > 0
  && SOLVE_CONCEPT.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => SHIPPED_KINDS.has(k))),
  SOLVE_CONCEPT.objectives
    .map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` | shipped: ${[...SHIPPED_KINDS].join('+')}`)
/*
 * And `automaticityTarget` set on the procedures and absent on the point that
 * is not one. Reaching for the right inverse in the right order has to become
 * fluent; deciding which of two steps is invertible does not, and a timing
 * target on it measures typing — which is the case types.ts makes for the
 * field usually being absent.
 *
 * Asserted by name on all three rather than as a count, because "two of the
 * three are timed" would pass with the timing on the wrong two.
 */
t('the two procedural points are timed and the one about why a step is illegal is not',
  SOLVE_CONCEPT.knowledgePoints
    .map(p => `${p.id}:${p.automaticityTarget === undefined ? 'untimed' : 'timed'}`).join(' ')
  === 'undo-the-operations-in-reverse-order:timed '
    + 'the-unknown-on-both-sides-is-collected-first:timed '
    + 'a-non-invertible-step-changes-the-solutions:untimed',
  SOLVE_CONCEPT.knowledgePoints
    .map(p => `${p.id}:${p.automaticityTarget ?? 'none'}`).join(' '))
t('and its positions restart at 1, which they do per concept rather than per subject',
  SOLVE_CONCEPT.knowledgePoints.map(p => p.position).join(',') === '1,2,3',
  SOLVE_CONCEPT.knowledgePoints.map(p => p.position).join(','))

/**
 * THE SAME THREE HABITS ON THE THIRD CONCEPT, AND THE FIRST ONE IS WHERE THE
 * RULE DID WORK RATHER THAN BEING EASY TO OBEY.
 *
 * The natural third objective for a systems concept is "say whether a system
 * has no solutions, one, or infinitely many", and that objective would name no
 * kind that could evidence it — a classification is not a value, not a form,
 * and no verifiable kind returns one. So it asks for the number the
 * elimination leaves and says in its own statement what the two possible
 * values mean. The classification is the thing to understand; the leftover is
 * the thing to produce.
 *
 * That is `variables-and-expressions`' `justify` problem avoided rather than
 * repeated, and worth asserting separately from the concept above it, because
 * the two concepts obey the rule for different reasons — one had an unrulable
 * ACCOUNT to keep out of `taskKinds`, this one had an unrulable ANSWER.
 */
const SYSTEM_CONCEPT = VE.concepts.find(c => c.id === 'systems-of-linear-equations')
t('every objective on the system names only a kind the subject actually ships',
  SYSTEM_CONCEPT.objectives.length === 3
  && SYSTEM_CONCEPT.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => SHIPPED_KINDS.has(k))),
  SYSTEM_CONCEPT.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` | shipped: ${[...SHIPPED_KINDS].join('+')}`)
/*
 * And the timing, by name on all three for the reason the concept above gives:
 * "two of the three are timed" would pass with the timing on the wrong two.
 * The two procedures are elimination and substitution; the point about what a
 * leftover sentence means is a judgement, and a timing target on it measures
 * typing.
 *
 * The figure is 25 seconds rather than the 20 the concept above carries, and
 * that is a claim worth checking rather than a style choice: a system is two
 * equations' worth of arithmetic before the first inverse can be applied.
 */
t('the two procedural points are timed at the subject\'s longest and the judgement is untimed',
  SYSTEM_CONCEPT.knowledgePoints
    .map(p => `${p.id}:${p.automaticityTarget ?? 'untimed'}`).join(' ')
  === 'eliminate-a-letter-by-combining-the-equations:25000 '
    + 'substitution-reduces-the-system-to-one-equation:25000 '
    + 'when-both-letters-cancel-the-leftover-decides:untimed',
  SYSTEM_CONCEPT.knowledgePoints
    .map(p => `${p.id}:${p.automaticityTarget ?? 'none'}`).join(' '))
/*
 * THIS WAS A ONE-SIDED RATCHET AND IT WENT RED ON A SUCCESS.
 *
 * It read "longer than every timed point in the two concepts BELOW it", and it
 * was implemented as "longer than every timed point in every OTHER concept" —
 * which is the same thing only while the system is the last concept in the
 * chain. `gaussian-elimination` was authored above it at 30 seconds, so the
 * assertion failed because the subject grew in the direction it was predicting,
 * and the figure it was defending had not moved at all.
 *
 * Restated two-sidedly rather than renumbered, which is the fix that survives
 * the next concept: the claim worth holding is that the timing does not DROP as
 * the chain goes up, because each concept is the one below it plus more
 * arithmetic before the first inverse can be applied. So every concept's timed
 * minimum is at least the previous concept's timed maximum, walked in teaching
 * order. 20 → 20 → 25 → 30 satisfies it, and so would a fifth concept at 30;
 * a concept timed FASTER than its own prerequisite would not, and that is the
 * thing actually worth catching.
 */
t('timing never drops as the chain goes up — each concept starts no faster than the last one ended',
  (() => {
    const timed = teachingOrder(VE)
      .map(id => VE.concepts.find(c => c.id === id).knowledgePoints
        .map(p => p.automaticityTarget).filter(v => v !== undefined))
      .filter(xs => xs.length > 0)
    return timed.every((xs, i) =>
      i === 0 || Math.min(...xs) >= Math.max(...timed[i - 1]))
  })(),
  teachingOrder(VE).map(id => `${id}:${VE.concepts.find(c => c.id === id).knowledgePoints
    .map(p => p.automaticityTarget ?? '-').join('/')}`).join(' '))
t('and its positions restart at 1 too, which is only observable once a subject has three concepts',
  SYSTEM_CONCEPT.knowledgePoints.map(p => p.position).join(',') === '1,2,3'
  && VE.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  VE.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))

/**
 * THE FOURTEENTH PROMOTION, AND THE ONE THAT FINISHED THE LAST JOURNEY.
 *
 * `gaussian-elimination` was the only unwritten concept left on any journey's
 * route in the whole build, so there was no choice to make about which to
 * write — readiness recomputed from the tree as
 * `[dest, ...allPrerequisitesOf(M, dest)].filter(id => !isTeachable(M, id))`
 * returned exactly one id. What there WAS a choice about is where it went, and
 * that is asserted below because the structure decided it rather than taste.
 *
 * What the promotion had to get right, in the order the mistakes would have
 * been silent in:
 *
 *  - Three knowledge points, matching the two concepts below it: the forward
 *    pass, the upward pass, and the row that empties. Not four — the pivot/swap
 *    question belongs inside the first point's choice of clearing row, and
 *    splitting it out would have left a point whose only task was a drill.
 *  - Seven tasks, with the triple SPLIT across the first two points rather than
 *    stacked on the first, because the method splits it that way.
 *  - Every subgoal shipped with its question written, which is the figure that
 *    silently fails when somebody writes labels and leaves the questions for
 *    later. This subject asserts it subject-wide for exactly that reason.
 *  - Objectives naming only `evaluate`, with the one unrulable question — WHY
 *    fixing the order turns a search into a procedure — in `socratic` instead.
 */
group('the fourteenth promotion, which took the last unwritten concept off the last route')
const GAUSS = VE.concepts.find(c => c.id === 'gaussian-elimination')
const GAUSS_POINTS = GAUSS.knowledgePoints
t('three knowledge points numbered from 1, the same shape as the two concepts below it',
  GAUSS_POINTS.length === 3
  && GAUSS_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${GAUSS_POINTS.length} points at ${GAUSS_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and the two passes are timed while the judgement is not',
  GAUSS_POINTS.every(p => p.visualRef === undefined)
  && GAUSS_POINTS.map(p => `${p.id}:${p.automaticityTarget ?? 'untimed'}`).join(' ')
    === 'clear-downwards-so-each-row-holds-one-letter-fewer:30000 '
      + 'back-substitution-runs-back-up-the-staircase:25000 '
      + 'a-row-that-empties-reports-instead-of-stalling:untimed',
  GAUSS_POINTS.map(p => `${p.id}:${p.automaticityTarget ?? 'none'}`).join(' '))
/*
 * The two timed points differ from each other, which is the one timing claim in
 * the subject that is about the work rather than about the chain. The forward
 * pass multiplies two equations through and subtracts them; the upward pass
 * substitutes and divides, twice, with nothing multiplied through. So the
 * figures are 30 and 25 and not one number used twice for tidiness.
 */
t('and the forward pass is timed longer than the upward one, which is the more arithmetic',
  GAUSS_POINTS[0].automaticityTarget > GAUSS_POINTS[1].automaticityTarget,
  `${GAUSS_POINTS[0].automaticityTarget} vs ${GAUSS_POINTS[1].automaticityTarget}`)
t('every objective names a task kind, and every kind it names is one the subject ships',
  GAUSS.objectives.length === 3
  && GAUSS.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => SHIPPED_KINDS.has(k))),
  GAUSS.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))
t('seven tasks, all evaluate, and the triple is split across the two passes not stacked on one',
  GAUSS_POINTS.flatMap(p => tasksForPoint(p.id)).length === 7
  && GAUSS_POINTS.every(p => tasksForPoint(p.id).length > 0)
  && GAUSS_POINTS.flatMap(p => tasksForPoint(p.id))
    .every(x => x.kind === 'evaluate' && x.form === undefined)
  && tasksForPoint('clear-downwards-so-each-row-holds-one-letter-fewer').length === 2
  && tasksForPoint('back-substitution-runs-back-up-the-staircase').length === 2
  && tasksForPoint('a-row-that-empties-reports-instead-of-stalling').length === 3,
  GAUSS_POINTS.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))

// ---------------------------------------------------------------------------
// The eighth subject: the angle facts, the triangle, congruence, similarity
// and Pythagoras
// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-geometry.ts's HEADER, for the reason the
 * two blocks above do it: each is the kind of statement that otherwise rots
 * into a comment that used to be true.
 *
 * `points-lines-angles` was promoted out of the `euclidean-geometry` map area
 * because it was the only concept on the route of the shortest unfinished
 * journey whose own prerequisites were not themselves unwritten — it has none.
 * The journey half of that is checked in tests/journeys.mjs, which is the
 * harness that resolves routes. What is checkable here is that the material is
 * real, that the subject rules with no worker, and that the two structural
 * facts the file leans on — a single concept and no edges — are what it says.
 */
const PG = getOntology('plane-geometry')

group('plane-geometry, the first angle facts')
t('it is registered, and THIRD — registry order is the curriculum order',
  ONTOLOGIES[2] === PG && PG?.subject.id === 'plane-geometry')
t('and it displaced neither of the two positions anything depends on',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS)
t('it has no internal faults', ontologyProblems(PG).length === 0, ontologyProblems(PG).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(PG).length === 0)
const PG_CONCEPT_IDS = [
  'points-lines-angles', 'triangle-basics', 'congruence', 'similarity', 'pythagoras',
  'quadrilaterals-and-polygons', 'area-and-perimeter', 'geometric-proof', 'circles',
  'circle-measure', 'distance-and-midpoint',
]
t('eleven concepts, three knowledge points each',
  PG.concepts.length === 11 && allKnowledgePoints(PG).length === 33
  && PG.concepts.every(c => c.knowledgePoints.length === 3),
  `${PG.concepts.length} concepts, ${allKnowledgePoints(PG).length} points`)
t('all eleven concepts are teachable AND practisable — a syllabus, not eleven map entries',
  PG_CONCEPT_IDS.every(id => isTeachable(PG, id) && isPractisable(PG, id)),
  PG_CONCEPT_IDS.filter(id => !isTeachable(PG, id) || !isPractisable(PG, id)).join(', '))
/*
 * The eighth promotion is the first concept in this subject that is `guided`
 * rather than `checked`, and it is asserted on its own because the two halves
 * of the claim are easy to collapse into one.
 *
 * `fidelity` says whether a PATTERN can decide that some statement is about
 * this concept. `isTeachable` says whether there is material. They are
 * independent, and this concept is the first place in the subject where they
 * disagree: the map node carried no pattern, inventing one during an authoring
 * pass is the change the scope comments forbid, and a pattern on "proof" would
 * claim most of the medium rather than select from it. So the recognition is
 * unchecked and the teaching is not, and the caveat has to say which — a
 * caveat that read like a mapped node's would tell a learner there is nothing
 * to practise, in front of six tasks.
 */
t('and the eighth is the subject\'s first guided concept, with a caveat that is about recognition',
  PG.concepts.find(c => c.id === 'geometric-proof')?.fidelity === 'guided'
  && !PG.concepts.find(c => c.id === 'geometric-proof')?.scope.match
  && /filters nothing/.test(PG.concepts.find(c => c.id === 'geometric-proof')?.caveat ?? '')
  && PG.concepts.filter(c => c.fidelity === 'guided').map(c => c.id).join(',') === 'geometric-proof',
  PG.concepts.map(c => `${c.id}:${c.fidelity}`).join(' '))
t('while still being teachable and practisable, which fidelity says nothing about',
  isTeachable(PG, 'geometric-proof') && isPractisable(PG, 'geometric-proof'))
/*
 * Positions restart per concept rather than running 1..6 through the subject.
 * `position` is documented as order WITHIN the concept, and the two readings
 * are indistinguishable while a subject holds one concept — so the second one
 * is the first chance to get it wrong, and the first draft of it did.
 */
t('each concept numbers its own points from 1',
  PG.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  PG.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(PG).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(PG).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
t('every objective names a task kind',
  PG.concepts.every(c => c.objectives.length > 0 && c.objectives.every(o => o.taskKinds.length > 0)))
/*
 * The subject's one edge, and where it came from, because the empty list it
 * replaced was load-bearing text rather than an unfinished one.
 *
 * `points-lines-angles` stranded nothing when it was promoted: it declared no
 * `needs`, and the one edge pointing INTO it was owned by `triangle-basics`,
 * still a map node at the time. Promoting the triangles stranded exactly that
 * edge, since it was the promoted node's own `needs`. It did not go back to
 * `EUCLIDEAN_GEOMETRY.links` — both endpoints are concepts of this subject
 * now, so the edge is internal and lives here, and an area asserting it would
 * have it filtered straight back out by `areaOntology`.
 *
 * So the pair of assertions is: this subject owns the edge, and the area still
 * owns no links. The second half is in tests/atlas.mjs, and together they are
 * what would catch a later `links` entry added "for symmetry".
 *
 * `congruence` then did exactly the same thing a third time — its own `needs`
 * was `triangle-basics`, already a concept here — so the subject owned a CHAIN
 * of two edges and the area still owned no links. Asserted as the whole ordered
 * chain rather than as independent edges, because what matters is that the
 * concepts are in one line: each promotion has been directly above the last,
 * and a later edge that forked the subject would pass an edges-exist check
 * while changing what gates what.
 *
 * `similarity` extended the chain to three and then did two things neither of
 * the promotions before it did, which is why the assertion is now in two parts.
 *
 * It stranded a second `needs` that could NOT come here — `ratio-and-rate`, a
 * map node, of `NUMBER_AND_ARITHMETIC` then and of `algebra-foundations` since
 * those two areas merged — and an authored ontology may only name
 * concepts it contains. So the area's `links` is no longer empty, and the half
 * of that pair which lived in tests/atlas.mjs had to change with it. The
 * prerequisite chain here is unaffected, which is the point of separating them.
 *
 * It also stranded a `confusedWith`, so this subject now owns an edge that is
 * not a prerequisite at all. The chain assertion is therefore taken over the
 * prerequisites specifically rather than over `PG.edges` wholesale: a bare
 * `every(e => e.kind === 'prerequisite')` would now fail for a correct
 * ontology, and relaxing it to "mostly prerequisites" would stop checking the
 * line. The interference is asserted on its own terms below.
 *
 * `quadrilaterals-and-polygons` stranded one edge too — `congruence` again,
 * already a concept here — so the cheap case is back for a fourth time and the
 * area still owns no new link. What it is NOT is another link in the chain. It
 * is the second child of `congruence`, so this subject stopped being a line and
 * became a tree, and the assertion had to split in two: the line that the first
 * five promotions walked, and the fork the sixth hung off it. Asserting one
 * ordered string over all five prerequisites would have worked and would have
 * said the wrong thing — the claim worth holding is that the fork is off
 * `congruence` specifically, because an edge accidentally hung off `pythagoras`
 * instead would pass a string comparison written after the fact while changing
 * what gates what.
 */
/*
 * `area-and-perimeter` then made it two forks and the first PAIR of edges from
 * one promotion. It declared both `quadrilaterals-and-polygons` and
 * `triangle-basics` and both were already concepts here, so both edges are
 * internal and both are below — which is why the prerequisite count moves by
 * two rather than one, and why the area's `links` needed no entry even though
 * the node had two `needs`.
 *
 * The second of them hangs off `triangle-basics`, which had been a leaf of the
 * line since the second promotion, so there are two branch points now. Each
 * fork is asserted against the node that CARRIES it for the reason the sixth
 * promotion established: an edge accidentally hung off `congruence` instead of
 * the triangles would pass an ordered-list comparison written after the fact
 * while changing what gates what. The claim that `triangle-basics` has exactly
 * two children, and which two, is what would catch it.
 */
const PG_PREREQS = PG.edges.filter(e => e.kind === 'prerequisite')
/*
 * The branch points, computed once rather than re-derived in each of the four
 * assertions that used to inline it.
 *
 * It read `'congruence,triangle-basics'` in three places through four
 * promotions, and the eleventh made it three members — which is the shape
 * bza's own notes call a one-sided ratchet: an assertion written as "the forks
 * are STILL exactly two" is phrased over the complement of whatever arrived
 * last, so it goes red on success and has to be edited in three places at
 * once. Named here so the next promotion edits one line, and so the per-
 * promotion claims below can each hold the thing they are actually about.
 */
const pgForks = () => [...new Set(PG_PREREQS.map(e => e.from))]
  .filter(from => PG_PREREQS.filter(e => e.from === from).length > 1).sort().join(',')
t('the first five promotions still form one chain pointing upward',
  PG_PREREQS.map(e => `${e.from}->${e.to}`).slice(0, 4).join(' ')
    === 'points-lines-angles->triangle-basics triangle-basics->congruence '
      + 'congruence->similarity similarity->pythagoras',
  PG.edges.map(e => `${e.from}->${e.to}:${e.kind}`).join(', '))
/*
 * The sixth's claim is that the fork hangs off `congruence` SPECIFICALLY, and
 * it used to be written as the whole of that node's child set — which was fine
 * while the set was two and went stale the moment the eighth promotion made it
 * three. So the claim is narrowed to the one thing the sixth promotion
 * established, that `quadrilaterals-and-polygons` is reached from `congruence`
 * and from nowhere else, and the membership of the fork is asserted in one
 * place below rather than in two that can disagree.
 */
t('and the sixth forks off congruence rather than extending that chain',
  PG_PREREQS.filter(e => e.to === 'quadrilaterals-and-polygons')
    .map(e => e.from).join(',') === 'congruence'
  && PG_PREREQS.filter(e => e.from === 'congruence').map(e => e.to).includes('similarity'),
  PG_PREREQS.map(e => `${e.from}->${e.to}`).join(' '))
t('and the seventh, ninth and tenth each contributed TWO edges, so the count moves by two thrice',
  PG_PREREQS.length === 13
  && PG_PREREQS.filter(e => e.to === 'area-and-perimeter').map(e => e.from).sort().join(',')
    === 'quadrilaterals-and-polygons,triangle-basics'
  && PG_PREREQS.filter(e => e.to === 'circles').map(e => e.from).sort().join(',')
    === 'geometric-proof,pythagoras'
  && PG_PREREQS.filter(e => e.to === 'circle-measure').map(e => e.from).sort().join(',')
    === 'area-and-perimeter,circles',
  `${PG_PREREQS.length}: ${PG_PREREQS.map(e => `${e.from}->${e.to}`).join(' ')}`)
/*
 * The eighth promotion widened a fork instead of making one, which is the one
 * shape this list had not shown and the reason this is asserted as a named SET
 * rather than as an out-degree.
 *
 * `congruence` had two children — `similarity` from the fourth promotion and
 * `quadrilaterals-and-polygons` from the sixth — and now has three. The number
 * of branch points did not move: it is still `congruence` and
 * `triangle-basics`, so "the tree grew" is true and "the tree branched" is not,
 * and those are different claims. A check on `congruence`'s out-degree would
 * have gone from 2 to 3 for any third child, including one hung off the wrong
 * parent by accident, which is the failure the sixth promotion's note already
 * identified. So the claim held here is WHICH three.
 */
t('and the eighth widens the congruence fork to three without adding a branch point',
  PG_PREREQS.filter(e => e.from === 'congruence').map(e => e.to).sort().join(',')
    === 'geometric-proof,quadrilaterals-and-polygons,similarity'
  && PG_PREREQS.filter(e => e.to === 'geometric-proof').map(e => e.from).join(',') === 'congruence'
  && PG_PREREQS.filter(e => e.from === 'geometric-proof').length === 1,
  PG_PREREQS.map(e => `${e.from}->${e.to}`).join(' '))
t('and geometric-proof reaches the angle facts only through congruence',
  prerequisitesOf(PG, 'geometric-proof').join(',') === 'congruence'
  && allPrerequisitesOf(PG, 'geometric-proof').includes('points-lines-angles')
  && allPrerequisitesOf(PG, 'geometric-proof').includes('triangle-basics'),
  prerequisitesOf(PG, 'geometric-proof').join(', '))
/*
 * THE NINTH PROMOTION MERGED TWO BRANCHES, and that claim needs an ancestry
 * check rather than an in-degree one, because the subject already had a
 * two-parent node and the two cases are not the same event.
 *
 * `area-and-perimeter` names `quadrilaterals-and-polygons` and
 * `triangle-basics`, and those two are NESTED — `triangle-basics` is an
 * ancestor of `quadrilaterals-and-polygons` through `congruence` — so that node
 * joined a line to a point further down the same line. `circles` names
 * `geometric-proof` and `pythagoras`, and NEITHER is an ancestor of the other:
 * one hangs off `congruence` directly and the other off `similarity`. So this
 * is the first node where two branches that genuinely parted come back
 * together, and the subject's shape is a DAG rather than a tree with a
 * shortcut in it.
 *
 * Asserted as "neither parent is an ancestor of the other", in both directions
 * and against the nested case for contrast, because every cheaper form of this
 * check passes on both nodes. In-degree is 2 for each. "Has two parents in this
 * subject" is true of each. Even "its parents are not adjacent" is true of
 * each. The ancestry relation is the only thing that separates them, and it is
 * the thing the claim is about.
 */
const PG_ANC = id => allPrerequisitesOf(PG, id)
t('circles is the first node whose two parents are on separate branches',
  PG_PREREQS.filter(e => e.to === 'circles').map(e => e.from).sort().join(',')
    === 'geometric-proof,pythagoras'
  && !PG_ANC('pythagoras').includes('geometric-proof')
  && !PG_ANC('geometric-proof').includes('pythagoras'),
  `pythagoras<-[${PG_ANC('pythagoras').join(' ')}] proof<-[${PG_ANC('geometric-proof').join(' ')}]`)
t('while the seventh promotion\'s two-parent node joined a line to its own ancestor',
  PG_PREREQS.filter(e => e.to === 'area-and-perimeter').map(e => e.from).sort().join(',')
    === 'quadrilaterals-and-polygons,triangle-basics'
  && PG_ANC('quadrilaterals-and-polygons').includes('triangle-basics'),
  PG_ANC('quadrilaterals-and-polygons').join(', '))
/*
 * The ninth promotion's "it added no branch point" is now asserted on
 * `geometric-proof` alone, and the `pythagoras` half is DELETED rather than
 * repaired — because repairing it would be the wrong fix twice over.
 *
 * The claim was that `circles`'s two parents each went from no children to
 * one, so neither became a fork. That was true when it was written. The
 * eleventh promotion gave `pythagoras` a second child, so the clause
 * `filter(e => e.from === 'pythagoras').length === 1` is now a claim that this
 * promotion did not happen — the same thing the seventh promotion's root
 * assertion became, and the file's rule is to rehome the claim rather than
 * weaken it. `geometric-proof` still has exactly one child and still carries
 * the half of the ninth's claim that is stable.
 */
t('and the merge added no branch point at the parent that still has only the one child',
  PG_PREREQS.filter(e => e.from === 'geometric-proof').map(e => e.to).join(',') === 'circles',
  PG_PREREQS.map(e => `${e.from}->${e.to}`).join(' '))
t('and circles collects nothing from below its own pair, since both are authored here',
  gatingPrerequisitesOf(PG, 'circles').slice().sort().join(',')
    === 'geometric-proof,pythagoras',
  gatingPrerequisitesOf(PG, 'circles').join(', '))
/*
 * THE TENTH PROMOTION CLOSED THE FORK, and that is a different claim from the
 * ninth's merge — which is why it gets its own assertion instead of being read
 * off the one above.
 *
 * Every cheaper form of the check passes on BOTH nodes. In-degree is 2 for each.
 * "Two parents in this subject" is true of each. "Neither parent is an ancestor
 * of the other" is true of each, and that is exactly what the ninth's assertion
 * holds. So the ancestry of the named three is the only thing that separates the
 * two events.
 *
 * `congruence` forked three ways — `similarity` at the fourth promotion,
 * `quadrilaterals-and-polygons` at the sixth, `geometric-proof` at the eighth.
 * `circles` reconverged two of the three and provably not the third: the
 * assertion above holds that the polygons are deliberately NOT behind it.
 * `circle-measure` reaches all three, because its second parent
 * `area-and-perimeter` sits on the polygons branch. So this is the first concept
 * of the subject with every child of `congruence` in its ancestry.
 *
 * The contrast against `circles` is asserted in the same breath rather than
 * separately, because the claim is comparative: "has all three" means nothing
 * here unless the node one promotion down is known not to.
 */
t('the tenth is the first node with all three branches of the congruence fork behind it',
  ['similarity', 'quadrilaterals-and-polygons', 'geometric-proof']
    .every(id => PG_ANC('circle-measure').includes(id))
  && !PG_ANC('circles').includes('quadrilaterals-and-polygons')
  && PG_PREREQS.filter(e => e.from === 'congruence').map(e => e.to).sort().join(',')
    === 'geometric-proof,quadrilaterals-and-polygons,similarity',
  `circle-measure<-[${PG_ANC('circle-measure').join(' ')}]`)
t('and it added no branch point either, its two parents each keeping one child',
  PG_PREREQS.filter(e => e.from === 'circles').length === 1
  && PG_PREREQS.filter(e => e.from === 'area-and-perimeter').length === 1,
  PG_PREREQS.map(e => `${e.from}->${e.to}`).join(' '))
/*
 * THE ELEVENTH PROMOTION OPENED THE THIRD BRANCH POINT, which is the first time
 * since the seventh that one has appeared, and the reason it gets its own
 * assertion rather than an amended count.
 *
 * `distance-and-midpoint` names `pythagoras` and nothing else in this subject,
 * and `pythagoras` had exactly one child — `circles`, from the ninth. So it now
 * has two, and the fork set goes from two members to three. Four assertions
 * above used to carry `'congruence,triangle-basics'` inline and three of them
 * were really about one node's out-degree; they now say so, and the set itself
 * is asserted once, here, by named membership for the reason the root-set
 * assertions in tests/atlas.mjs give at length — a `length === 3` check would
 * be satisfied by a fork accidentally opened at the wrong node.
 *
 * The subject also stopped having a single sink, which the tenth promotion's
 * note in ontology-geometry.ts said would happen at the eleventh whichever node
 * it turned out to be, and declined to assert for that reason. It is recorded
 * here and not checked, on the same grounds.
 */
t('the eleventh opens a third branch point, at pythagoras, and names which three they are',
  pgForks() === 'congruence,pythagoras,triangle-basics'
  && PG_PREREQS.filter(e => e.from === 'pythagoras').map(e => e.to).sort().join(',')
    === 'circles,distance-and-midpoint'
  && PG_PREREQS.filter(e => e.to === 'distance-and-midpoint').map(e => e.from).join(',')
    === 'pythagoras',
  `forks: ${pgForks()}`)
/*
 * And the one edge of the promotion that no gating walk can see: the subject's
 * first `encompasses`.
 *
 * The map node declared `exercises: ['pythagoras']`, which `expandEdges` turns
 * into an `encompasses`, and deleting the node deletes it. Nothing else in
 * either suite would have gone red — `encompasses` gates nothing, so a missing
 * one shows up only as a learner re-drilling what they last demonstrated. This
 * is therefore the assertion standing in for a failure mode that has none, and
 * it is asserted in both directions: the edge exists with its reason, and the
 * composed graph carries it exactly once, which is what a stray second
 * declaration would break.
 */
t('and the subject\'s first encompasses edge, which gates nothing and would vanish silently',
  edgesOfKind(PG, 'encompasses').map(e => `${e.from}=>${e.to}`).join(',')
    === 'distance-and-midpoint=>pythagoras'
  && edgesOfKind(PG, 'encompasses').every(e => !!e.rationale)
  && encompassedBy(PG, 'distance-and-midpoint').join(',') === 'pythagoras',
  PG.edges.filter(e => e.kind === 'encompasses').map(e => `${e.from}=>${e.to}`).join(', '))
t('so practising the distance formula credits Pythagoras, at distance one',
  encompassedClosure(PG, 'distance-and-midpoint').get('pythagoras') === 1,
  [...encompassedClosure(PG, 'distance-and-midpoint').entries()]
    .map(([id, d]) => `${id}:${d}`).join(' '))
t('and the prerequisite in the other direction is not a cycle, since only prerequisites are walked',
  cycles(PG).length === 0
  && prerequisitesOf(PG, 'distance-and-midpoint').join(',') === 'pythagoras',
  cycles(PG).map(c => c.join('->')).join(' | '))
t('and it collects nothing from below its own pair, both of its parents being authored here',
  gatingPrerequisitesOf(PG, 'circle-measure').slice().sort().join(',')
    === 'area-and-perimeter,circles'
  && gatingPrerequisitesOf(PG, 'circle-measure').slice().sort().join(',')
    === prerequisitesOf(PG, 'circle-measure').slice().sort().join(','),
  gatingPrerequisitesOf(PG, 'circle-measure').join(', '))
/*
 * The one fact the third knowledge point uses from OUTSIDE its own ancestry,
 * asserted so that nobody repairs the apparent gap by adding an edge.
 *
 * That worked example leans on a quadrilateral's angles totalling 360°, which
 * is `quadrilaterals-and-polygons`' material — and that concept is NOT behind
 * this one: it forks off `congruence` on a third branch. No edge was invented
 * to make it an ancestor, because adding a prerequisite changes what gates what
 * for every learner and doing it as a side effect of writing a worked example
 * is what ontology-geometry.ts records itself refusing for `integer-arithmetic`.
 * The example re-derives the total from one diagonal and the triangle angle
 * sum instead, and `triangle-basics` IS an ancestor — so the fact is reached
 * from inside the gate.
 */
t('and the polygons are deliberately NOT behind circles, while the triangles are',
  !PG_ANC('circles').includes('quadrilaterals-and-polygons')
  && PG_ANC('circles').includes('triangle-basics'),
  PG_ANC('circles').join(', '))
t('one of which forks off the triangles, giving the subject a second branch point',
  PG_PREREQS.filter(e => e.from === 'triangle-basics').map(e => e.to).sort().join(',')
    === 'area-and-perimeter,congruence',
  PG_PREREQS.filter(e => e.from === 'triangle-basics').map(e => e.to).join(', '))
t('and area-and-perimeter reaches the angle facts only through the two it names',
  prerequisitesOf(PG, 'area-and-perimeter').slice().sort().join(',')
    === 'quadrilaterals-and-polygons,triangle-basics'
  && allPrerequisitesOf(PG, 'area-and-perimeter').includes('points-lines-angles')
  && allPrerequisitesOf(PG, 'area-and-perimeter').includes('congruence'),
  prerequisitesOf(PG, 'area-and-perimeter').join(', '))
t('every prerequisite here names two concepts of this subject, and says who promoted it',
  PG_PREREQS.every(e => !!conceptById(PG, e.from) && !!conceptById(PG, e.to)
    && e.promotedBy === 'author:plane-geometry'),
  PG_PREREQS.filter(e => e.promotedBy !== 'author:plane-geometry').map(e => e.id).join(', '))
/*
 * The interference the fourth promotion stranded, which is the first edge in
 * this subject that gates nothing. It constrains SELECTION — never introduce
 * these two together — and that is exactly why it needs its own assertion: a
 * missing prerequisite shows up as a missing gate in the walk, and a missing
 * interference shows up as nothing at all until a learner is handed similarity
 * and congruence in the same sitting.
 */
t('and one interference, the only edge here that gates nothing, with its reason stated',
  edgesOfKind(PG, 'interferes_with').length === 1
  && edgesOfKind(PG, 'interferes_with').every(e => !!e.rationale)
  && /proportional/.test(interferenceReason(PG, 'similarity', 'congruence') ?? ''),
  PG.edges.filter(e => e.kind !== 'prerequisite').map(e => `${e.from}~${e.to}`).join(', '))
t('and it reads the same in both directions, since interference is symmetric',
  interferenceReason(PG, 'similarity', 'congruence')
  === interferenceReason(PG, 'congruence', 'similarity'))
t('so the angle facts are still the subject\'s root, and neither of the others is',
  roots(PG).length === 1 && roots(PG)[0] === 'points-lines-angles',
  roots(PG).join(', '))
/*
 * The chain is three deep now, which is the first time this subject could get
 * transitivity wrong. `congruence` rests on the angle facts THROUGH the
 * triangles, and it must not also name them directly: a redundant edge would
 * be invisible in the gating walk and would quietly make the subject's shape a
 * claim about two routes rather than one.
 */
t('congruence reaches the angle facts only through the triangles',
  prerequisitesOf(PG, 'congruence').join(',') === 'triangle-basics'
  && allPrerequisitesOf(PG, 'congruence').includes('points-lines-angles'),
  prerequisitesOf(PG, 'congruence').join(', '))

group('the eighth subject is gradable with no worker')
const PG_TASKS = allKnowledgePoints(PG).flatMap(p => tasksForPoint(p.id))
t('sixty-six tasks, two on each of the thirty-three points', PG_TASKS.length === 66
  && allKnowledgePoints(PG).every(p => tasksForPoint(p.id).length === 2),
  `${PG_TASKS.length}`)
/*
 * Thirty-five `evaluate` and ONE `transform_to_form`, and the split is asserted
 * rather than relaxed to "mostly evaluate".
 *
 * The run of twenty-four was a real claim and it is in the ontology header: the
 * natural ask in the first four concepts is "name the fact you used", no
 * `NamedForm` describes a reason, so each task scores the arithmetic the fact
 * licenses. That did not stop being true. `pythagoras` is the first concept
 * here whose content is a relation between numbers rather than a
 * correspondence, and its second point is specifically about the answer being
 * an irrational surd — an ask that `evaluate` cannot carry at all, because
 * `exactValue` returns null on √180 and correctly so. So the one exception is
 * where the subject gained an ask, not where it gave one up.
 *
 * The polygons added six more `evaluate` and no second exception, which is the
 * honest outcome rather than a missed opportunity: the asks in that concept are
 * a side count, a difference of two angles and an angle total, and all three
 * are numbers. No `NamedForm` describes "the four angles are not all equal",
 * and the arithmetic refutation of it IS a number, so there was nothing a form
 * could have carried better.
 *
 * `area-and-perimeter` added six more and no third kind either, and it is the
 * concept where that is least a compromise: both of its measures are values,
 * so an area, a perimeter and the difference between two of either are all
 * `evaluate` asks in their own right rather than proxies for something else.
 * One of the six is the same expression as another doing the opposite job —
 * `a*b - c*d` is a cut region's area in the first point and the gap between two
 * equal-perimeter rectangles in the third — which is the subject's habit of
 * making the repetition the content, and asserted as a pair below.
 *
 * `geometric-proof` added the last six and no third kind, and here that is the
 * answer to an objection rather than a shrug. The concept was twice left on the
 * map because its natural kind is `justify`, `justify` is unverifiable, and the
 * assertion above forbids shipping an unverifiable kind at all — so a
 * justify-only concept has three chains that cannot become evidence. All six of
 * these are `evaluate`, so `chainsWithNoRuling` did not move. The kind that
 * would fit the third point better is `counterexample`, which carries no tasks
 * anywhere in the build for the reason at the top of tasks.ts, and the concept's
 * objectives decline to name it rather than promising practice that cannot be
 * served.
 *
 * `circles` added six more and the SECOND `transform_to_form`, and the second
 * one arrives for exactly the reason the first did, which is what makes it
 * worth asserting as a pair rather than loosening the claim to "one or two".
 * `pythagoras` gained a form because a hypotenuse is normally an irrational and
 * `exactValue` returns null on a surd, so `evaluate` cannot carry the ask at
 * all. A tangent length is the same object — a root of a difference of two
 * squares — so the same gap appears, and the same form fills it. Five of the
 * six circle tasks are still `evaluate`, because an inscribed angle and an
 * angle total are numbers.
 *
 * The two forms are both `surd_reduced` and that is now a claim about the
 * subject rather than about one concept: every irrational this syllabus
 * produces is a length got by taking a root, so the only non-numeric ask it
 * has ever needed is "leave it exactly". Asserted as a named, ordered pair so
 * that a third form arriving has to be argued for.
 *
 * `circle-measure` added the last six, all `evaluate`, and it is the concept
 * where that took a decision rather than falling out — so the pair above stays
 * a pair for a reason worth recording here.
 *
 * Every measure this concept produces is an irrational: a circumference is 14π,
 * an area is 324π, and `exactValue` returns null on `pi` exactly as it does on
 * a surd. That is the gap `pythagoras` and `circles` filled with
 * `transform_to_form`, so a third form was the obvious move — and there is no
 * form to reach for. `surd_reduced` is about what sits under a radical and says
 * nothing about a multiple of π; a `pi_factored` form would have to be invented,
 * and inventing a `NamedForm` during an authoring pass is what the header of
 * that union in types.ts argues against, since the compiler then demands a
 * checker and the checker would exist to serve one concept.
 *
 * So all six tasks ask for the MULTIPLE of π and the prompts say so. That keeps
 * the subject's no-worker contract — asserted two checks below over every
 * `evaluate` here — and it leaves the step from `14` to `14π cm` unscored,
 * which the block above these tasks in tasks.ts names as the concept's unscored
 * part. The alternative was to ask for a decimal and accept the worker, which
 * would have taught that 43.98 cm is the circumference when 14π is.
 */
const PG_EVAL = PG_TASKS.filter(x => x.kind === 'evaluate')
const PG_FORM = PG_TASKS.filter(x => x.kind === 'transform_to_form')
/*
 * `distance-and-midpoint` added six more, all `evaluate`, and here the pair
 * above staying a pair is a refusal rather than a gap. A distance IS a root, so
 * `surd_reduced` fits it exactly and a third form task was available for the
 * asking. It was declined because it would have been the same question a fourth
 * time: `roots-and-irrationals` owns reducing a surd, `pythagoras` borrowed it
 * for a hypotenuse and `circles` for a tangent length, and what this concept
 * contributes sits UPSTREAM of the radical — the two legs read off the
 * coordinates. So the figures make the roots come out whole (5, 12, 13 for the
 * segment and 13/2 for each half) and the irrational case is stated in the
 * worked examples instead of drilled again. The two forms remain the two the
 * subject genuinely needed.
 */
t('sixty-four evaluate and two transform_to_form, both surds that a right angle produced',
  PG_EVAL.length === 64 && PG_FORM.length === 2
  && PG_EVAL.every(x => x.form === undefined)
  && PG_FORM.map(x => x.id).join(',')
    === 'reduce-the-hypotenuse-surd-1,reduce-the-tangent-length-surd-1'
  && PG_FORM.every(x => x.form === 'surd_reduced'),
  PG_TASKS.filter(x => x.kind !== 'evaluate').map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  PG_EVAL.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }))
const pgRulings = await Promise.all(PG_EVAL.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  pgRulings.every(r => r.verdict.ruling === 'correct'),
  pgRulings.map((r, i) => `${PG_EVAL[i].id}:${r.verdict?.ruling ?? r.status}`)
    .filter((_, i) => pgRulings[i].verdict?.ruling !== 'correct').join(', '))
/*
 * The surd task separately, because it is the one task in the subject that
 * could have broken the no-worker contract and the only one whose ruling is a
 * form check rather than a value comparison.
 *
 * Both directions are held. Accepting 6√5 is the easy half; REFUSING the
 * unreduced √180 is the half that matters, since `radical_free` is the
 * neighbouring form and the wrong one, and a checker that merely compared
 * values would mark the input correct against itself.
 */
const pgSurd = await ruleTransform(PG_FORM[0], '6*sqrt(5)', NO_WORKER)
t('the surd task rules correct with no worker, by exact comparison rather than a CAS',
  pgSurd.verdict.ruling === 'correct' && /no worker was needed/.test(pgSurd.verdict.method),
  pgSurd.verdict.method)
const pgSurdUnreduced = await ruleTransform(PG_FORM[0], 'sqrt(180)', NO_WORKER)
t('and refuses the given back unreduced, naming the square that can still come out',
  pgSurdUnreduced.verdict.ruling === 'incorrect'
  && /36/.test(pgSurdUnreduced.verdict.brokeAt?.detail ?? ''),
  pgSurdUnreduced.verdict.brokeAt?.detail ?? '')
/*
 * THE SECOND SURD TASK IS RULED SEPARATELY, AND IT HAD TO BE ADDED RATHER THAN
 * INHERITED — which is the small lesson of the ninth promotion for this file.
 *
 * The block above indexes `PG_FORM[0]` explicitly. That was unambiguous while
 * the subject had exactly one form task, and it silently stopped covering the
 * subject the moment a second arrived: the count assertion rose from one to
 * two, every suite stayed green, and the new task shipped with no ruling
 * exercised anywhere. So "there are N of these" and "each of these works" are
 * different claims, and a promotion that adds to a kind has to add to both.
 *
 * Its radicand is harder than the first in the one way that matters here. 180
 * has a single obvious square factor; 192 = 64 × 3 has a square factor that is
 * itself a square of a composite, so a checker pulling out the SMALLEST square
 * would answer 4√12 and stop. That is still an unreduced surd, so the refusal
 * below is a real check on the normal form rather than a repeat of the first.
 */
const pgTangentSurd = await ruleTransform(PG_FORM[1], '8*sqrt(3)', NO_WORKER)
t('the tangent surd rules correct with no worker too, on a radicand with a composite square',
  pgTangentSurd.verdict.ruling === 'correct'
  && /no worker was needed/.test(pgTangentSurd.verdict.method),
  pgTangentSurd.verdict.method)
const pgTangentPartial = await ruleTransform(PG_FORM[1], '4*sqrt(12)', NO_WORKER)
t('and refuses a partly reduced answer, not only the given back whole',
  pgTangentPartial.verdict.ruling === 'incorrect',
  `${pgTangentPartial.verdict.ruling}: ${pgTangentPartial.verdict.brokeAt?.detail ?? ''}`)
/*
 * The two angle sums, as a PAIR. The knowledge point's first subgoal is that
 * choosing between 180 and 360 is the only geometric decision in the problem,
 * and no ruling can score that choice — so the one thing the suite can hold is
 * that both tasks exist, on the same point, with the same shape and different
 * totals. A single one of them would have drilled the subtraction and left the
 * choice invisible.
 */
t('the two-sums point carries both totals, not just the straight line',
  tasksForPoint('two-sums-every-angle-chase-uses').map(x => x.id).sort().join(',')
  === 'full-turn-remainder-1,straight-line-remainder-1',
  tasksForPoint('two-sums-every-angle-chase-uses').map(x => x.id).join(','))
t('and they differ only in the total the figure makes',
  taskById('straight-line-remainder-1').given === '180 - a - b - c'
  && taskById('full-turn-remainder-1').given === '360 - a - b - c')
/*
 * The vertical-angle theorem is 180 − (180 − x) = x, and the task evaluates
 * one instance of it. Checked at a SECOND value here, because "it came back to
 * where it started" is the whole content and a single arithmetic coincidence
 * at the authored input would prove nothing about the claim.
 */
t('the vertical-pair difference is zero away from its authored input too', (() => {
  const task = taskById('vertical-pair-difference-1')
  const at = { x: parseExpression('37', []) }
  const value = exactValue(substitute(parseExpression(task.given, ['x']), at))
  return value !== null && showExact(value) === '0'
})())
/*
 * The error the transversal worked example is built around. 118 is the angle
 * the slide lands OUTSIDE the strip, so answering it for the one inside is the
 * mistake of assuming a translated angle stays in the same part of the figure.
 * It has to rule incorrect rather than inconclusive, or the task teaches
 * nothing at the only point where it could.
 */
t('answering the co-interior task with the angle it is not is settled, not shrugged at',
  (await ruleEvaluate(taskById('co-interior-remainder-1'), '118', NO_WORKER))
    .verdict.ruling === 'incorrect')
/*
 * The congruence tasks that carry a claim rather than an arithmetic instance,
 * checked away from their authored inputs for the reason the vertical pair is:
 * "the difference is 0" is the content, and one coincidence at the authored
 * values would prove nothing about it.
 *
 * `the-third-angle-was-never-free-1` is (a + b + c) − 180, which is 0 for the
 * angles of ANY triangle — that dependence is the whole reason AAA offers two
 * independent numbers instead of three. So it is checked on a second triple
 * with nothing in common with the first.
 *
 * `aas-completes-to-asa-1` is the opposite shape and must NOT be generalised
 * the same way: (180 − a − c) − b is 0 only when b really is the third angle,
 * which is exactly the claim that the AAS data completed to the given ASA
 * data. A second triple is checked here too, but a MISMATCHED one is checked
 * as well, to confirm the task can fail — a difference that were identically
 * zero would score a learner correct for any angles at all.
 */
/*
 * The eleventh promotion's symmetry task, checked away from its authored inputs
 * for the same reason — "the two orderings give the same answer" is the content
 * of the first knowledge point, and one coincidence at the authored quadruple
 * would prove nothing about it. The second quadruple shares no number with the
 * first and puts both points in different quadrants.
 *
 * The companion distance task is NOT generalised the same way and must not be:
 * `sqrt((c - a)^2 + (d - b)^2)` is 13 for these four coordinates and for no
 * others worth naming, so there is nothing to check at a second input. That
 * asymmetry is the same one the two congruence tasks below have, and it is why
 * each is checked on its own terms rather than by one loop over the pair.
 */
t('the point-order task is zero for any two points, not just the authored pair', (() => {
  const task = taskById('swapping-the-two-points-changes-nothing-1')
  const read = (a, b, c, d) => {
    const at = {
      a: parseExpression(a, []), b: parseExpression(b, []),
      c: parseExpression(c, []), d: parseExpression(d, []),
    }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c', 'd']), at))
    return v === null ? null : showExact(v)
  }
  return read('-2', '1', '3', '13') === '0' && read('7', '-5', '-11', '2') === '0'
})())
t('the AAA-dependence task is zero for any triangle, not just the authored one', (() => {
  const task = taskById('the-third-angle-was-never-free-1')
  const at = { a: parseExpression('20', []), b: parseExpression('35', []), c: parseExpression('125', []) }
  const value = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c']), at))
  return value !== null && showExact(value) === '0'
})())
t('the AAS-completes-to-ASA task is zero when the angles agree and non-zero when they do not', (() => {
  const task = taskById('aas-completes-to-asa-1')
  const read = (a, b, c) => {
    const at = { a: parseExpression(a, []), b: parseExpression(b, []), c: parseExpression(c, []) }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c']), at))
    return v === null ? null : showExact(v)
  }
  // 180 − 20 − 125 = 35, so the given b of 35 agrees and the difference is 0.
  // Hand it a b of 36 instead and it must not still read as a match.
  return read('20', '35', '125') === '0' && read('20', '36', '125') !== '0'
})())
/*
 * The equilateral task is the fixed point of x ↦ (180 − x)/2, and that is the
 * content rather than the arithmetic: 60 is the only apex angle equal to its
 * own base angles, which is the same statement as 3x = 180. Asserted as a
 * fixed point, and asserted to be the ONLY one, because "it returned 60" would
 * also pass if the expression had been the identity.
 */
t('sixty is the one angle the base-angle map sends to itself', (() => {
  const given = parseExpression(taskById('the-equilateral-fixed-point-1').given, ['x'])
  const at = v => showExact(exactValue(substitute(given, { x: parseExpression(v, []) })))
  return at('60') === '60' && at('28') === '76' && at('90') === '45'
})())

/*
 * The polygon tasks, checked the way the congruence ones are: away from their
 * authored inputs where the content is a claim rather than an instance, since
 * one coincidence at the values in the prompt would prove nothing about it.
 *
 * `the-exterior-total-never-moves-1` is x·180 − (x − 2)·180, which is 360 for
 * EVERY x — the two multiples of 180 differ by two whatever x is, and that
 * independence is the whole first knowledge point. So it is checked on a second
 * value with nothing in common with the first.
 *
 * `the-four-angles-are-two-angles-twice-1` is the opposite shape and must NOT
 * generalise the same way: 2a + 2b − 360 is 0 only when b really is 180 − a,
 * which is exactly the claim that the co-interior pair produced the right angle
 * at B. A mismatched pair is checked as well, because a difference that were
 * identically zero would score a learner correct for any two angles at all —
 * the same failure the AAS task is guarded against above.
 */
t('the exterior total is 360 for any number of sides, not just the authored fifteen', (() => {
  const task = taskById('the-exterior-total-never-moves-1')
  const read = v => {
    const value = exactValue(substitute(parseExpression(task.given, ['x']), { x: parseExpression(v, []) }))
    return value === null ? null : showExact(value)
  }
  // Three sides and a hundred sides give the same total, which is the claim.
  return read('15') === '360' && read('3') === '360' && read('100') === '360'
})())
t('the parallelogram total is zero on a co-interior pair and non-zero otherwise', (() => {
  const task = taskById('the-four-angles-are-two-angles-twice-1')
  const read = (a, b) => {
    const at = { a: parseExpression(a, []), b: parseExpression(b, []) }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b']), at))
    return v === null ? null : showExact(v)
  }
  // 64 and 116 add to 180, so the four angles close. 64 and 117 do not, and
  // the task has to say so rather than accept any pair.
  return read('64', '116') === '0' && read('40', '140') === '0' && read('64', '117') !== '0'
})())
/*
 * The rhombus pair, which is one expression at two inputs — and the pair is
 * the content, exactly as `isosceles-base-angles-1` and
 * `the-equilateral-fixed-point-1` are in `congruence`. There the fixed point
 * was the equilateral triangle and EVERY equal-sided triangle satisfies the
 * condition; here it is the square and exactly one equal-sided quadrilateral
 * does. So this asserts the fixed point and asserts it is the ONLY one, because
 * "it returned 0 at 90" would also pass if the expression had been constant.
 */
t('ninety is the one rhombus angle where equal sides do give equal angles', (() => {
  const given = parseExpression(taskById('the-square-is-the-only-fixed-point-1').given, ['x'])
  const at = v => showExact(exactValue(substitute(given, { x: parseExpression(v, []) })))
  return at('90') === '0' && at('64') === '52' && at('120') === '-60'
})())
t('and both rhombus tasks are the same expression, which is what makes them a pair',
  taskById('the-square-is-the-only-fixed-point-1').given
  === taskById('equal-sides-left-the-angles-unequal-1').given)

/*
 * The area tasks, checked the way the polygon and congruence ones are: away
 * from their authored inputs where the content is a claim rather than an
 * instance, since one coincidence at the values in the prompt would prove
 * nothing about it.
 *
 * `the-notch-cancels-out-of-the-corner-perimeter-1` is the boundary walk of a
 * corner cut, (a − c) + (b − d) + c + d + a + b, which is identically 2(a + b)
 * — the notch's two dimensions cancel, and that independence is the whole
 * reason a corner cut changes no perimeter. So it is checked on a second notch
 * with nothing in common with the first, exactly as
 * `the-exterior-total-never-moves-1` is checked at a second number of sides.
 *
 * `equal-perimeters-left-the-areas-unequal-1` is the opposite shape and must
 * NOT generalise: `a*b − c*d` is non-zero because these two equal-perimeter
 * rectangles have different areas, and it has to be able to come out zero, or
 * a learner would score the mark for any four numbers at all. A pair of
 * equal-area rectangles is checked for that reason.
 *
 * And the two routes to the same cut region are asserted as a pair, because
 * agreeing is the content of the first point: additivity read backwards is
 * 60 − 12 and read forwards is 36 + 12, and a measure where those differ is
 * not a measure.
 */
t('the corner-cut perimeter is the uncut perimeter for a notch of any size', (() => {
  const task = taskById('the-notch-cancels-out-of-the-corner-perimeter-1')
  const read = (a, b, c, d) => {
    const at = {
      a: parseExpression(a, []), b: parseExpression(b, []),
      c: parseExpression(c, []), d: parseExpression(d, []),
    }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c', 'd']), at))
    return v === null ? null : showExact(v)
  }
  // The authored 4 by 3 notch and a 1 by 5 notch out of the same sheet both
  // leave 32, which is 2 × (10 + 6) — the claim rather than an arithmetic
  // coincidence of these four numbers. A DIFFERENT sheet gives that sheet's
  // own perimeter and not 32, which is what stops the expression having been
  // constant: 2 × (12 + 5) = 34, whatever is cut out of its corner.
  return read('10', '6', '4', '3') === '32' && read('10', '6', '1', '5') === '32'
    && read('12', '5', '4', '3') === '34' && read('12', '5', '1', '1') === '34'
})())
t('the equal-perimeter comparison is non-zero here and can still come out zero', (() => {
  const task = taskById('equal-perimeters-left-the-areas-unequal-1')
  const read = (a, b, c, d) => {
    const at = {
      a: parseExpression(a, []), b: parseExpression(b, []),
      c: parseExpression(c, []), d: parseExpression(d, []),
    }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c', 'd']), at))
    return v === null ? null : showExact(v)
  }
  // 60 − 15 = 45 for the two rectangles of perimeter 32, so equal perimeters
  // did not make equal areas. 10 by 6 against 12 by 5 is 0, two different
  // rectangles of equal area — so the expression is not identically non-zero
  // and the task can fail.
  return read('10', '6', '15', '1') === '45' && read('10', '6', '12', '5') === '0'
})())
t('the two routes to the cut region agree, which is what additivity claims', (() => {
  const read = (task, inputs) => {
    const at = {}
    for (const [name, raw] of Object.entries(inputs)) at[name] = parseExpression(raw, [])
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c', 'd']), at))
    return v === null ? null : showExact(v)
  }
  const back = read(taskById('the-cut-is-a-subtraction-1'), { a: '10', b: '6', c: '4', d: '3' })
  const forward = read(
    taskById('additivity-forwards-gives-the-same-area-1'), { a: '6', b: '6', c: '4', d: '3' })
  return back === '48' && forward === '48'
})())
/*
 * The two matched pairs of one triangle, asserted as a pair for the reason the
 * rhombus tasks are: the same expression at two inputs, where agreeing is the
 * content. The area is a property of the triangle and not of the base chosen,
 * so 14 with 12 and 13 with 168/13 must both give 84 — and the second input is
 * deliberately not an integer, since the point is that a height usually is not
 * one. The mis-pairing is checked too: 14 with 13 gives 91, so the task is not
 * one a wrong pairing passes by accident.
 */
t('both matched pairs of the 13-14-15 triangle give the same area, and a mis-pairing does not', (() => {
  const given = parseExpression(taskById('halve-the-matched-pair-1').given, ['a', 'b'])
  const at = (a, b) => showExact(exactValue(substitute(given, {
    a: parseExpression(a, []), b: parseExpression(b, []),
  })))
  return at('14', '12') === '84' && at('13', '168/13') === '84'
    && at('15', '168/15') === '84' && at('14', '13') === '91'
})())
t('and both area tasks on that point are the same expression, which is what makes them a pair',
  taskById('halve-the-matched-pair-1').given
  === taskById('the-same-area-off-a-second-base-1').given)

/*
 * The proof tasks. Three claims here that none of the blocks above needed, and
 * each of them is a thing only a test can hold.
 *
 * FIRST, THE CHAIN IS WRITTEN IN ITS COMPOSED FORM ON PURPOSE. The given is
 * `180 - 2*(180 - x)`, which is the three citations in the order they were made,
 * and it is equal to `2x - 180`, which is the theorem the chain proves. The
 * composed form is the content — ontology-geometry.ts argues it — so a later
 * tidy-up simplifying the given would delete the point while leaving every
 * answer correct. Asserted both ways: the two forms agree at every input tried,
 * and the given is not the simplified one.
 *
 * SECOND, THE CHAIN STATES ITS OWN HYPOTHESIS. The expression returns an angle
 * of a real triangle only for an exterior angle above 90°, because at 90 it
 * returns 0 and below it goes negative — the same shape as
 * `third-angle-of-a-triangle-1`'s negative answer in the triangle block, and the
 * last subgoal leans on it. A test is the only place that can be shown, since
 * the two authored inputs are both well inside the valid range.
 *
 * THIRD, THE PERIMETER PAIR'S TWO VERDICTS ARE REALLY DIFFERENT. The whole
 * knowledge point is that 0 licenses nothing and non-zero concludes, so the
 * expression must be able to produce both — a difference that could only ever be
 * non-zero would make the converse look refuted by arithmetic rather than by a
 * counterexample, and one that were identically zero would make the
 * contrapositive unusable. Both are checked, with a third input that is zero for
 * genuinely congruent data.
 */
t('the proof chain is its composed form and agrees with the theorem it proves', (() => {
  const task = taskById('chain-the-three-cited-facts-1')
  const chain = parseExpression(task.given, ['x'])
  const theorem = parseExpression('2*x - 180', ['x'])
  const read = (expr, v) => {
    const value = exactValue(substitute(expr, { x: parseExpression(v, []) }))
    return value === null ? null : showExact(value)
  }
  // The composed form and the simplified one agree everywhere, which is what
  // makes the choice between them editorial — and the reason a test has to
  // record that the editorial choice was made deliberately.
  const agree = ['140', '110', '91', '175'].every(v => read(chain, v) === read(theorem, v))
  return agree && task.given === '180 - 2*(180 - x)' && task.given !== '2*x - 180'
    && read(chain, '140') === '100' && read(chain, '110') === '40'
})())
t('and it returns an angle only while the exterior angle exceeds ninety, which is the hypothesis', (() => {
  const chain = parseExpression(taskById('chain-the-three-cited-facts-1').given, ['x'])
  const read = v => showExact(exactValue(substitute(chain, { x: parseExpression(v, []) })))
  // At 90 the apex angle is 0 and below it is negative, so no such triangle
  // exists — the chain refusing its own input rather than returning nonsense,
  // the shape `third-angle-of-a-triangle-1` already has.
  return read('90') === '0' && read('80') === '-20' && read('91') === '2'
})())
t('and both chain tasks are the same expression, which is what makes them a pair',
  taskById('chain-the-three-cited-facts-1').given
  === taskById('the-same-chain-from-a-second-exterior-angle-1').given)
t('the perimeter difference can be zero or not, which is what separates the two verdicts', (() => {
  const given = parseExpression(
    taskById('the-equal-total-settles-nothing-1').given, ['a', 'b', 'c', 'd', 'e', 'f'])
  const read = (...sides) => {
    const at = {}
    for (const [i, name] of ['a', 'b', 'c', 'd', 'e', 'f'].entries()) {
      at[name] = parseExpression(sides[i], [])
    }
    const v = exactValue(substitute(given, at))
    return v === null ? null : showExact(v)
  }
  // 24 − 24 = 0 for the non-congruent pair, which is the converse's hypothesis
  // holding and concluding nothing. 24 − 25 = −1 for the second pair, which is
  // the contrapositive concluding. And 0 again for identical side triples,
  // where the ORIGINAL implication is what makes it zero — three inputs, three
  // different relationships between the same two numbers.
  return read('5', '9', '10', '6', '8', '10') === '0'
    && read('6', '8', '10', '6', '8', '11') === '-1'
    && read('6', '8', '10', '6', '8', '10') === '0'
})())
t('and both perimeter tasks are the same expression, which is what makes them a pair',
  taskById('the-equal-total-settles-nothing-1').given
  === taskById('the-unequal-total-settles-it-1').given)
/*
 * The hypothesis check, against the task it echoes. `(a + b + c) - 180` is
 * `the-third-angle-was-never-free-1`'s expression, which is identically 0 for
 * any real triangle's angles — and that is exactly why a non-zero answer means
 * the object offered is not a triangle. Both readings of the one expression are
 * asserted here, because the echo IS the content and a reader meeting the
 * second task has every right to ask what is new about it.
 */
t('the disqualifying angle sum is the congruence task\'s expression reading the other way', (() => {
  const task = taskById('a-candidate-that-is-not-a-triangle-refutes-nothing-1')
  const given = parseExpression(task.given, ['a', 'b', 'c'])
  const read = (a, b, c) => showExact(exactValue(substitute(given, {
    a: parseExpression(a, []), b: parseExpression(b, []), c: parseExpression(c, []),
  })))
  return task.given === taskById('the-third-angle-was-never-free-1').given
    && read('100', '50', '40') === '10' && read('100', '40', '40') === '0'
    && read('73', '44', '63') === '0'
})())
t('and the counterexample it accepts really is acute at the vertex the prompt names', (() => {
  const given = parseExpression(taskById('one-acute-exterior-angle-ends-the-claim-1').given, ['x'])
  const read = v => showExact(exactValue(substitute(given, { x: parseExpression(v, []) })))
  // 80 at the 100° vertex refutes "every exterior angle is obtuse"; 140 at each
  // of the 40° vertices is a confirming instance and establishes nothing. The
  // claim's repaired form holds because at most one angle can be 90° or more.
  return read('100') === '80' && read('40') === '140' && read('90') === '90'
})())
/*
 * And the claim the whole promotion turned on: three more chains, none of them
 * unrulable. `chainsWithNoRuling` counts knowledge points with no task at all,
 * and a concept whose natural kind is `justify` would have contributed three —
 * which is the objection this concept was twice deferred on. Asserted against
 * this subject specifically as well as against the total, so that a later
 * unrulable point somewhere else cannot mask a regression here.
 */
t('the proof concept added three rulable chains and no unrulable ones',
  questionCoverage(PG).chainsWithNoRuling === 0
  && PG.concepts.find(c => c.id === 'geometric-proof').knowledgePoints
    .every(p => tasksForPoint(p.id).length === 2
      && tasksForPoint(p.id).every(x => isVerifiableKind(x.kind))),
  PG.concepts.find(c => c.id === 'geometric-proof').knowledgePoints
    .map(p => `${p.id}:${tasksForPoint(p.id).map(x => x.kind).join('+')}`).join(' '))

const PG_QUESTIONS = allQuestions(PG)
t('a hundred and thirty-four questions, one per subgoal',
  PG_QUESTIONS.length === 134, `${PG_QUESTIONS.length}`)
t('every subgoal carries an authored socratic phrasing',
  allKnowledgePoints(PG).every(p => p.workedExample.subgoals.every(s => !!s.socratic)),
  allKnowledgePoints(PG).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
t('and every one of them is interrogative, so all of them count as written',
  PG_QUESTIONS.every(q => q.authoredAsQuestion)
  && questionCoverage(PG).authoredAsQuestions === questionCoverage(PG).questions)
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  allKnowledgePoints(PG).flatMap(p => p.workedExample.subgoals)
    .every(s => !isInterrogative(s.label)),
  allKnowledgePoints(PG).flatMap(p => p.workedExample.subgoals)
    .filter(s => isInterrogative(s.label)).map(s => s.label).join(' | '))
/*
 * The judgement types.ts asks for on `automaticityTarget`, asserted because it
 * is the field most likely to be filled in uniformly by whoever writes the
 * next concept — and the next concept was written, so this is no longer a
 * precaution. Taking a known total apart is a fluency skill; the two angle
 * arguments are not, and timing them would measure typing.
 *
 * None of the three triangle points is timed either, and the reason is sharper
 * than "they are arguments". The triangle's angle sum is the SAME subtraction
 * from the same 180 that the timed point already measures, so a target on it
 * would report one skill as two and double its weight in the schedule.
 *
 * The three congruence points are untimed for a third reason, and it is the
 * one that most needed an assertion: the error its first point exists to
 * prevent is reading a letter order too fast, so a timing target there would
 * reward the mistake rather than merely measure the wrong thing.
 *
 * The three Pythagoras points then hit all three of those reasons, one each,
 * which is why this assertion is worth keeping rather than retiring. Its first
 * point is the read-it-slowly case exactly — the error is assigning the
 * hypotenuse's slot too fast. Its second would time `pull-the-square-out` in
 * `roots-and-irrationals`, which is untimed there, so a target here would
 * measure another subject's skill. Its third is a decision with an argument
 * behind it. Five concepts in, the file still has one target.
 *
 * The three polygon points hit the same three reasons a third time, so this is
 * now fifteen untimed points out of eighteen with one reason each rather than a
 * convention. Its first point's arithmetic is the straight-line subtraction the
 * timed point already measures, plus a division — reporting one skill as two.
 * Its second is the read-it-slowly case, since the error it exists to stop is
 * matching ABC with ACD. Its third is a decision with an argument behind it.
 *
 * The three proof points are the clearest case in the file and the reason is
 * worth one line: a concept whose subject is which fact licenses which step
 * would, if timed, reward reaching for the arithmetic before the citation —
 * which is the error all three points exist to stop. Twenty-three untimed
 * points out of twenty-four at that promotion, and still one target.
 *
 * The three circle points then hit the three reasons once more, and the three
 * circular-measure points are where the temptation was strongest and the answer
 * is sharpest. All three of those have the fastest arithmetic in the subject —
 * a doubling, one division into a fraction, and squaring a 3 — and in all three
 * the arithmetic is not the content. The first is the read-it-slowly case: the
 * error is multiplying the printed number rather than the diameter. The second
 * is a decision about which WHOLE to take a share of, which no stopwatch
 * touches. The third is the one that would actively reward the mistake, because
 * answering k instead of k² is what a learner who computed fast and once
 * answers. Twenty-nine untimed points out of thirty, and still one target.
 */
t('only the point about fluency is timed, and no later concept added a second',
  allKnowledgePoints(PG).filter(p => p.automaticityTarget !== undefined)
    .map(p => p.id).join(',') === 'two-sums-every-angle-chase-uses',
  allKnowledgePoints(PG).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(','))
/*
 * No `visualRef` anywhere, and it is the honest absence rather than an
 * oversight — see the header: this build has no figures, which is also why the
 * rest of the area's nodes stayed mapped. A placeholder here would be the
 * one thing the field exists to prevent.
 *
 * Circular measure is the sharpest test of that claim in the subject, and it
 * passes by having been SPLIT rather than by being figure-free. The map node's
 * `is` line named two things: π as a ratio that does not depend on the circle,
 * and the area as a limit of inscribed polygons. The first is written here and
 * needs no picture — it is a claim about a quotient surviving a scaling. The
 * second is a sequence of drawings with more and more sides, so πr² is used in
 * the material and never derived there, exactly as the congruence criteria and
 * the inscribed-angle theorem are. A `visualRef` on any of these three points
 * would be pointing at the figure that was deliberately not taken.
 *
 * It is a stronger statement with the triangles in than it was without them.
 * The angle facts could be argued not to need a figure; a triangle plainly
 * suggests one, and the three points were chosen so that none of them does —
 * the angle sum is a total, the inequality is two routes compared as numbers,
 * and the classification is arithmetic ruling a pair out.
 *
 * Congruence is the strongest case of the three and the reason the assertion
 * is worth keeping. It is the node this area's comment once named as
 * unwriteable FOR WANT OF A FIGURE, so material for it that still claims no
 * `visualRef` is the whole argument of that promotion reduced to one check:
 * what got written is the correspondence, the counting and a triangle matched
 * with itself, and the parts that genuinely need two triangles drawn — the
 * proofs of the criteria, and SSA — stayed on the map.
 *
 * The polygons are the first concept here where the figure test took only PART
 * of a node, which makes this assertion stronger again and in a different way.
 * A quadrilateral with a diagonal drawn across it is the most figure-suggestive
 * object in the subject, and the three points were chosen so that none of them
 * needs the drawing: two angle totals, a diagonal used to CUT rather than to
 * measure along, and a disagreement between two words. What genuinely needs the
 * figure — the diagonals bisecting, a rhombus's being perpendicular, the kite
 * and the trapezium — stayed mapped and is named as absent in the header.
 *
 * Deductive proof is the one concept here where this assertion says the LEAST,
 * and that is worth recording rather than letting the pattern above imply
 * otherwise. Every promotion before it had to find the figure-free part of a
 * node that plainly suggests a drawing; this node suggests none, because a
 * proof whose steps are angle facts is a chain of sentences. The figure debt it
 * leaves is real — every proof whose steps are about a drawing stayed behind —
 * but it was never what was holding the node, and this file's two deferrals of
 * it were about the grader instead. See the header there.
 */
t('no knowledge point claims a figure, because there are none to claim',
  allKnowledgePoints(PG).every(p => p.visualRef === undefined))

// ---------------------------------------------------------------------------
// The ninth subject: the side ratios of a right triangle
// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-trigonometry.ts's HEADER, for the reason
 * the three blocks above do it: each is the kind of statement that otherwise
 * rots into a comment that used to be true.
 *
 * `right-triangle-trig` was promoted out of the `trigonometry` map area because
 * it was the only remaining promotion on either unfinished journey that
 * unblocks anything — it is the sole blocker of `dot-product-geometry`, which
 * with `solid-geometry` is the sole blocker of `three-dimensional-coordinates`.
 * The journey half of that is checked in tests/journeys.mjs, which is the
 * harness that resolves routes, and the structural half in tests/atlas.mjs.
 * What is checkable here is that the material is real, that the subject rules
 * with no worker, and that the two constraints the file says shaped it — no
 * task asks for an angle, and no figure states whole-number sides alongside
 * whole-number angles — are what it says.
 */
const TT = getOntology('triangle-trigonometry')

group('triangle-trigonometry, the ratios of a right triangle')
t('it is registered, and FOURTH — directly behind the geometry it rests on',
  ONTOLOGIES[3] === TT && TT?.subject.id === 'triangle-trigonometry')
t('and it displaced none of the three positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry'))
t('it has no internal faults', ontologyProblems(TT).length === 0, ontologyProblems(TT).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(TT).length === 0)
t('one concept, three knowledge points',
  TT.concepts.length === 1 && allKnowledgePoints(TT).length === 3,
  `${TT.concepts.length} concepts, ${allKnowledgePoints(TT).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(TT, 'right-triangle-trig') && isPractisable(TT, 'right-triangle-trig'))
t('its points number from 1, which is per concept and not per subject',
  TT.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  TT.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(TT).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(TT).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * Every objective names a kind, AND every kind it names ships a task in this
 * subject — which is the stronger half and the one types.ts is arguing for
 * when it says an objective naming no kind can never be satisfied. Naming a
 * kind that ships nothing here has the same effect one level down: the
 * objective looks evidenced and no observation can reach it.
 */
const TT_KINDS = new Set(allKnowledgePoints(TT).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  TT.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => TT_KINDS.has(k)))),
  TT.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...TT_KINDS].join('+')}`)
/*
 * THE EMPTY EDGE LIST IS A BOUNDARY, NOT AN OMISSION — the same claim
 * `expressions-and-equations` makes, reached by the other of the two routes
 * into `links`.
 *
 * There the single concept's prerequisites were unwritten map nodes. Here both
 * of them, `similarity` and `pythagoras`, are fully AUTHORED concepts — they
 * simply belong to `plane-geometry`, and an ontology's edges may only name
 * concepts it CONTAINS. So being authored in another subject fails the
 * containment test exactly as being unwritten does, and an edge added here
 * naming `pythagoras` would look right and would make `ontologyProblems`
 * report an unknown endpoint.
 */
t('it declares no edges, and the single concept is therefore its own root',
  TT.edges.length === 0 && roots(TT).length === 1 && roots(TT)[0] === 'right-triangle-trig')
t('and its two real prerequisites are authored concepts of another subject, hence links',
  ['similarity', 'pythagoras'].every(id =>
    isTeachable(PG, id) && !TT.concepts.some(c => c.id === id)),
  ['similarity', 'pythagoras'].map(id => `${id}:${isTeachable(PG, id)}`).join(' '))
t('no knowledge point claims a figure, because there are none to claim',
  allKnowledgePoints(TT).every(p => p.visualRef === undefined))

group('the ninth subject is gradable with no worker')
const TT_TASKS = allKnowledgePoints(TT).flatMap(p => tasksForPoint(p.id))
t('six tasks, two on each of the three points', TT_TASKS.length === 6
  && allKnowledgePoints(TT).every(p => tasksForPoint(p.id).length === 2),
  `${TT_TASKS.length}`)
const TT_EVAL = TT_TASKS.filter(x => x.kind === 'evaluate')
const TT_FORM = TT_TASKS.filter(x => x.kind === 'transform_to_form')
t('five evaluate and one transform_to_form, the surd an equilateral triangle produced',
  TT_EVAL.length === 5 && TT_FORM.length === 1
  && TT_EVAL.every(x => x.form === undefined)
  && TT_FORM[0].id === 'the-derived-quotient-at-thirty-degrees-1'
  && TT_FORM[0].form === 'surd_reduced',
  TT_TASKS.map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  TT_EVAL.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  TT_EVAL.map(x => x.id).join(', '))
const ttRulings = await Promise.all(TT_EVAL.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  ttRulings.every(r => r.verdict.ruling === 'correct'),
  ttRulings.map((r, i) => `${TT_EVAL[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * The surd separately, and both directions, for the reason the eighth
 * subject's block gives: accepting 5√3 is the easy half, and REFUSING √75 is
 * the half that matters, since a checker comparing only values would mark the
 * given correct against itself.
 *
 * A third radicand distinct from both of `plane-geometry`'s — 180 gave 6√5 and
 * 192 gave 8√3 — so this is not a recall of either, and the square that comes
 * out is 25 rather than 36 or 64.
 */
const ttSurd = await ruleTransform(TT_FORM[0], '5*sqrt(3)', NO_WORKER)
t('the surd task rules correct with no worker, by exact comparison rather than a CAS',
  ttSurd.verdict.ruling === 'correct' && /no worker was needed/.test(ttSurd.verdict.method),
  ttSurd.verdict.method)
const ttSurdUnreduced = await ruleTransform(TT_FORM[0], 'sqrt(75)', NO_WORKER)
t('and refuses the given back unreduced, naming the square that can still come out',
  ttSurdUnreduced.verdict.ruling === 'incorrect'
  && /25/.test(ttSurdUnreduced.verdict.brokeAt?.detail ?? ''),
  ttSurdUnreduced.verdict.brokeAt?.detail ?? '')
/*
 * THE TWO CONSTRAINTS THE HEADER SAYS SHAPED THE SUBJECT, ASSERTED.
 *
 * No task asks for an angle. The inverse direction is `inverse-trig`, four
 * nodes up behind the unit circle, and the only answer available here is a
 * rounded figure off a table — a measurement of the angle rather than the
 * angle, the same refusal `circle-measure` makes when it asks for the multiple
 * of π instead of 43.98. A task sneaking in an angle would need `exactValue`
 * to settle an arcsine, which it cannot, so the no-worker contract above would
 * break too — but it would break as a RULING failure and would not say why,
 * which is what this names.
 *
 * And exactly one task states a degree measure, which is the sides-and-angles
 * constraint holding. A right triangle cannot have three whole-number sides
 * AND whole-number acute angles; the figure does not exist and nothing in this
 * build would catch it. So the five tasks that describe a triangle by whole
 * sides state no angle, and the one that names 30° and 60° is the one whose
 * answer is irrational — which is why the test reads the KIND rather than the
 * id: an `evaluate` task naming a degree would be the fault, because its
 * answer would have to be rational.
 */
t('no task asks for an angle, which is the subject\'s boundary and not the grader\'s',
  TT_TASKS.every(x => !/\b(what angle|which angle|find the angle|arcsin|arccos|arctan)\b/i
    .test(x.prompt)),
  TT_TASKS.filter(x => /angle\?/.test(x.prompt)).map(x => x.id).join(', '))
t('and exactly one task names a degree measure, the one whose answer is irrational',
  TT_TASKS.filter(x => /°/.test(x.prompt)).length === 1
  && TT_TASKS.filter(x => /°/.test(x.prompt))[0].kind === 'transform_to_form',
  TT_TASKS.filter(x => /°/.test(x.prompt)).map(x => `${x.id}:${x.kind}`).join(', '))

// ---------------------------------------------------------------------------
// The tenth subject: the measure of a solid
// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-solids.ts's HEADER, for the reason the
 * four blocks above do it: each is the kind of statement that otherwise rots
 * into a comment that used to be true.
 *
 * `solid-geometry` was promoted out of the `euclidean-geometry` map area
 * because it was the only remaining promotion on either unfinished journey
 * that unblocks anything — it was the last half of `three-dimensional-
 * coordinates`'s gate. The journey half of that is checked in
 * tests/journeys.mjs and the structural half in tests/atlas.mjs, including the
 * subject-id collision the naming of this one had to avoid. What is checkable
 * here is that the material is real, that the subject rules with no worker, and
 * that the two things its header says shaped it hold: every objective names
 * only kinds that really ship, and no task or example states an angle.
 */
const SM = getOntology('solid-measure')

group('solid-measure, the measure of a solid')
t('it is registered, and FIFTH — behind the plane geometry it rests on',
  ONTOLOGIES[4] === SM && SM?.subject.id === 'solid-measure')
t('and it displaced none of the four positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry'))
t('it has no internal faults', ontologyProblems(SM).length === 0, ontologyProblems(SM).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(SM).length === 0)
t('one concept, three knowledge points',
  SM.concepts.length === 1 && allKnowledgePoints(SM).length === 3,
  `${SM.concepts.length} concepts, ${allKnowledgePoints(SM).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(SM, 'solid-geometry') && isPractisable(SM, 'solid-geometry'))
t('its points number from 1, which is per concept and not per subject',
  SM.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  SM.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(SM).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(SM).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * EVERY OBJECTIVE NAMES ONLY KINDS THAT SHIP, AND THIS SUBJECT IS THE FIRST TO
 * TREAT THAT AS A RULE RATHER THAN AN ACCIDENT.
 *
 * The ninth subject asserted it and passed; this one had to DECIDE it, which is
 * the difference worth recording. Twenty-eight of `plane-geometry`'s objectives
 * name `justify`, and no `justify` task exists anywhere in this build — so
 * those objectives name an observation that cannot be made. That is types.ts's
 * argument about an objective naming no kind, one level down: naming a kind
 * nothing ships leaves the objective looking evidenced while nothing can reach
 * it.
 *
 * The cube dissection is the best `justify` question in the new file and is
 * deliberately NOT an objective. It is the third subgoal of the second point,
 * where the tutor asks it and nothing pretends to rule it — which is the honest
 * place for an unrulable question and is what the socratic field is for.
 */
const SM_KINDS = new Set(allKnowledgePoints(SM).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  SM.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => SM_KINDS.has(k)))),
  SM.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...SM_KINDS].join('+')}`)
t('and no objective here names justify, which 28 of plane-geometry\'s do while no task of that kind exists',
  SM.concepts.every(c => c.objectives.every(o => !o.taskKinds.includes('justify')))
  && PG.concepts.some(c => c.objectives.some(o => o.taskKinds.includes('justify')))
  && !TASKS.some(x => x.kind === 'justify'),
  `${TASKS.filter(x => x.kind === 'justify').length} justify tasks in the build`)
/*
 * THE EMPTY EDGE LIST IS A BOUNDARY, NOT AN OMISSION — the third subject to
 * make that claim, and the first to reach it with a single `needs`.
 *
 * `expressions-and-equations` got there because its concept's prerequisites were
 * unwritten map nodes; `triangle-trigonometry` because both of its concept's
 * prerequisites were authored in another subject. Here there is exactly ONE
 * prerequisite and it is authored in another subject, so the whole of the
 * node's stranded edges went to `EUCLIDEAN_GEOMETRY.links`. An edge added here
 * naming `circle-measure` would look right and would make `ontologyProblems`
 * report an unknown endpoint.
 */
t('it declares no edges, and the single concept is therefore its own root',
  SM.edges.length === 0 && roots(SM).length === 1 && roots(SM)[0] === 'solid-geometry')
t('and its one real prerequisite is an authored concept of another subject, hence a link',
  isTeachable(PG, 'circle-measure') && !SM.concepts.some(c => c.id === 'circle-measure'),
  `circle-measure:${isTeachable(PG, 'circle-measure')}`)
t('no knowledge point claims a figure, because there are none to claim',
  allKnowledgePoints(SM).every(p => p.visualRef === undefined))
/*
 * No `automaticityTarget` anywhere in the subject, which is a judgement rather
 * than an omission and is asserted because the arithmetic here would time
 * beautifully. Every one of the three points reduces to one or two
 * multiplications, and every one of them is ABOUT a choice the multiplication
 * does not record: which plane measure the question wants, whether the third
 * applies, which exponent the measure carries. A speed reward would train the
 * reflex each point exists to correct — which is the case types.ts names when
 * it says the field should usually be absent.
 */
t('and no point claims a speed target, since each one is about a choice rather than an arithmetic',
  allKnowledgePoints(SM).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(SM).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))

group('the tenth subject is gradable with no worker')
const SM_TASKS = allKnowledgePoints(SM).flatMap(p => tasksForPoint(p.id))
t('seven tasks: two on the first point, three on the second, two on the third',
  SM_TASKS.length === 7
  && allKnowledgePoints(SM).map(p => tasksForPoint(p.id).length).join(',') === '2,3,2',
  allKnowledgePoints(SM).map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
const SM_EVAL = SM_TASKS.filter(x => x.kind === 'evaluate')
const SM_FORM = SM_TASKS.filter(x => x.kind === 'transform_to_form')
t('six evaluate and one transform_to_form, the surd a cone\'s slant height produced',
  SM_EVAL.length === 6 && SM_FORM.length === 1
  && SM_EVAL.every(x => x.form === undefined)
  && SM_FORM[0].id === 'the-slant-height-is-the-length-the-surface-needs-1'
  && SM_FORM[0].form === 'surd_reduced',
  SM_TASKS.map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
/*
 * The middle point gets three tasks and the other two get two, which is a
 * departure from the two-per-point habit and is the content rather than an
 * accident. That point makes two claims — the third applies to the volume, and
 * it does NOT apply to the surface — and the second needs the slant height
 * before it can be stated at all. So the three are the claim, and asserting the
 * SHAPE rather than a total is what records that: a ratio over a total would be
 * satisfied by seven tasks distributed any way at all.
 */
t('and the three on the middle point are the volume, the slant and the surface, in that order',
  tasksForPoint('the-tapering-solid-takes-a-third-of-the-volume-and-none-of-the-surface')
    .map(x => x.kind).join(' ') === 'evaluate transform_to_form evaluate',
  tasksForPoint('the-tapering-solid-takes-a-third-of-the-volume-and-none-of-the-surface')
    .map(x => x.id).join(' '))
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  SM_EVAL.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  SM_EVAL.map(x => x.id).join(', '))
const smRulings = await Promise.all(SM_EVAL.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  smRulings.every(r => r.verdict.ruling === 'correct'),
  smRulings.map((r, i) => `${SM_EVAL[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * The surd separately, and both directions, for the reason the eighth and ninth
 * subjects give: accepting 2√13 is the easy half, and REFUSING √52 is the half
 * that matters, since a checker comparing only values would mark the given
 * correct against itself.
 *
 * A radicand distinct from all three already in the build — 180 gave 6√5, 192
 * gave 8√3 and 75 gave 5√3 — so this is a recall of none of them, and the
 * square that comes out is 4 rather than 25, 36 or 64.
 */
const smSurd = await ruleTransform(SM_FORM[0], '2*sqrt(13)', NO_WORKER)
t('the surd task rules correct with no worker, by exact comparison rather than a CAS',
  smSurd.verdict.ruling === 'correct' && /no worker was needed/.test(smSurd.verdict.method),
  smSurd.verdict.method)
const smSurdUnreduced = await ruleTransform(SM_FORM[0], 'sqrt(52)', NO_WORKER)
t('and refuses the given back unreduced, naming the square that can still come out',
  smSurdUnreduced.verdict.ruling === 'incorrect'
  && /divisible by the square 4/.test(smSurdUnreduced.verdict.brokeAt?.detail ?? ''),
  smSurdUnreduced.verdict.brokeAt?.detail ?? '')
/*
 * THE π WALL, ASSERTED AS THE SHAPE OF THE PROMPTS RATHER THAN AS AN ABSENCE.
 *
 * `exactValue` returns null on `pi`, deliberately, so a reference of `539*pi`
 * cannot be ruled locally and would fall to the worker — which is what the
 * no-worker assertion above would catch, but it would catch it as a RULING
 * failure and would not say why. `circle-measure` settled the answer and this
 * subject inherits it: the task that reaches a circular solid asks for the
 * MULTIPLE of π and says so in the prompt, so the learner is never guessing
 * whether the π is theirs to supply.
 *
 * Both halves are needed. The negative alone would be satisfied by a subject
 * that simply never mentioned π, which would be a different and worse file —
 * the sphere is one of the three solids the measure cannot avoid.
 */
t('no reference anywhere in the subject contains pi, which is what keeps every ruling local',
  SM_TASKS.every(x => !/\bpi\b/i.test(x.reference)),
  SM_TASKS.filter(x => /\bpi\b/i.test(x.reference)).map(x => x.id).join(', '))
t('and the task that reaches a sphere asks for the multiple of π and says so to the learner',
  /multiple of π/.test(taskById('the-sphere-s-volume-is-a-third-of-its-surface-times-the-radius-1').prompt)
  && taskById('the-sphere-s-volume-is-a-third-of-its-surface-times-the-radius-1')
    .reference === '288',
  taskById('the-sphere-s-volume-is-a-third-of-its-surface-times-the-radius-1').reference)
/*
 * THE SIDES-AND-ANGLES CONSTRAINT, WHICH IS CHEAP HERE AND IS ASSERTED ANYWAY.
 *
 * A right triangle cannot have three whole-number sides AND whole-number acute
 * angles; the figure does not exist and nothing in this build would catch it.
 * The ninth subject had to work for this — one of its triangles is 5, 5√3, 10
 * precisely so that an angle could be named — and this subject only had to not
 * break it, because a solid's measure never needs an angle at all. So no prompt
 * and no worked example here states a degree measure, and the three figures are
 * described by their lengths: the 8-15-17 cross-section, the 9-12-15 slant and
 * the 4-6 cone.
 */
t('no task states a degree measure, because a solid\'s measure never needs an angle',
  SM_TASKS.every(x => !/°/.test(x.prompt)),
  SM_TASKS.filter(x => /°/.test(x.prompt)).map(x => x.id).join(', '))
t('and no worked example or statement does either',
  allKnowledgePoints(SM).every(p =>
    !/°/.test(p.statement)
    && !/°/.test(p.workedExample.problem)
    && !/°/.test(p.workedExample.answer)
    && p.workedExample.subgoals.every(s => !/°/.test(s.detail) && !/°/.test(s.socratic ?? ''))),
  allKnowledgePoints(SM).filter(p => /°/.test(JSON.stringify(p))).map(p => p.id).join(', '))
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, which is the single most
 * valuable property of new material here and the one that silently fails when
 * somebody writes labels and leaves the questions for later.
 *
 * Fourteen arrived and fourteen are authored, so the build's authored fraction
 * moved in the right direction rather than being diluted. Asserted as "all of
 * them" rather than against a global figure, because a global figure has to be
 * edited by whoever adds the next concept and an assertion somebody has to edit
 * is one somebody will edit wrongly.
 */
t('all fourteen of its subgoals ship the question written, not just the label',
  allKnowledgePoints(SM).flatMap(p => p.workedExample.subgoals).length === 14
  && allKnowledgePoints(SM).flatMap(p => p.workedExample.subgoals)
    .every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  allKnowledgePoints(SM).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
/*
 * And the rule types.ts states about the phrasing: a question must not contain
 * its own answer. "Should you add the places separately?" is the failure mode
 * it names — an imperative with a question mark. Checked mechanically as far as
 * that can be done: every question ends in a question mark and none of them
 * opens with the modal-imperative shape that turns an instruction into a
 * rhetorical question.
 */
t('and none of them is an imperative wearing a question mark',
  allKnowledgePoints(SM).flatMap(p => p.workedExample.subgoals).every(s =>
    s.socratic.trim().endsWith('?')
    && !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  allKnowledgePoints(SM).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic.trim().endsWith('?')
      || /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
/*
 * Every subgoal labelled with the MOVE it makes, which types.ts argues is the
 * difference between a worked example and a solution. Checked as a property
 * that cannot be satisfied by a numbered step — no label here is a bare
 * "Step 1" or a restatement of the arithmetic — by requiring each to be a verb
 * phrase of some length and all of them to be distinct within their example.
 */
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  allKnowledgePoints(SM).every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  allKnowledgePoints(SM).flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * The dot product, promoted into an EXISTING subject — which is the first thing
 * about it worth asserting.
 *
 * The three promotions before this one each created a subject, because every
 * existing `covers` declared a boundary the concept fell outside. Here exactly
 * one did — `vectors-and-independence` said "nothing about the dot product or
 * angles, which need trigonometry this build cannot rule" — and the reason that
 * sentence gave had expired: `right-triangle-trig` is authored now, and the
 * identity never asked anybody to EVALUATE a cosine, only to produce one. So
 * the right move was to rewrite the boundary rather than to file a vector
 * operation in a tenth ontology to avoid contradicting a sentence.
 *
 * What that costs is checkable and is checked below: a fifth concept in a
 * four-concept file has to leave `ontologyProblems` clean, keep the subject
 * acyclic, and not disturb the registry index anything reads positionally.
 *
 * The group is placed here rather than beside the subject's own because the
 * subject does not HAVE one — it was authored before this file started writing
 * a group per subject, and backfilling one for four concepts is a different
 * change from this promotion. What is asserted is the promotion.
 */
const VI = getOntology('vectors-and-independence')

group('the dot product, promoted into the vectors subject')
t('it is a concept of that subject and the subject is registered where it was',
  VI?.subject.id === 'vectors-and-independence'
  && VI.concepts.some(c => c.id === 'dot-product-geometry'),
  VI?.concepts.map(c => c.id).join(', '))
t('and it displaced none of the four positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry'))
t('the subject has no internal faults with six concepts in it',
  ontologyProblems(VI).length === 0, ontologyProblems(VI).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(VI).length === 0)
t('six concepts, and the dot product still carries the three it arrived with',
  VI.concepts.length === 6
  && conceptById(VI, 'dot-product-geometry').knowledgePoints.length === 3,
  `${VI.concepts.length} concepts, `
  + `${conceptById(VI, 'dot-product-geometry').knowledgePoints.length} points on the new one`)
t('the concept is teachable AND practisable — a syllabus entry, not a map one',
  isTeachable(VI, 'dot-product-geometry') && isPractisable(VI, 'dot-product-geometry'))
t('its points number from 1, which is per concept and not per subject',
  conceptById(VI, 'dot-product-geometry').knowledgePoints
    .map(p => p.position).join(',') === '1,2,3',
  conceptById(VI, 'dot-product-geometry').knowledgePoints.map(p => p.position).join(','))
t('no knowledge point claims a figure, because there are none to claim',
  conceptById(VI, 'dot-product-geometry').knowledgePoints
    .every(p => p.visualRef === undefined))
/*
 * THE SUBJECT IS A FORK NOW AND ITS ROOT HAS NOT MOVED, which are two separate
 * claims and both are worth having.
 *
 * The fork: the new concept rests on `plane-vectors` and nothing else here, so
 * the subject branches at its second concept. Asserted as the branch POINT
 * rather than as an ordered walk, because an ordered string would accept the
 * concept hung off `linear-independence` instead — a mistake somebody will make,
 * the cross-check and the dot product being the same four numbers combined two
 * ways, and one that would gate the product behind material it never uses.
 *
 * The root: `cartesian-plane` is still the single root, so nothing about the
 * promotion gave the subject a second place to start. A subject with two roots
 * is not wrong, but this one arriving at one silently would mean the new
 * concept's prerequisite had been dropped rather than written.
 */
/*
 * THE SECOND HALF OF THIS CHANGED AT THE THIRTEENTH PROMOTION, and the reason
 * it is split rather than rewritten as one string is the reason given above:
 * the dot product's parent is the mistake worth guarding and it has not moved.
 *
 * `vectors-and-spans` has gained a second parent. `three-dimensional-
 * coordinates` is a concept of this subject now and the span rests on it — an
 * edge that came home from `linear-algebra.links`, where it had been filed
 * because that area owned neither end. So the two branches out of
 * `plane-vectors` rejoin and the subject is a diamond; compared against a
 * sorted SET, never an ordered string, since `prerequisitesOf` returns edge
 * order.
 */
t('the product still forks off plane-vectors, and span now rests on the product\'s branch too',
  prerequisitesOf(VI, 'dot-product-geometry').join(' ') === 'plane-vectors'
  && prerequisitesOf(VI, 'vectors-and-spans').slice().sort().join(' ')
    === 'plane-vectors three-dimensional-coordinates'
  && !allPrerequisitesOf(VI, 'dot-product-geometry').includes('linear-independence'),
  `${prerequisitesOf(VI, 'dot-product-geometry').join(', ')}`
  + ` | ${prerequisitesOf(VI, 'vectors-and-spans').join(', ')}`)
t('and the subject still has one root and still has a teaching order',
  roots(VI).length === 1 && roots(VI)[0] === 'cartesian-plane'
  && teachingOrder(VI) !== null,
  roots(VI).join(', '))
/*
 * The `encompasses` edge, which this file refused once in this very subject —
 * `plane-vectors` down to `cartesian-plane`, on the ground that the vector
 * tasks never locate a point or decide a quadrant. The claim is about what
 * PRACTISING exercises, so it is asserted against the TASKS rather than against
 * the prose: both cosine tasks compute two magnitudes as a sum of squares under
 * a one-half power, which is `magnitude-1` verbatim.
 */
t('it claims credit back down to the magnitude, and the tasks bear the claim out',
  edgesOfKind(VI, 'encompasses')
    .some(e => e.from === 'dot-product-geometry' && e.to === 'plane-vectors' && !!e.rationale)
  && ['cosine-exact-1', 'cosine-aligned-1'].every(id =>
    /\^\(1\/2\)/.test(taskById(id).given)),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))

group('the eleventh promotion is gradable with no worker')
const DP_POINTS = conceptById(VI, 'dot-product-geometry').knowledgePoints
const DP_TASKS = DP_POINTS.flatMap(p => tasksForPoint(p.id))
t('six tasks, two on each of the three points', DP_TASKS.length === 6
  && DP_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${DP_TASKS.length}`)
t('all six are evaluate, so none of them claims a form',
  DP_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  DP_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  DP_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  DP_TASKS.map(x => x.id).join(', '))
const dpRulings = await Promise.all(DP_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  dpRulings.every(r => r.verdict.ruling === 'correct'),
  dpRulings.map((r, i) => `${DP_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * WHY THE COMPONENTS HAD TO BE CHOSEN, which is the constraint that shaped the
 * file and is invisible in the finished tasks.
 *
 * `cos θ = (a·b)/(|a||b|)` divides by two square roots, so the quotient is
 * rational only when both magnitudes come out whole. (3, 4) against (4, 3)
 * gives 5 and 5, and (3, 4) against (6, 8) gives 5 and 10 — hence 24/25 and
 * exactly 1. The obtuse pair (3, 4) and (−4, 1) has |v| = √17 and an irrational
 * cosine, which is why that task asks for the PRODUCT and reads its sign: the
 * sign is exact where the cosine is not, and the knowledge point says so.
 *
 * Asserted as "the two cosine tasks are the ones that take a root", because the
 * failure to catch is a THIRD cosine task added on components whose magnitudes
 * are not whole. That would rule inconclusive rather than wrong, so the suite
 * would report it as a worker-only task somewhere else entirely.
 */
t('exactly the two cosine tasks take a square root, and both still rule locally',
  DP_TASKS.filter(x => /\^\(1\/2\)/.test(x.given)).map(x => x.id).join(' ')
    === 'cosine-exact-1 cosine-aligned-1',
  DP_TASKS.filter(x => /\^\(1\/2\)/.test(x.given)).map(x => x.id).join(' '))
t('and the exact cosine really is the quotient, not a rounding of it',
  taskById('cosine-exact-1').reference === '24/25'
  && taskById('cosine-aligned-1').reference === '1',
  `${taskById('cosine-exact-1').reference} / ${taskById('cosine-aligned-1').reference}`)
/*
 * The same boundary `right-triangle-trig` asserts for itself, one concept up:
 * no task asks for an angle. 24/25 is the answer and 16.26° is a rounding of
 * it, and recovering an angle from its cosine is `inverse-trig`, which needs a
 * table nothing here has. A task sneaking an angle in would break the
 * no-worker contract above as well — but it would break as a RULING failure,
 * which does not say why, and this is what says why.
 *
 * Two assertions and not one, because the negative alone was wrong in a way
 * worth recording: a regex forbidding "in degrees" anywhere in a prompt fails
 * on the prompt that REFUSES degrees out loud, which is the prompt doing the
 * right thing. So the negative is about what is ASKED, and the positive is that
 * the refusal is stated to the learner rather than only in this file.
 */
t('no task asks for an angle, which is the subject\'s boundary and not the grader\'s',
  DP_TASKS.every(x => !/\b(what angle|which angle|find the angle|arccos|arcsin)\b/i
    .test(x.prompt)),
  DP_TASKS.filter(x => /angle\?/.test(x.prompt)).map(x => x.id).join(', '))
t('and the cosine tasks say so in the prompt, so the learner is told where it stops',
  ['cosine-exact-1', 'cosine-aligned-1'].every(id => /exactly|the same way/.test(taskById(id).prompt))
  && /not a figure in degrees/.test(taskById('cosine-exact-1').prompt),
  taskById('cosine-exact-1').prompt)
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, and the two figures that
 * says so are both needed.
 *
 * `questionCoverage` counts a subgoal as authored when the `socratic` field is
 * present, and 165 of 424 subgoals in the build were authored that way when
 * this concept was written. Thirteen arrived with it and thirteen are authored,
 * so the fraction moved in the right direction rather than being diluted —
 * which is the single most valuable property of new material here, and the one
 * that silently fails when somebody writes labels and leaves the questions for
 * later.
 *
 * `chainsWithNoRuling` is the other half: three chains arrived and each has
 * tasks, so the figure must not have moved. A chain that cannot become evidence
 * is worse than an unwritten concept, because it looks finished.
 */
const DP_COV = questionCoverage(VI)
t('all thirteen of its subgoals ship the question written, not just the label',
  conceptById(VI, 'dot-product-geometry').knowledgePoints
    .flatMap(p => p.workedExample.subgoals).length === 13
  && conceptById(VI, 'dot-product-geometry').knowledgePoints
    .flatMap(p => p.workedExample.subgoals).every(s => typeof s.socratic === 'string'),
  conceptById(VI, 'dot-product-geometry').knowledgePoints
    .flatMap(p => p.workedExample.subgoals).filter(s => !s.socratic).length + ' unwritten')
t('and no question contains its own answer by being an imperative with a mark on it',
  conceptById(VI, 'dot-product-geometry').knowledgePoints
    .flatMap(p => p.workedExample.subgoals).every(s => isInterrogative(s.socratic)),
  conceptById(VI, 'dot-product-geometry').knowledgePoints
    .flatMap(p => p.workedExample.subgoals)
    .filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('the subject still has no chain that cannot become evidence',
  DP_COV.chainsWithNoRuling === 0 && DP_COV.chains === 19,
  `${DP_COV.chains} chains, ${DP_COV.chainsWithNoRuling} with no ruling`)

// ---------------------------------------------------------------------------

/**
 * `sequences`, promoted into the functions subject — the same shape as the dot
 * product above, and the group is placed here for the same reason: the subject
 * does not HAVE a group of its own, having been authored before this file
 * started writing one per subject, and backfilling one for four concepts is a
 * different change from this promotion. What is asserted is the promotion.
 *
 * TWO THINGS MAKE IT DIFFERENT FROM THE DOT PRODUCT, and both are asserted.
 *
 * It came from ANOTHER AREA. `dot-product-geometry` was a node of
 * `coordinate-geometry` promoted into the vectors subject whose own area it
 * sat beside; `sequences` was the root node of `sequences-and-series` in
 * atlas-analysis.ts, which is a different map FILE and a region of the map no
 * promotion had touched. The justification is the node's own one-liner — "a
 * function on the naturals" — so what had to be rewritten was not a boundary
 * sentence that had expired but a `covers` that had never contemplated the
 * case. The area half of the move is asserted in tests/atlas.mjs, which is the
 * harness that builds the composed map; the `links` claim in particular cannot
 * be checked here.
 *
 * It FORKED the subject. Every previous concept here extended a chain of four,
 * and this one hangs off its FOOT: `function-concept` is still the only root
 * and now has two children. That is why the edge is asserted by NAME below and
 * not by counting the edge list — an edge accidentally hung off
 * `domain-and-range` would leave the root unchanged, the count unchanged and
 * `ontologyProblems` silent, while teaching that you must know where a
 * function is defined before you can say what its 6th value is.
 */
const FI = getOntology('functions-and-inverses')
const FI_SEQ = conceptById(FI, 'sequences')
const FI_SUBGOALS = FI_SEQ.knowledgePoints.flatMap(p => p.workedExample.subgoals)

group('sequences, promoted into the functions subject from another map file')
t('it is a concept of that subject, which is still registered where things read it',
  FI?.subject.id === 'functions-and-inverses'
  && FI.concepts.some(c => c.id === 'sequences')
  && ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS)
t('it has no internal faults', ontologyProblems(FI).length === 0, ontologyProblems(FI).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(FI).length === 0)
t('six concepts, eighteen knowledge points',
  FI.concepts.length === 6 && allKnowledgePoints(FI).length === 18,
  `${FI.concepts.length} concepts, ${allKnowledgePoints(FI).length} points`)
t('the concept is teachable AND practisable — a syllabus entry, not a renamed skeleton',
  isTeachable(FI, 'sequences') && isPractisable(FI, 'sequences'))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(FI).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(FI).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * `position` restarts at 1 per CONCEPT and not per subject, which is
 * unobservable until a subject has two of them and is therefore exactly the
 * kind of thing a fifth concept gets wrong by continuing the count.
 */
t('its points number 1,2,3, as every other concept here does',
  FI.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  FI.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))

/*
 * THE FORK, BY NAME. `roots` is unchanged at one, so a root check alone says
 * nothing about where the new concept was attached — the edge itself is the
 * claim.
 */
t('the subject forked at its foot: one root still, and the sequence hangs off that root',
  roots(FI).length === 1 && roots(FI)[0] === 'function-concept'
  && prerequisitesOf(FI, 'sequences').join(',') === 'function-concept',
  `roots ${roots(FI).join('/')}, sequences needs ${prerequisitesOf(FI, 'sequences').join('/')}`)
/*
 * The stranded edge is INTERNAL, which is what let it come here at all. The
 * node declared one `needs` and it pointed at a concept this ontology already
 * contained; one pointing anywhere else would have had to stay behind as an
 * area `links` entry, and an edge written here naming it would make
 * `ontologyProblems` report an unknown endpoint — the fault the empty-edge-list
 * groups above describe from the other side.
 */
t('and that edge is the one the map node stranded, restated here because both ends are inside',
  FI.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'function-concept' && e.to === 'sequences' && !!e.promotedBy),
  FI.edges.filter(e => e.to === 'sequences').map(e => `${e.from}:${e.kind}`).join(' ') || 'MISSING')
/*
 * The credit edge points back at this concept's own prerequisite, which is the
 * shape `domain-and-range` already has here — so it is safe, and asserting
 * acyclicity says why: `cycles` walks prerequisites, and an `encompasses` in
 * the opposite direction is a claim about what practising exercises rather than
 * about what must come first.
 */
t('its encompasses edge points back at that same prerequisite without cycling the subject',
  FI.edges.some(e => e.kind === 'encompasses'
    && e.from === 'sequences' && e.to === 'function-concept' && !!e.rationale)
  && cycles(FI).length === 0 && teachingOrder(FI) !== null,
  cycles(FI).map(l => l.join('→')).join('; ') || 'acyclic')

/*
 * EVERY OBJECTIVE NAMES ONLY KINDS THAT SHIP, which `solid-measure` made a rule
 * and this is the first promotion into an OLDER subject to hold to it.
 *
 * The distinction matters because the surrounding file does not. Every other
 * concept here names `justify` beside `evaluate`, and no `justify` task exists
 * anywhere in the build — so those objectives name an observation that cannot
 * be made. Matching the local style would have meant copying that, which is
 * how a fault spreads by being neighbourly. The unrulable questions this
 * concept is actually about — why the rule alone does not fix the sequence,
 * what the formula buys at position 100 — are in the `socratic` phrasings
 * below, asked by a tutor and marked by nothing.
 */
const FI_SEQ_KINDS = new Set(FI_SEQ.knowledgePoints.flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  FI_SEQ.objectives.length > 0
  && FI_SEQ.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => FI_SEQ_KINDS.has(k)))
  && [...FI_SEQ_KINDS].join(',') === 'evaluate',
  FI_SEQ.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` against ${[...FI_SEQ_KINDS].join('+')}`)
t('while the four older concepts here still name justify, of which the build ships none',
  FI.concepts.filter(c => c.id !== 'sequences')
    .some(c => c.objectives.some(o => o.taskKinds.includes('justify')))
  && !TASKS.some(x => x.kind === 'justify'),
  `${TASKS.filter(x => x.kind === 'justify').length} justify tasks in the build`)

/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, and the fraction is the
 * figure that says it was worth doing.
 *
 * This subject had 16 of its 40 subgoals authored as questions before the
 * promotion — the later concepts in the file were written labels-only. Nine
 * arrived and nine are authored, so it was 25 of 49, and the subject's own
 * fraction moved UP rather than being diluted. That is the property that fails
 * silently when somebody writes the labels and leaves the questions for later:
 * every suite stays green and the coverage line drops.
 *
 * The sixteenth promotion did it again with eleven more, taking the subject to
 * 36 of 60 — 60%, from 40% before either of these two concepts existed. Both
 * figures are asserted below so the direction is on the record and not just
 * the total: a promotion that shipped labels only would leave the total rising
 * and this ratio falling, which is the shape worth catching.
 */
const FI_COV = questionCoverage(FI)
t('all nine of its subgoals ship the question written, not just the label',
  FI_SUBGOALS.length === 9 && FI_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${FI_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${FI_SUBGOALS.length}`)
t('and no question contains its own answer by being an imperative with a mark on it',
  FI_SUBGOALS.every(s => isInterrogative(s.socratic)),
  FI_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  FI_SUBGOALS.every(s => !isInterrogative(s.label)),
  FI_SUBGOALS.filter(s => isInterrogative(s.label)).map(s => s.label).join('; '))
t('every subgoal says what its move establishes, so none of them is a bare step',
  FI_SUBGOALS.every(s => typeof s.detail === 'string' && s.detail.length > 0))
t('the subject is at eighteen chains and still has none that cannot become evidence',
  FI_COV.chains === 18 && FI_COV.chainsWithNoRuling === 0
  && FI_COV.authoredAsQuestions === 36 && FI_COV.questions === 60,
  `${FI_COV.chains} chains, ${FI_COV.chainsWithNoRuling} unrulable, `
  + `${FI_COV.authoredAsQuestions}/${FI_COV.questions} authored`)
/*
 * The RATIO rather than the total, which is the figure the two promotions were
 * supposed to move and the one a labels-only promotion would push the wrong
 * way. 16/40 is 40%; 36/60 is 60%. Asserted as a strict improvement on the
 * pre-promotion state rather than as a literal, so it keeps meaning the same
 * thing after the next concept lands here.
 */
t('and its authored fraction is well above where the subject started, not diluted',
  FI_COV.authoredAsQuestions / FI_COV.questions > 16 / 40,
  `${Math.round(100 * FI_COV.authoredAsQuestions / FI_COV.questions)}% against 40% before`)

/*
 * ONE SPEED TARGET, ON THE SUBSTITUTION, AND NONE ON THE OTHER TWO.
 *
 * types.ts says a timing target on "explain why the degrees must match"
 * measures typing, and two of these three points are that case: what the first
 * term contributes, and what a formula costs at position 100, are judgements
 * the arithmetic does not record. The first point is the opposite — putting 6
 * where the n is has to become automatic before "one substitution against
 * ninety-nine additions" means anything to a learner who finds one
 * substitution effortful.
 *
 * Named rather than counted, because a count of one is satisfied by the target
 * sitting on either of the two points where it would be wrong.
 */
t('only the substitution point claims a speed target, which is where speed is the skill',
  allKnowledgePoints(FI).filter(p => p.automaticityTarget !== undefined)
    .filter(p => FI_SEQ.knowledgePoints.some(q => q.id === p.id))
    .map(p => p.id).join(',') === 'a-sequence-is-a-function-on-positions',
  FI_SEQ.knowledgePoints.map(p => `${p.id}:${p.automaticityTarget ?? 'none'}`).join(' '))
t('and no point here claims a figure, because there are none to claim',
  allKnowledgePoints(FI).every(p => p.visualRef === undefined))

/**
 * `sigma-notation`, the sixteenth promotion, and the first in this build that
 * route demand did not choose.
 *
 * WHY THIS NODE is the part that should not have to be rediscovered, so the
 * three grounds it was chosen on are asserted rather than described. Every
 * journey had read zero unwritten steps on route since the fourteenth
 * promotion, so the ranking the briefs used had expired, and what replaced it
 * was: a finite sum IS a plain number, so every point gets a real `evaluate`
 * task; its one `needs` pointed inside one ontology; and five mapped nodes
 * rest on it, which was more than any other rulable candidate had. The
 * readiness and edge halves are in tests/atlas.mjs, which builds the composed
 * map. What is here is the material.
 *
 * WHAT IT HAD TO GET RIGHT, in the order a mistake would have been silent in:
 *
 *  - IT MUST NOT PRE-EMPT THE TWO NODES THAT STAYED. `arithmetic-sequences`
 *    owns summing by pairing the ends and `geometric-sequences` owns the
 *    closed form, and both are still on the map. A worked example that
 *    totalled 5 + 7 + 9 + 11 by pairing would have taken the first one's only
 *    real idea and left its node behind, and no structural check could see
 *    that. So the expansion example sums k² − 1, whose differences are 7, 9,
 *    11 — asserted below from the task's own numbers, because a later edit to
 *    "simplify" that example to 2k + 1 would reintroduce exactly the shortcut.
 *  - NO CREDIT EDGE, which is the `gcd-and-lcm` judgement reaching the
 *    opposite verdict from the one `sequences` got three screens up. Asserted
 *    per task, since the claim is about what the tasks do and not about taste.
 *  - EVERY SUBGOAL SHIPPED WITH ITS QUESTION, including the five on the
 *    linearity point, which is the longest worked example in the subject.
 */
group('sigma notation, the sixteenth promotion, chosen with no route asking')

const FI_SIG = conceptById(FI, 'sigma-notation')
const FI_SIG_POINTS = FI_SIG.knowledgePoints
const FI_SIG_SUBGOALS = FI_SIG_POINTS.flatMap(p => p.workedExample.subgoals)
const FI_SIG_TASKS = FI_SIG_POINTS.flatMap(p => tasksForPoint(p.id))

t('it is a concept of this subject with material, not a sixth name in the list',
  !!FI_SIG && isTeachable(FI, 'sigma-notation') && isPractisable(FI, 'sigma-notation'))
t('three knowledge points numbered from 1, the shape every concept here has',
  FI_SIG_POINTS.length === 3 && FI_SIG_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${FI_SIG_POINTS.length} points at ${FI_SIG_POINTS.map(p => p.position).join(',')}`)
t('three tasks, one per point, so no chain is left unable to become evidence',
  FI_SIG_TASKS.length === 3
  && FI_SIG_POINTS.every(p => tasksForPoint(p.id).length === 1),
  `${FI_SIG_TASKS.length} tasks: `
  + FI_SIG_POINTS.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
t('every one of them is an evaluate task, which is the only kind its objectives name',
  FI_SIG_TASKS.every(x => x.kind === 'evaluate')
  && FI_SIG.objectives.length > 0
  && FI_SIG.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => FI_SIG_TASKS.some(x => x.kind === k))),
  FI_SIG.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))

/*
 * THE PRE-EMPTION GUARD, from the task's own numbers rather than from a
 * promise in a comment. The expansion task's four terms must NOT be in
 * arithmetic progression, because an arithmetic one can be totalled by pairing
 * the ends and that argument is the whole content of a node that stayed on the
 * map. 8, 15, 24, 35 has differences 7, 9, 11.
 *
 * Derived from `given` and `at` rather than written out, so it keeps testing
 * the task instead of agreeing with a copy of it.
 */
t('the expansion example is not an arithmetic progression, so it pre-empts no mapped node',
  (() => {
    const task = taskById('sigma-expand-1')
    const k = Number(task.at.k)
    const c = Number(task.at.c)
    const terms = [0, 1, 2, 3].map(i => (k + i) ** 2 - c)
    const gaps = terms.slice(1).map((v, i) => v - terms[i])
    return terms.join(',') === '8,15,24,35'
      && new Set(gaps).size === gaps.length
      && terms.reduce((a, b) => a + b, 0) === Number(task.reference)
  })(),
  `terms from given/at: ${[0, 1, 2, 3]
    .map(i => (Number(taskById('sigma-expand-1').at.k) + i) ** 2
      - Number(taskById('sigma-expand-1').at.c)).join(',')}`)
/*
 * And the complement: no prompt, `given` or statement on this concept mentions
 * a first term or a common difference or a common ratio. That is the test a
 * reader can apply to the boundary, and it is the same shape the `sequences`
 * header asks for one section earlier.
 */
t('and nothing here names a first term, a common difference or a common ratio',
  !/first term|common difference|common ratio/i.test(
    JSON.stringify({ points: FI_SIG_POINTS, tasks: FI_SIG_TASKS, obj: FI_SIG.objectives })),
  'a named-family formula has leaked into the notation concept')

/*
 * THE CREDIT EDGE THAT IS NOT THERE, asserted per task so the reasoning is
 * checkable and not just stated. `sequences` earns one because all three of
 * its tasks substitute a position into a rule. Here only `sigma-expand-1`
 * does: `sigma-constant-1`'s term ignores the index by design, and
 * `sigma-linearity-1` is handed a total and never sees a term. One of three is
 * not a majority, and the `gcd-and-lcm` precedent says a majority would not
 * have been enough either.
 */
t('no encompasses edge, because only one of the three tasks produces a term at all',
  !FI.edges.some(e => e.kind === 'encompasses' && e.from === 'sigma-notation')
  && FI_SIG_TASKS.filter(x => x.variables.some(v => v.name === 'k')).length === 1,
  FI_SIG_TASKS.map(x => `${x.id}:${x.variables.map(v => v.name).join('')}`).join(' '))
t('while the prerequisite edge IS there, which is the relation that holds',
  FI.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'sequences' && e.to === 'sigma-notation' && !!e.promotedBy)
  && cycles(FI).length === 0 && teachingOrder(FI) !== null,
  cycles(FI).map(l => l.join('→')).join('; ') || 'acyclic')

t('all eleven subgoals ship the question written, not just the label',
  FI_SIG_SUBGOALS.length === 11
  && FI_SIG_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${FI_SIG_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${FI_SIG_SUBGOALS.length}`)
t('and none of them contains its own answer by being an imperative with a mark on it',
  FI_SIG_SUBGOALS.every(s => isInterrogative(s.socratic)),
  FI_SIG_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('the labels stay imperative, so the map still draws moves',
  FI_SIG_SUBGOALS.every(s => !isInterrogative(s.label)),
  FI_SIG_SUBGOALS.filter(s => isInterrogative(s.label)).map(s => s.label).join('; '))
t('every subgoal says what its move establishes',
  FI_SIG_SUBGOALS.every(s => typeof s.detail === 'string' && s.detail.length > 0))
/*
 * NO TIMING TARGET ON ANY OF THE THREE, which is a different answer from
 * `sequences` and is argued rather than copied. All three points are
 * judgements: which terms the limits name, that the count survives a term that
 * ignores the index, and which rearrangements are licensed. The arithmetic in
 * each is three additions or one product, so a target would measure that
 * instead of the thing being learned — the case types.ts describes.
 */
t('and none of them claims a speed target or a figure, since neither is the skill here',
  FI_SIG_POINTS.every(p => p.automaticityTarget === undefined && p.visualRef === undefined),
  FI_SIG_POINTS.map(p => `${p.id}:${p.automaticityTarget ?? 'none'}`).join(' '))

// ---------------------------------------------------------------------------

/**
 * The three dimensions, the thirteenth promotion — and the second in a row to
 * widen this subject rather than found one.
 *
 * WHY THIS NODE AND NOT ANOTHER is the part that should not have to be
 * rediscovered, so it is asserted rather than described. Readiness was
 * recomputed from the tree as "unwritten concepts on some journey's route",
 * which returned exactly two ids: this one and `gaussian-elimination`. The
 * second is blocked on a missing task kind rather than on effort — "solve for
 * x" asks for a solution SET and no `NamedForm` expresses one — so there was
 * one answer, and it is the one that finishes a journey outright. The group
 * below asserts the state that made the choice forced, so the next run can
 * read it instead of deriving it.
 *
 * THE SECOND WAS NOT BLOCKED, and the next run found that out: it is an
 * authored concept of `expressions-and-equations` now, the fourteenth
 * promotion, and the clause above is the fourth appearance in this build of a
 * refusal that was never structural. The choice recorded here still stands —
 * this concept finished a journey and that one did not — but the REASON given
 * for setting the other aside does not, and that distinction is the thing to
 * carry: a readiness computation is a fact about the tree and a blocker is a
 * claim about the engine, and only the first can be read off a list.
 *
 * WHAT THE PROMOTION HAD TO GET RIGHT, in the order the mistakes would have
 * been silent in:
 *
 *  - Four knowledge points rather than three, which is the first concept in
 *    this subject to differ. The `is` line promised coordinates, planes and
 *    the cross product, and the arithmetic bridge has to come first or none of
 *    the three can be computed.
 *  - Eight tasks, two per point, every one rulable with no worker — the
 *    subject's standing contract, which a single irrational magnitude would
 *    have ended quietly by ruling inconclusive rather than wrong.
 *  - Every subgoal shipped with its question written, which is the figure that
 *    silently fails when somebody writes labels and leaves the questions for
 *    later.
 */
group('the thirteenth promotion was the only one available, and is the ninth journey')
const TDC = conceptById(VI, 'three-dimensional-coordinates')
const TDC_POINTS = TDC.knowledgePoints
t('it is a concept of this subject with material, not a sixth name in the list',
  !!TDC && isTeachable(VI, 'three-dimensional-coordinates')
  && isPractisable(VI, 'three-dimensional-coordinates'),
  `${TDC ? 'present' : 'ABSENT'}`)
t('four knowledge points, one more than every other concept here, numbered from 1',
  TDC_POINTS.length === 4
  && VI.concepts.filter(c => c.id !== 'three-dimensional-coordinates')
    .every(c => c.knowledgePoints.length === 3)
  && TDC_POINTS.map(p => p.position).join(',') === '1,2,3,4',
  `${TDC_POINTS.length} points at ${TDC_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and only the one that is arithmetic claims a timing target',
  TDC_POINTS.every(p => p.visualRef === undefined)
  && TDC_POINTS.filter(p => p.automaticityTarget !== undefined)
    .map(p => p.id).join(' ') === 'space-adds-one-coordinate-and-one-term',
  TDC_POINTS.filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(' '))
t('every objective names a task kind, and every kind it names is one the build has',
  TDC.objectives.length > 0
  && TDC.objectives.every(o => o.taskKinds.length > 0)
  && TDC.objectives.every(o => o.taskKinds.includes('evaluate')),
  TDC.objectives.map(o => `${o.id}:${o.taskKinds.join('/')}`).join(' '))
/*
 * The readiness state that made this the only candidate is asserted in
 * tests/atlas.mjs and not here, because the claim is about the COMPOSED map —
 * it was "`gaussian-elimination` is the one unwritten route concept left, with
 * everything beneath it written" — and this suite builds subjects rather than
 * the atlas. It sits with the route table, which is the other half of the same
 * statement. That table is empty now, row and all, because the one route
 * concept left got written; the assertion there says so and names this
 * concept's successor.
 */

group('the thirteenth promotion is gradable with no worker')
const TDC_TASKS = TDC_POINTS.flatMap(p => tasksForPoint(p.id))
t('eight tasks, two on each of the four points', TDC_TASKS.length === 8
  && TDC_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${TDC_TASKS.length}`)
t('all eight are evaluate, so none of them claims a form',
  TDC_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  TDC_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  TDC_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  TDC_TASKS.map(x => x.id).join(', '))
const tdcRulings = await Promise.all(TDC_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  tdcRulings.every(r => r.verdict.ruling === 'correct'),
  tdcRulings.map((r, i) => `${TDC_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * WHY THE COMPONENTS HAD TO BE CHOSEN, which is the constraint that shaped the
 * material and is invisible in the finished tasks — the same note the eleventh
 * promotion needed, for a different reason.
 *
 * There it was the cosine's two square roots in a DENOMINATOR. Here it is that
 * a magnitude in space is a root of three squares, and the task set would end
 * the subject's no-worker contract at its first irrational one: `exactValue`
 * returns null on a root it cannot settle, which rules inconclusive rather than
 * wrong, so the suite would report it as a worker-only task somewhere else
 * entirely rather than as a bad choice of numbers here.
 *
 * So a = (2, 3, 6) with 4 + 9 + 36 = 49, and the figure the other three points
 * share has |n| = 3 from 4 + 1 + 4. Asserted as "exactly one task takes a root
 * and it is the magnitude", because the failure to catch is a SECOND rooted
 * task added on components whose sum of squares is not a perfect square.
 */
t('exactly one task takes a square root, and it still rules locally',
  TDC_TASKS.filter(x => /\^\(1\/2\)/.test(x.given)).map(x => x.id).join(' ')
    === 'space-magnitude-1',
  TDC_TASKS.filter(x => /\^\(1\/2\)/.test(x.given)).map(x => x.id).join(' '))
t('and no task asks for a vector, which evaluate cannot return',
  taskById('cross-product-component-1').reference === '2'
  && /FIRST component/.test(taskById('cross-product-component-1').prompt)
  && TDC_TASKS.every(x => !/[(]\s*-?\d+\s*,/.test(x.reference)),
  TDC_TASKS.map(x => x.reference).join(' | '))
/*
 * The one place a prompt could have handed over its own answer, and the check
 * that it does not.
 *
 * Both plane tasks are about the constant d in `n·r = d`, and that constant is
 * 6 for both — once computed as n·P and once read at a second point of the same
 * plane. A prompt saying "the plane is 2x − y + 2z = 6" would therefore be a
 * free mark on both of them. Asserted as the absence of the numeral from the
 * prompts rather than as a shape, because the mistake is a number appearing and
 * not a sentence being phrased badly.
 */
t('neither plane prompt states the constant it asks the learner to produce',
  ['plane-constant-1', 'plane-membership-1'].every(id =>
    taskById(id).reference === '6' && !/\b6\b/.test(taskById(id).prompt)),
  ['plane-constant-1', 'plane-membership-1']
    .map(id => `${id}:${/\b6\b/.test(taskById(id).prompt) ? 'LEAKS' : 'clean'}`).join(' '))
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, which the eleventh promotion
 * argued is the single most valuable property of new material here, and the
 * reason the count is asserted alongside the property.
 *
 * Eighteen arrived and eighteen are authored. One of them was written with the
 * question clause FIRST and a statement after it — "Where did the 13 come
 * from? Write 49 in terms of…" — which `isInterrogative` rejects, because it
 * tests the last character and a question that does not end on its question is
 * not one the tutor can ask. It failed here before it shipped, which is the
 * check doing its job; the rule is that the interrogative clause lands LAST.
 */
const TDC_SUBGOALS = TDC_POINTS.flatMap(p => p.workedExample.subgoals)
t('all eighteen of its subgoals ship the question written, not just the label',
  TDC_SUBGOALS.length === 18
  && TDC_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${TDC_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${TDC_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  TDC_SUBGOALS.every(s => isInterrogative(s.socratic)),
  TDC_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal also names a move rather than a step number, and no two in one example repeat',
  TDC_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  TDC_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))
/*
 * The `encompasses` edge back down to the dot product, asserted against the
 * TASKS rather than the prose — the test this file applied to the eleventh
 * promotion's claim and refused twice elsewhere in this subject. Four of the
 * eight tasks evaluate a three-term dot product, so somebody who has just found
 * a plane's constant has demonstrated the product.
 *
 * `=== 4` and not `>= 4`, because the number is the claim. The rationale on the
 * edge names four tasks and says which, so a fifth appearing means either the
 * rationale is stale or somebody added a dot-product task to a concept whose
 * credit claim was sized against the old set — and a floor would accept both
 * silently. The first draft of that rationale said five and listed four; the
 * exact count is what would have caught it.
 */
t('it claims credit back down to the dot product, and the tasks bear the claim out',
  edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'dot-product-geometry'
    && !!e.rationale)
  && TDC_TASKS.filter(x => /\w1\*\w1 \+ \w2\*\w2 \+ \w3\*\w3/.test(x.given)).length === 4,
  TDC_TASKS.filter(x => /\w1\*\w1 \+ \w2\*\w2 \+ \w3\*\w3/.test(x.given))
    .map(x => x.id).join(' '))
t('and it claims nothing back down to span, which the tasks would not support',
  !edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'vectors-and-spans'),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))

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
/*
 * THIS USED TO ASSERT A STRICT MINORITY AND THE NINTH GEOMETRY PROMOTION ENDED
 * THAT, so the claim is restated here rather than renumbered.
 *
 * The old form was `Q_AUTHORED < Q_TOTAL / 2`, and the finding it carried was
 * real: most subgoals in the build were imperative labels that the tutor had to
 * phrase at ask time, and types.ts argues at length that a hand-written
 * question beats a generated one. `circles` shipped twelve subgoals with
 * twelve authored questions, which took the figure from 226 of 460 to 238 of
 * 472 — across the halfway line, so the assertion failed by two.
 *
 * It failed in the direction the work was supposed to move it, which is the
 * whole problem with writing a ratchet as an inequality against a moving total:
 * the test could only stay green while the project stood still. The comment
 * below already says the authored figure is MEANT to go up and that asserting
 * it exactly would make writing a question look like a regression — and a
 * one-sided bound half a dozen questions away from flipping has the same fault
 * in slower motion.
 *
 * So what is held now is the two-sided claim, which does not expire the next
 * time somebody writes a question: a majority of subgoals carry their own
 * phrasing, and the gap is still real rather than closed. The upper bound is
 * the one doing work — it is what stops the coverage line becoming decoration
 * once it has nothing left to report — and the day it fails is the day this
 * assertion should be replaced by an equality, because at that point the
 * number is finished and not merely moving.
 */
t('the authored count is a majority now, and still short of all of them',
  Q_AUTHORED > Q_TOTAL / 2 && Q_AUTHORED < Q_TOTAL, `${Q_AUTHORED} of ${Q_TOTAL}`)
/*
 * A floor and not an equality, for the reason the EVALS count carries: the
 * authored figure is meant to GO UP as questions get written, and asserting it
 * exactly would make writing one look like a regression. What is worth
 * guarding is that the honest split is still being computed and still printed.
 *
 * The companion check below used to be a floor in the OPPOSITE direction — a
 * count of subjects with NOTHING written, lowered by hand as each came off
 * zero. It was 4 when types.ts named the four, then 3 once `function-concept`
 * was authored, then 2, then 1, and now 0:
 * `the-columns-are-where-the-basis-goes` has taken
 * `matrices-and-determinants`, the last of them, off zero.
 *
 * A floor of `>= 0` is vacuously true, so at that point the count stops being
 * an assertion and the guard has to be restated rather than kept as a number.
 * What it was ever protecting was not the figure but the SHAPE of the figure:
 * that coverage is computed and reported per subject, so a starved subject
 * stays visible as itself instead of being averaged into one global
 * percentage. That is what is asserted now, and the per-subject splits are
 * still printed in the message either way — which is how the next starved
 * subject gets noticed.
 *
 * Deliberately NOT asserted: that the weakest subject is below the global
 * rate. It is (3/28 against 90/341), but authoring the weakest one up is the
 * work succeeding, and a check that went red for it would be the exact
 * mistake the paragraph above warns about.
 */
t('coverage is reported per subject, so a starved subject is visible as itself',
  QCOV.length === ONTOLOGIES.length
  && QCOV.every(c => c.questions > 0 && Number.isInteger(c.authoredAsQuestions))
  && QCOV.reduce((n, c) => n + c.authoredAsQuestions, 0) === Q_AUTHORED,
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

/**
 * TUTOR MODE — the walk, and the prompt that cannot hold the answer.
 *
 * questions.ts guarantees that a `SocraticContext` excludes the asked step's
 * `establishes`. That guarantee is worth nothing if the thing actually SENT to
 * a model is assembled from anything else, so the check is re-run one layer
 * out, on the prompt strings themselves, over every step of every chain in
 * every subject and in both modes.
 *
 * It is the same invariant and it has to be asserted twice, because the two
 * failures are different edits. Widening `SocraticContext` would break the
 * first test; reaching past it in a prompt builder — pulling the chain in to
 * "give the tutor more context" — would break only this one, and the output
 * would still read as a perfectly good question.
 */
group('tutor mode — the prompt is built from what the asker may see')

const WALK_LEAKS = QCHAINS.flatMap(c => c.questions.map((q, i) => {
  const ask = promptFor(c, i, 'ask', '')
  const nudge = promptFor(c, i, 'nudge', 'I think you add them', 'Exponents and logarithms')
  const sent = JSON.stringify([ask.prompt, nudge.prompt, unphrasedQuestion(ask.context)])
  return { id: q.id, leaked: sent.includes(JSON.stringify(q.establishes).slice(1, -1)) }
})).filter(r => r.leaked)

t('no prompt in either mode contains the answer to the question it asks',
  WALK_LEAKS.length === 0, WALK_LEAKS.map(r => r.id).join(', '))
t('and the answer is exactly what revealOf hands the LEARNER, so the pair is pinned',
  QCHAINS.every(c => c.questions.every((q, i) => revealOf(c, i) === q.establishes)))
t('revealOf is null past the end rather than the last step again',
  QCHAINS.every(c => revealOf(c, c.questions.length) === null))

/*
 * The other half: what a tutor mid-derivation legitimately knows. A prompt
 * that withheld the problem would be asking a riddle, and one that withheld
 * the established steps would be asking the first question every time.
 */
t('every prompt carries the problem it is about',
  QCHAINS.every(c => c.questions.every((q, i) =>
    promptFor(c, i, 'ask', '').prompt.user.includes(c.problem))))
t('and every PRIOR step, with what it established',
  QCHAINS.filter(c => c.questions.length > 1).every(c => {
    const last = c.questions.length - 1
    const user = promptFor(c, last, 'ask', '').prompt.user
    return c.questions.slice(0, last).every(q => user.includes(q.establishes))
  }))
t('the floor rules are in both modes, not just the asking one', (() => {
  const c = QCHAINS[0]
  const ask = promptFor(c, 0, 'ask', '').prompt.system
  const nudge = promptFor(c, 0, 'nudge', 'stuck', undefined).prompt.system
  const floor = 'You are NOT given what that next move establishes'
  return ask.includes(floor) && nudge.includes(floor)
})())
t('a learner answer is capped rather than passed through whole', (() => {
  const c = QCHAINS[0]
  const huge = 'x'.repeat(5000)
  return promptFor(c, 0, 'nudge', huge).prompt.user.includes('x'.repeat(1200))
    && !promptFor(c, 0, 'nudge', huge).prompt.user.includes('x'.repeat(1201))
})())
/*
 * The reply turn branches, because an answered step and a stuck one are
 * different asks. One set of instructions for both produced a reply that
 * re-asked the step at a learner who had just answered it.
 *
 * The forbidden-praise line is asserted as a string because it is the one
 * instruction standing between "replies with a question" and "replies with a
 * mark" — the model cannot know whether the learner is right, so a stray
 * "exactly!" would be a verdict it is not entitled to give.
 */
t('an answered step and a stuck step get different instructions', (() => {
  const c = QCHAINS[0]
  const answered = promptFor(c, 0, 'nudge', 'I think you add the exponents').prompt.system
  const stuck = promptFor(c, 0, 'nudge', '   ').prompt.system
  return answered.includes('has just answered')
    && !answered.includes('is stuck')
    && stuck.includes('is stuck')
    && !stuck.includes('has just answered')
    && answered !== stuck
})())
t('the answered branch forbids every word a learner would read as a mark', (() => {
  const s = promptFor(QCHAINS[0], 0, 'nudge', 'the bases are the same').prompt.system
  return s.includes('Never say "correct", "right", "exactly", "good"')
    && s.includes('do not grade what they')
})())
t('whitespace counts as not having answered, so the box cannot send an empty turn', (() => {
  const u = promptFor(QCHAINS[0], 0, 'nudge', '  \n  ').prompt.user
  return u.includes('they said only that they are stuck')
})())
t('what the learner wrote reaches the prompt verbatim', (() => {
  const said = 'seven 2s in a row, so 2^7'
  return promptFor(QCHAINS[0], 0, 'nudge', said).prompt.user.includes(said)
})())
t('promptFor refuses a position off the end',
  promptFor(QCHAINS[0], QCHAINS[0].questions.length, 'ask', '') === null
  && promptFor(QCHAINS[0], -1, 'ask', '') === null)

/*
 * The unphrased fallback. Not a Socratic question and not pretending to be —
 * what it has to guarantee is only that it withholds the detail and names the
 * move, since that is all a surface with no model configured can honestly do.
 */
t('the unphrased fallback names the move',
  QNODES.filter(q => !q.authoredAsQuestion).every(q => {
    const chain = QCHAINS.find(c => c.knowledgePointId === q.knowledgePointId)
    const text = unphrasedQuestion(socraticContext(chain, q.position))
    const named = q.move.endsWith('.') ? q.move.slice(0, -1) : q.move
    return text.includes(named)
  }))
t('and an authored question is asked as written rather than wrapped in a shell',
  QNODES.filter(q => q.authoredAsQuestion).every(q => {
    const chain = QCHAINS.find(c => c.knowledgePointId === q.knowledgePointId)
    return unphrasedQuestion(socraticContext(chain, q.position)) === q.move
  }))

group('tutor mode — entering a walk and leaving it for a problem')

t('a concept offers exactly its chains, in the same order',
  ONTOLOGIES.every(o => o.concepts.every(c => {
    const chains = chainsForConcept(o, c.id)
    const openings = openingsForConcept(o, c.id)
    return openings.length === chains.length
      && openings.every((w, i) => w.knowledgePointId === chains[i].knowledgePointId)
  })))
t('an opening reports its length and how much of it is written, separately',
  ONTOLOGIES.flatMap(o => o.concepts.flatMap(c => openingsForConcept(o, c.id)))
    .every(w => w.steps > 0 && w.authored >= 0 && w.authored <= w.steps))
t('and what it converts to, which is the only way out to a ruling',
  ONTOLOGIES.every(o => chainsForConcept(o, 'exponent-rules').length === 0
    || openingsForConcept(o, 'exponent-rules').every(w =>
      w.convertsTo.length === tasksForPoint(w.knowledgePointId).length)))
t('an unknown concept offers nothing rather than throwing',
  openingsForConcept(EXPONENTS_AND_LOGARITHMS, 'no-such-concept').length === 0)
t('a concept with no worked example offers nothing',
  openingsForConcept(EXPONENTS_AND_LOGARITHMS, 'logarithm-definition').length
    === chainsForConcept(EXPONENTS_AND_LOGARITHMS, 'logarithm-definition').length)

/*
 * The entry a PROBLEM uses. A generated task has no derivation of its own, so
 * "lead me through this" resolves to the worked example on the same knowledge
 * point — which is why this has to be reachable by point id alone.
 */
t('a knowledge point resolves to its own chain and no other',
  QCHAINS.every(c => {
    const o = ontologyForPoint(c.knowledgePointId)
    return chainForPoint(o, c.knowledgePointId)?.knowledgePointId === c.knowledgePointId
  }))
t('an unknown point resolves to null, not to the nearest chain',
  chainForPoint(EXPONENTS_AND_LOGARITHMS, 'no-such-point') === null
  && openingForPoint(EXPONENTS_AND_LOGARITHMS, 'no-such-point') === null)
t('the terminus is the authored answer and the point\'s own tasks',
  QCHAINS.every(c => {
    const end = walkTerminus(c)
    return end.answer === c.answer && end.convertsTo.join() === c.convertsTo.join()
  }))

/*
 * `unmetBefore` is for SAYING, not for gating — a walk records nothing, so it
 * cannot be a way around the mastery floor. What it must not do is name a gap
 * nobody can close, which is why it goes through `gatingPrerequisitesOf`: an
 * unteachable concept has no knowledge points and therefore permanent zero
 * strength, and listing it would be reporting an impossible errand.
 */
const UNMET_SUBJECT = EXPONENTS_AND_LOGARITHMS
const UNMET_TARGET = UNMET_SUBJECT.concepts.find(c =>
  gatingPrerequisitesOf(UNMET_SUBJECT, c.id).some(id => id !== c.id && isTeachable(UNMET_SUBJECT, id)))

t('with nothing demonstrated, the groundwork is named',
  unmetBefore(UNMET_SUBJECT, UNMET_TARGET.id, [], 0.7).length > 0,
  UNMET_TARGET.id)
t('with everything at full strength, nothing is named',
  unmetBefore(
    UNMET_SUBJECT, UNMET_TARGET.id,
    UNMET_SUBJECT.concepts.map(c => ({ conceptId: c.id, strength: 1 })), 0.7,
  ).length === 0)
t('the concept itself is never named as its own prerequisite',
  UNMET_SUBJECT.concepts.every(c =>
    !unmetBefore(UNMET_SUBJECT, c.id, [], 0.7).some(u => u.conceptId === c.id)))
t('nothing unteachable is named, since its strength can never rise',
  UNMET_SUBJECT.concepts.every(c =>
    unmetBefore(UNMET_SUBJECT, c.id, [], 0.7).every(u => isTeachable(UNMET_SUBJECT, u.conceptId))))
t('an unknown concept has no groundwork rather than all of it',
  unmetBefore(UNMET_SUBJECT, 'no-such-concept', [], 0.7).length === 0)

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
