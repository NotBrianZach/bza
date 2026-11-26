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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

/*
 * The stack survives between entries, and registers hold values by name.
 *
 * `dup`, `drop`, `swap` and `over` were already here and already tested, and
 * they could not do the one thing they are for: the caller threw the stack
 * away after every entry, so nothing could be left where the next entry would
 * reach it. That makes a postfix expression evaluator rather than an RPN
 * calculator. Emacs calc's stack is the model.
 */
t('a stack passed in is where the next entry starts', (() => {
  const first = ev('3 4')
  const second = evaluateRpn('+', DEFAULT_SETTINGS, { stack: first.stack })
  return first.stack.length === 2 && second.display === '7'
})())
t('the caller\'s array is not mutated, so an error cannot corrupt it', (() => {
  const first = ev('3 4')
  try { evaluateRpn('+ + +', DEFAULT_SETTINGS, { stack: first.stack }) } catch { /* expected */ }
  return first.stack.length === 2
})())
t('omitting the stack is unchanged behaviour', ev('3 4 +').display === '7')

t('sto stores by name and LEAVES the value on the stack', (() => {
  const regs = new Map()
  const r = evaluateRpn('7 sto radius', DEFAULT_SETTINGS, { registers: regs })
  return r.display === '7' && formatValue(regs.get('radius'), DEFAULT_SETTINGS) === '7'
})())
t('rcl pushes it back, and it composes', (() => {
  const regs = new Map()
  evaluateRpn('7 sto radius', DEFAULT_SETTINGS, { registers: regs })
  return evaluateRpn('rcl radius 2 *', DEFAULT_SETTINGS, { registers: regs }).display === '14'
})())
/* Registers are mutated rather than returned, so stores that happened before
   an error survive it — which is what Calc does and what makes a register
   usable mid-calculation. */
t('a store before an error is kept', (() => {
  const regs = new Map()
  try { evaluateRpn('7 sto radius +', DEFAULT_SETTINGS, { registers: regs }) } catch { /* expected */ }
  return regs.has('radius')
})())
t('sto with no name, no value, or an unknown rcl each say which', (() => {
  const msgs = []
  for (const bad of ['sto', 'sto x', 'rcl nope']) {
    try { evaluateRpn(bad, DEFAULT_SETTINGS, { registers: new Map() }); msgs.push('NO ERROR') }
    catch (e) { msgs.push(e.message) }
  }
  return /register name/.test(msgs[0]) && /value on the stack/.test(msgs[1])
    && /no register named nope/.test(msgs[2])
})())
/* A caller that passes no registers must be told, not silently do nothing —
   `sto` appearing to work and storing nowhere is the worst of the options. */
t('sto without registers is refused rather than ignored', (() => {
  try { evaluateRpn('7 sto x'); return false } catch (e) { return /registers/.test(e.message) }
})())

/*
 * Two properties of the calculator UI that would rot silently.
 *
 * Source assertions, because both are about where the component gets its
 * information rather than about a value it computes.
 */
const CALC_SRC = readFileSync(
  join(FRONTEND, 'components', 'concepts', 'RpnCalculator.tsx'), 'utf8')

/* The function finder is built FROM the registries. Listed by hand it would
   fall behind the engine the first time an operator was added, and a palette
   that silently omits a function is worse than no palette — you conclude the
   engine cannot do it. */
t('the finder enumerates the engine rather than a hand-written list',
  /Object\.keys\(OPERATORS\)/.test(CALC_SRC)
  && /Object\.keys\(CONSTANT_WORDS\)/.test(CALC_SRC))

/* The live preview must evaluate against a COPY of the registers.
   `evaluateRpn` mutates them by design, so previewing `7 sto radius` against
   the real map would store a register on every keystroke — leaving `r`,
   `ra`, `rad` behind as you typed the name. */
t('the preview cannot write registers while you type',
  /registers: new Map\(registers\)/.test(CALC_SRC))

/* And the committed entry gets the real one, or `sto` would never store. */
t('committing an entry hands over the real register map',
  /const next = new Map\(registers\)/.test(CALC_SRC)
  && /setRegisters\(next\)/.test(CALC_SRC))

/* The tab that held only this is gone; the calculator moved to Practice,
   beside the problem and the scratchpad. A `?tab=tools` link naming a tab
   that no longer exists must fall through to the default rather than render
   an empty page. */
t('the tools tab is gone and nothing still routes to it', (() => {
  const page = readFileSync(join(FRONTEND, 'app', 'learn', 'page.tsx'), 'utf8')
  return !/'tools'/.test(page) && /<RpnCalculator \/>/.test(page)
})())

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
 * ── EVERY `incorrect` SAYS WHY ────────────────────────────────────────────
 *
 * Reported from play: an evaluate task answered 18 instead of 54, and the
 * table said "Ruled incorrect" and stopped. The verifier was not at fault —
 * it had built "the value at p = 2, a = 1, q = 3, b = 3 is 54, and this is
 * 18" and the RPG card discarded it. But chasing that down turned up one
 * ruling in verify.ts that genuinely had nothing to discard: the worker's
 * counterexample branch said only "the answer differs from the value of the
 * expression at the stated inputs", naming no value, on a path reachable
 * with the value perfectly well known.
 *
 * So the rule is asserted rather than left as a habit. Being told you are
 * wrong and not what is right is the one outcome this engine should never
 * produce, and it is the kind of gap that is invisible from the outside: the
 * RULING is correct, so nothing fails, and the only symptom is a learner who
 * cannot act on it.
 *
 * Read from source rather than driven through `rule()`, because the claim is
 * about every branch including the ones only a live worker reaches, and a
 * test that could only check the branches it can execute would pass while
 * the unreachable ones rotted. The `found` floor is what stops it going
 * vacuous if the literal is ever written differently.
 */
const VERIFY_SRC = readFileSync(join(FRONTEND, 'lib', 'concepts', 'verify.ts'), 'utf8')
const incorrectBranches = [...VERIFY_SRC.matchAll(/ruling: 'incorrect'/g)].map(m => ({
  line: VERIFY_SRC.slice(0, m.index).split('\n').length,
  // The verdict object this literal opens, to its closing brace. Generous
  // rather than exact: a window too long can only make the check WEAKER by
  // finding someone else's brokeAt, and the floor below catches that.
  window: VERIFY_SRC.slice(m.index, m.index + 700),
}))
t('verify.ts still returns incorrect rulings at all', incorrectBranches.length >= 8,
  `found ${incorrectBranches.length}`)
const mute = incorrectBranches.filter(b => !/brokeAt:/.test(b.window))
t('every incorrect ruling carries a brokeAt explaining it',
  mute.length === 0, `silent at line(s) ${mute.map(b => b.line).join(', ')}`)

/*
 * And the counterexample branch names the number, now that it can.
 *
 * Matched on its OWN tail rather than on "the value at ${where} is
 * ${showExact(expected)}", which is what the first draft of this line used
 * and which passes whether or not this branch exists: the step-2 exact
 * comparison opens with the same words. Deleting the whole counterexample
 * detail left that assertion green, so it was checking the branch it was not
 * named after.
 */
t('the counterexample branch names the expected value when it knows it',
  /and this answer is not equal to it/.test(VERIFY_SRC))

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

/**
 * The binomial theorem — the nineteenth promotion, and the first one chosen on
 * RULABILITY rather than on a route or an area floor.
 *
 * All ten journeys read zero unwritten before it was written, so the heuristic
 * that picked most of its predecessors was spent. What picked this one is the
 * group above's invariant: an expansion evaluated at a stated input is settled
 * by `exactValue` alone, so the concept is finishable with the worker
 * unreachable, while the expansions themselves are transforms the CAS rules.
 * Both halves from the concept's own content, no stand-in.
 *
 * `complex-numbers` was the rival and was declined on the same axis.
 * `exactValue` is exact RATIONAL arithmetic and has no complex case, so every
 * expression containing the imaginary unit is unsettleable locally —
 * `(3 + 2i)(3 − 2i)` included, whose value is the integer 13. Writing it would
 * have meant adding to `WORKER_ONLY` below and then widening the ratchet
 * beside it that caps how many shipped `evaluate` tasks may need the worker.
 * That is a quality floor, and widening a floor to admit new material is how a
 * floor stops meaning anything.
 */
group('the binomial theorem is teachable, and settles without the worker')

const BT = conceptById(O, 'binomial-theorem')
const BT_TASKS = BT.knowledgePoints.flatMap(point => tasksForPoint(point.id))
t('the concept is authored', !!BT && isTeachable(O, 'binomial-theorem'))
t('three knowledge points, each with a worked example and labelled subgoals',
  BT.knowledgePoints.length === 3
  && BT.knowledgePoints.every(point => point.workedExample.subgoals.length >= 3
    && point.workedExample.subgoals.every(s => s.label && s.detail)),
  BT.knowledgePoints.map(point => `${point.id}:${point.workedExample.subgoals.length}`).join(' '))
t('positions restart at 1 and run consecutively within the concept',
  BT.knowledgePoints.map(point => point.position).join(',') === '1,2,3',
  BT.knowledgePoints.map(point => point.position).join(','))
t('every point has a task, so no chain is left unable to become evidence',
  BT.knowledgePoints.every(point => tasksForPoint(point.id).length > 0),
  BT.knowledgePoints.map(point => `${point.id}:${tasksForPoint(point.id).length}`).join(' '))
/*
 * EVERY subgoal carries an authored question, which across the whole build only
 * about seven in ten do. Asserted at full coverage rather than as "some",
 * because the value of the field is that a hand-written question beats one the
 * tutor phrases at ask time, and a concept that ships partially authored
 * strands the unphrased steps in exactly the state this field exists to fix.
 */
t('every subgoal carries an authored question, not just some of them',
  BT.knowledgePoints.every(point => point.workedExample.subgoals.every(s => !!s.socratic)),
  BT.knowledgePoints.flatMap(point => point.workedExample.subgoals)
    .filter(s => !s.socratic).length + ' unphrased')
/*
 * And each one is really interrogative. A question ending in a full stop scores
 * zero on `questionCoverage` however well it is phrased, so the punctuation is
 * load-bearing rather than cosmetic — and the failure is invisible except as
 * the coverage line moving less than the number of subgoals added.
 */
t('and each authored question is phrased as one, ending in a question mark',
  BT.knowledgePoints.flatMap(point => point.workedExample.subgoals)
    .every(s => s.socratic.trim().endsWith('?')),
  BT.knowledgePoints.flatMap(point => point.workedExample.subgoals)
    .filter(s => !s.socratic.trim().endsWith('?')).map(s => s.label).join(' | '))
t('it ships both kinds, which is the ground it was chosen on', (() => {
  const kinds = new Set(BT_TASKS.map(x => x.kind))
  return kinds.has('evaluate') && kinds.has('transform_to_form')
})(), [...new Set(BT_TASKS.map(x => x.kind))].join(','))
/*
 * NO ASSERTION HERE CHECKS THAT THE EXPANSIONS ARE RIGHT, AND THAT IS NOT AN
 * OMISSION — it is worth a note because the gap looks real and this promotion
 * wrote the duplicate before finding the original.
 *
 * `validateInstance` in generators.ts already settles it, and more rigorously
 * than a hand-rolled check here would. For a `transform_to_form` task with a
 * free symbol it proves the two sides are the same function by agreeing at
 * `max(degreeBound + 1, 8)` points — a polynomial identity of degree d is
 * decided by d + 1 distinct values, and the highest degree shipped by this
 * concept is 5, so eight points is a proof rather than a sample. It also
 * reports `reference does not satisfy its own shape claim` and `given already
 * has the shape the task demands, so it asks for nothing`, which are the
 * form-held and no-free-mark checks.
 *
 * The group further down runs it over every authored task, so a mis-stated row
 * of Pascal's triangle fails there. Confirmed by injection rather than assumed:
 * writing 23x² + 33x in place of 24x² + 32x — the error the third worked
 * example uses as its own illustration, because it survives a check at x = 1 —
 * turns that assertion red and names the point it broke at.
 */
/*
 * The resilience claim, stated at this concept rather than left to the
 * whole-build sweep above. Every `evaluate` task here rules its own reference
 * correct with NO worker configured, which is what "chosen on rulability"
 * actually cashes out as.
 */
const btEvalRulings = await Promise.all(BT_TASKS.filter(task => task.kind === 'evaluate')
  .map(task => ruleEvaluate(task, task.reference, NO_WORKER)))
t('every evaluate task rules its own reference correct with no worker at all',
  btEvalRulings.length >= 3
  && btEvalRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  btEvalRulings.map(r => (r.status === 'ruled' ? r.verdict.ruling : r.status)).join(','))
t('polynomial arithmetic gates it, the theorem being a shortcut for doing it longhand',
  prerequisitesOf(O, 'binomial-theorem').includes('polynomial-arithmetic'))
/*
 * The credit edge, and the reason this concept is in THIS subject. An
 * `encompasses` can only be declared by an ontology holding both ends, and an
 * area `links` entry carries no edge kind — so filed with the exponent rules
 * instead, this edge would have been expressible nowhere and lost in silence,
 * with nothing going red because `encompasses` affects what comes DUE rather
 * than what gates.
 */
t('and doing it exercises that arithmetic, so it does not come due as though untouched',
  encompassedBy(O, 'binomial-theorem').includes('polynomial-arithmetic'),
  encompassedBy(O, 'binomial-theorem').join(' '))
t('nothing introduced a cycle', teachingOrder(O) !== null)

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
 * promotion recorded that as a trap worth grepping for before starting, the
 * tenth hit it again, and the eleventh found it from the failure message
 * exactly as the sentence that used to stand here predicted. It is named here
 * rather than only in the memory of the run that hit it.
 *
 * It stays a literal rather than becoming `>= 11`. What it is really asserting
 * is that this subject is registered at all, and a floor would pass with the
 * subject absent as long as somebody else had added two.
 *
 * The twelfth hit it as well, and the thirteenth, the fourteenth and the
 * fifteenth, and the prediction is now a record of EIGHT consecutive hits. Worth
 * keeping exactly as it is for that reason: every new subject has found this
 * line within one test run of adding itself, which is a cheap and reliable way
 * to be told that a subject count is asserted in a place nobody would look for
 * it.
 *
 * The sixteenth and seventeenth each hit it too, which is TEN consecutive — and
 * the seventeenth is worth one extra line, because it is the first to arrive
 * while a memory note about this build already said to expect it. Being told in
 * advance did not make the line findable: the number lives in an
 * exponents-and-logarithms group, forty-four hundred lines from the registry it
 * counts, and the only reliable way to locate it is still to add a subject and
 * read the red. That is the behaviour this literal is kept for.
 */
t('it is registered, and the registry now holds seventeen subjects',
  ONTOLOGIES.length === 17 && getOntology('exponents-and-logarithms') === X2,
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
/*
 * The name of this assertion said "one concept" and now says two, and the
 * change is the promotion rather than drift. `conceptFacet` makes the whole
 * facet guided if ANY concept is, so the claim it tests was never about the
 * count — which is why the count is now asserted separately and by name
 * instead of being carried in a test title where nothing reads it.
 */
t('it assembles into a real Facet, guided because two of its concepts cannot be checked', (() => {
  const facet = conceptFacet(X2)
  return facet.enforcement === 'guided' && !!facet.caveat && facet.options.length === X2.concepts.length
})())
/*
 * WHICH two, by name. Both are about SOLVING something, and that is the shared
 * cause rather than a coincidence: an encyclopaedia files by object, so it has
 * a title for a logarithm and for a root and none for the act of undoing
 * either. A `checked` concept here would have to match an article title, which
 * `conceptsInOffering` is the only consumer of and tests against
 * `offering.title` alone.
 *
 * `radical-equations` is the one worth the assertion. It arrived from the map
 * carrying `match: /\bradical equation\b/i` and the convention of the previous
 * five promotions was to bring a pattern across verbatim — but no article is
 * titled "radical equation", so the pattern had never matched anything and the
 * node had been counted in the recognition figure for its whole life anyway.
 * Retiring a dead branch is not narrowing. The figure printed at the end of
 * tests/atlas.mjs went 267 to 266 and is more nearly true for it.
 */
t('and they are the two solving concepts, named rather than counted',
  X2.concepts.filter(c => c.fidelity === 'guided').map(c => c.id).sort().join(' ')
    === 'radical-equations solving-exponential-equations',
  X2.concepts.filter(c => c.fidelity === 'guided').map(c => c.id).join(' '))
t('each guided one carries a caveat and no pattern, which is what guided means',
  X2.concepts.filter(c => c.fidelity === 'guided')
    .every(c => !!c.caveat && !c.scope.match))
t('the promoted concept kept the map node\'s search hint, only the dead pattern went',
  conceptById(X2, 'radical-equations')?.scope.hint === 'radical equation extraneous solution',
  conceptById(X2, 'radical-equations')?.scope.hint)
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
/*
 * THREE SINCE `radical-equations` WAS PROMOTED INTO THIS SUBJECT, and the
 * third pair is a different KIND of interference from the two the subject
 * shipped with.
 *
 * xi1 and xi2 are confusions of SHAPE: two rules that look alike on the page
 * (xᵃ·xᵇ against log(xy), x⁻² against x^(1/2)). xi3 is a confusion of MOVE —
 * "undo what wraps the unknown by applying its inverse to both sides" is
 * literally the same instruction in both concepts, and the only difference is
 * that log_b is one-to-one and an even power is not, which is the difference
 * that decides whether the answer needs checking.
 *
 * It is NOT a rehomed `confusedWith`. The map node carried none, which the
 * departure note in atlas-foundations.ts records as checked before deletion —
 * `expandEdges` turns a node's `confusedWith` into an `interferes_with` edge,
 * so losing one is silent and every suite stays green. This is an authored
 * claim made at promotion time, which is what `interferes_with` is for: the
 * type doc says it is authored and never inferred, because similarity of name
 * is a poor proxy.
 */
t('it has three interference pairs, all with stated reasons',
  edgesOfKind(X2, 'interferes_with').length === 3
  && edgesOfKind(X2, 'interferes_with').every(e => !!e.rationale),
  edgesOfKind(X2, 'interferes_with').map(e => `${e.from}~${e.to}`).join(' '))
t('the third is the two solving methods, which share an instruction and not a shape',
  interferesWith(X2, 'solving-exponential-equations').includes('radical-equations')
  && interferesWith(X2, 'radical-equations').includes('solving-exponential-equations'),
  interferesWith(X2, 'radical-equations').join(' '))
t('and its reason names the property that separates the two inverses',
  /one-to-one/.test(interferenceReason(X2, 'solving-exponential-equations', 'radical-equations')),
  interferenceReason(X2, 'solving-exponential-equations', 'radical-equations'))
t('the exponent and log rules interfere, despite one encompassing the other', (() => {
  const interferes = interferesWith(X2, 'exponent-rules').includes('logarithm-rules')
  const encompasses = encompassedBy(X2, 'logarithm-rules').includes('exponent-rules')
  return interferes && encompasses
})(), 'the kinship that makes the credit edge true is what makes them confusable')
t('the interference reason is retrievable for the UI',
  /multiplication becomes addition/.test(interferenceReason(X2, 'exponent-rules', 'logarithm-rules')))

/**
 * THE SEVENTH CONCEPT, AND THE ONLY ONE IN THIS SUBJECT THAT CAME OFF THE MAP.
 *
 * `radical-equations` was a node of `algebra-foundations` and is authored here.
 * The structural half of that — the node being gone, the stranded edge being
 * rehomed, the root set shrinking — is asserted in tests/atlas.mjs, which can
 * see the areas. What is checkable HERE is that the material is real, that the
 * subject stayed rulable with no worker, and that the objectives do not promise
 * an observation the build cannot make.
 *
 * THE LAST OF THOSE IS THE ONE WORTH THE MOST. Every other objective in this
 * file names `justify` beside `evaluate`, and there is not one `justify` task
 * anywhere in `TASKS` — the kind is declared unverifiable in types.ts and the
 * suite refuses to ship a task of an unverifiable kind, so those mentions name
 * observations that can never be made. types.ts argues at length that an
 * objective with no `taskKinds` "makes a curriculum look complete while being
 * unreachable"; naming a kind that ships nothing does the same thing while
 * passing the non-empty check. So the new concept names only `evaluate`, and
 * this group asserts the property over the whole subject rather than over the
 * one concept — which makes it fail if anybody adds the `justify` back, and
 * documents in its failure message that the six older objectives are the
 * reason the check cannot yet be applied to them.
 */
group('the seventh concept, promoted off the map')
const RADICAL = conceptById(X2, 'radical-equations')
t('it is a concept of this subject, with material and problems both',
  !!RADICAL && RADICAL.subjectId === 'exponents-and-logarithms'
  && isTeachable(X2, 'radical-equations') && isPractisable(X2, 'radical-equations'))
t('four knowledge points, and every one of them has a task',
  RADICAL.knowledgePoints.length === 4
  && RADICAL.knowledgePoints.every(p2 => tasksForPoint(p2.id).length > 0),
  RADICAL.knowledgePoints.map(p2 => `${p2.id}:${tasksForPoint(p2.id).length}`).join(' '))
t('their positions restart at 1 and run without a gap, which is per concept and not per subject',
  RADICAL.knowledgePoints.map(p2 => p2.position).join(',') === '1,2,3,4',
  RADICAL.knowledgePoints.map(p2 => p2.position).join(','))
/*
 * Every subgoal, not most of them. `questionCoverage` counts the authored
 * `socratic` fields across the whole build and reports a fraction; a concept
 * shipped with questions written for every step is what moves it, and the
 * fraction cannot say which concept did. Asserted per concept so a later
 * concept authored without them fails by name instead of nudging a ratio.
 */
t('every subgoal of every point carries a written question',
  RADICAL.knowledgePoints.every(p2 => p2.workedExample.subgoals.every(s => !!s.socratic)),
  RADICAL.knowledgePoints.flatMap(p2 => p2.workedExample.subgoals
    .filter(s => !s.socratic).map(s => `${p2.id}/${s.label}`)).join(' '))
t('and each of those questions is phrased as one, rather than an instruction with a question mark',
  RADICAL.knowledgePoints.every(p2 => p2.workedExample.subgoals
    .every(s => s.socratic.trim().endsWith('?') && isInterrogative(s.socratic))),
  RADICAL.knowledgePoints.flatMap(p2 => p2.workedExample.subgoals
    .filter(s => !(s.socratic.trim().endsWith('?') && isInterrogative(s.socratic)))
    .map(s => `${p2.id}/${s.label}`)).join(' '))
t('no point claims a figure or a timing target, neither of which it has',
  RADICAL.knowledgePoints.every(p2 => !p2.visualRef && p2.automaticityTarget === undefined))
/*
 * The timing absence is a judgement and not an omission, so it is worth the
 * half-line. Three points in this subject DO set `automaticityTarget` — the
 * product rule, the negative exponent and the definition of a log — because
 * recalling those at speed is part of knowing them. Nothing in a radical
 * equation is like that: the content is a decision about which candidate
 * belongs, and a stopwatch on it measures typing, which is the example
 * types.ts gives.
 */
t('while three older points in the subject do set one, so the absence is a choice',
  allKnowledgePoints(X2).filter(p2 => p2.automaticityTarget !== undefined).length === 3,
  allKnowledgePoints(X2).filter(p2 => p2.automaticityTarget !== undefined).map(p2 => p2.id).join(' '))
t('its objectives name only kinds that really ship a task in this build',
  RADICAL.objectives.length > 0 && RADICAL.objectives.every(o =>
    o.taskKinds.length > 0 && o.taskKinds.every(k => TASKS.some(task => task.kind === k))),
  RADICAL.objectives.flatMap(o => o.taskKinds.filter(k => !TASKS.some(task => task.kind === k)))
    .join(' '))
t('which the six older concepts here do NOT satisfy — the justify mentions are the backlog',
  X2.concepts.filter(c => c.objectives.some(o =>
    o.taskKinds.some(k => !TASKS.some(task => task.kind === k)))).length === 6,
  X2.concepts.filter(c => c.objectives.some(o =>
    o.taskKinds.some(k => !TASKS.some(task => task.kind === k)))).map(c => c.id).join(' '))
/*
 * THE RULING IS LOCAL ON ALL NINE, which is what let this concept be authored
 * at all. `exactValue` returns a rational for `sqrt(9)` and null for
 * `sqrt(2)`, and a task whose own truth is null falls through to comparing the
 * learner against the author's unvouched reference — the one thing an authored
 * task must not do. So every root the nine tasks take is of a perfect square.
 * Asserted here rather than relying on the whole-build ratchet above, because
 * that one is an inequality against a moving total and would absorb a new
 * worker-needing task without a word.
 */
t('all nine of its tasks are evaluate, and every one re-derives its own answer with no worker',
  (() => {
    const mine = TASKS.filter(task => RADICAL.knowledgePoints.some(p2 => p2.id === task.knowledgePointId))
    if (mine.length !== 9 || !mine.every(task => task.kind === 'evaluate')) return false
    return mine.every(task => {
      const symbols = task.variables.map(v => v.name)
      const at = Object.fromEntries(Object.entries(task.at).map(([k, v]) => [k, parseExpression(v, [])]))
      const truth = exactValue(substitute(parseExpression(task.given, symbols), at))
      const claimed = exactValue(parseExpression(task.reference, symbols))
      return truth && claimed && showExact(truth) === showExact(claimed)
    })
  })(),
  TASKS.filter(task => RADICAL.knowledgePoints.some(p2 => p2.id === task.knowledgePointId))
    .map(task => `${task.id}:${task.kind}`).join(' '))
/*
 * THE PAIR THAT CARRIES THE WHOLE CONCEPT, asserted as a pair because neither
 * half says anything alone. One expression, `sqrt(x+7) - x`, at the two
 * candidates a squaring produced: 1 at the survivor, which is what the equation
 * asks for, and 5 at the casualty, which is not. The verdicts differ in KIND
 * rather than in size — belongs against does not belong — which is this build's
 * established way of making an asymmetry scoreable, and the reason the two
 * tasks are not collapsible into one.
 */
t('the check is shipped as one expression at two candidates, with the two verdicts differing in kind',
  (() => {
    const survivor = taskById('survivor-satisfies-the-original-1')
    const casualty = taskById('casualty-fails-the-original-1')
    return survivor && casualty
      && survivor.given === casualty.given
      && survivor.at.x === '2' && survivor.reference === '1'
      && casualty.at.x === '-3' && casualty.reference === '5'
  })())
/*
 * And the second pair, which is the part a learner would not guess: the
 * discarded candidate is not an intruder, it is the solution of the SAME
 * equation with the other side negated, and squaring folds the two into one
 * quadratic. `sqrt(x+7) + (x+1)` is that folded equation written as a
 * difference from zero, and it comes to 0 exactly at the casualty.
 */
t('and the folded-in equation is shipped the same way, 0 at the casualty and not at the survivor',
  taskById('casualty-solves-the-folded-equation-1')?.reference === '0'
  && taskById('survivor-fails-the-folded-equation-1')?.reference === '6'
  && taskById('casualty-solves-the-folded-equation-1')?.given
    === taskById('survivor-fails-the-folded-equation-1')?.given)

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
t('seventeen concepts, fifty-one knowledge points',
  A.concepts.length === 17 && allKnowledgePoints(A).length === 51,
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
t('and the other sixteen concepts are reported blocked rather than silently absent',
  coldSet.blocked.length === 16,
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
 *
 * `absolute-value` added three points and FOUR tasks, so this is the second
 * concept here that is not one apiece. The extra one is on the middle point,
 * and the reason is a property of the ask rather than of the concept: that
 * point's natural question is `abs(x)/x`, whose answer is −1 at EVERY negative
 * input, so it can be answered from the sign of x alone without any of the
 * content. `abs(x) - x` sits beside it, where the answer depends on the input
 * and both wrong readings produce 0. A task whose reference does not move when
 * its input moves is weak evidence even when it is correct, and pairing is the
 * cheaper fix than finding one question that does both jobs.
 *
 * `percent` added three points and three tasks, one apiece, and it is the
 * second concept here owing no proxy apology — the same property
 * `ratio-and-rate` has and for the same reason, since an amount, a price before
 * a discount and a price after two changes are all values. It needed no extra
 * task either, and the comparison with `absolute-value` directly above is the
 * exact one: what forced the pairing there is an input-independent reference,
 * and all three of these move with every variable they declare. The third is
 * the one worth reading, because its reference IS 0 at some inputs —
 * (100+p)(100−q) = 10000 is precisely the undoing condition — and that is its
 * content rather than the defect, which is why the property asserted in the
 * group below is "not 0 at its own inputs" and not "never 0".
 *
 * `scientific-notation` added three points and three tasks, one apiece, and it
 * is the third owing no proxy apology — a quantity written out, a product and a
 * total are all values. What is new about it is the other half of the proxy
 * question, which no concept here had raised: the thing this concept exists to
 * teach is a FORM, "write it as a × 10ⁿ", and that asks for a pair rather than
 * a number. No task kind carries a pair and no `NamedForm` can see a power of
 * ten, so a proxy looked unavoidable going in.
 *
 * It turned out not to be needed, for a reason worth knowing because it
 * generalises: `ruleEvaluate` compares EXACT RATIONALS, so `4 * 10^5` and
 * `400000` are one answer and both are marked correct against a reference of
 * `400000`. The learner may answer in the notation being taught. That is
 * verified rather than reasoned — all three tasks were run through
 * `ruleEvaluate` with the scientific-notation writing as the answer before they
 * were written down — and it is asserted directly below, since the property
 * belongs to the ruler and a change there would take this concept's whole case
 * with it while leaving every reference still "correct".
 *
 * `euclidean-algorithm` added three points and NINE tasks, which is three
 * apiece and the densest arrival this subject has had — matching
 * `division-algorithm` directly below it, and for the same reason: an algorithm
 * is one expression evaluated repeatedly, so three tasks on a point are three
 * substitutions rather than three questions looking for one answer.
 *
 * It owes no proxy apology on its first and third points, every object in them
 * being a whole number, and it DOES owe one on the second. What that point
 * teaches is "write 12 as a combination of 360 and 84", whose answer is a PAIR
 * of coefficients — the same wall `scientific-notation` hit on (a, n) and
 * `division-algorithm` on (q, r), and no `NamedForm` can see it either. So the
 * coefficients are derived in the worked example and the three tasks evaluate
 * what they build. Its header names the form that would fix it.
 *
 * ONE OF THE NINE HAS A REFERENCE OF 0, which is a first here and is its
 * content rather than a defect. `the-zero-remainder-is-the-signal-not-the-answer-1`
 * asks for the remainder that ENDS the algorithm, and the whole point is that
 * the answer must not be reported as the gcd. The group below asserts that the
 * reference is 0 deliberately, because the "not 0 at its own inputs" property
 * `percent` established above would otherwise read as a rule this task breaks.
 */
t('sixty-seven tasks, and every point has at least one',
  ARITH_TASKS.length === 67 && allKnowledgePoints(A).every(p => tasksForPoint(p.id).length > 0),
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
  ARITH_TASKS.filter(x => x.kind === 'evaluate').length === 65
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
 * THE ANSWER MAY BE GIVEN IN SCIENTIFIC NOTATION, which is the one property
 * `scientific-notation`'s case for existing rests on.
 *
 * That concept teaches a FORM — write the quantity as a × 10ⁿ — and a form is
 * what `evaluate` cannot ask for: the answer is a pair, no task kind carries a
 * pair, and no `NamedForm` in forms.ts can see a power of ten. The concept
 * ships three `evaluate` tasks anyway, and the reason it is not a proxy is that
 * `ruleEvaluate` compares exact rationals rather than strings. So the learner
 * may answer `4 * 10^5` where the reference says `400000` and be marked
 * correct, and the notation under instruction is never something they have to
 * abandon to be graded.
 *
 * Asserted here rather than left to the concept's header because the property
 * belongs to the RULER, not to the tasks. A change to `ruleEvaluate` that
 * compared rendered strings would take this concept's whole justification with
 * it while every reference in tasks.ts stayed correct and every other
 * assertion in this file stayed green — the three tasks would still pass
 * `arithRulings` above, since they are checked against their own references.
 * The negative half is asserted too: a wrong exponent is still wrong, so this
 * is tolerance of NOTATION and not of value.
 */
const SCI_NOTATION_ANSWERS = [
  ['count-the-places-not-the-zeros-1', '45 * 10^-4', '45 * 10^-3'],
  ['multiply-and-renormalise-1', '4 * 10^5', '4 * 10^4'],
  ['align-before-adding-1', '6.9 * 10^7', '6.9 * 10^8'],
]
const sciRight = await Promise.all(SCI_NOTATION_ANSWERS.map(([id, ok]) =>
  ruleEvaluate(taskById(id), ok, NO_WORKER)))
const sciWrong = await Promise.all(SCI_NOTATION_ANSWERS.map(([id, , bad]) =>
  ruleEvaluate(taskById(id), bad, NO_WORKER)))
t('each of the three is answerable in the notation it teaches, not only as a plain numeral',
  sciRight.every(r => r.verdict.ruling === 'correct'),
  sciRight.map((r, i) => `${SCI_NOTATION_ANSWERS[i][0]}:${r.verdict.ruling}`).join(', '))
t('…and a mis-counted exponent is still ruled incorrect, so it is the notation that is tolerated',
  sciWrong.every(r => r.verdict.ruling === 'incorrect'),
  sciWrong.map((r, i) => `${SCI_NOTATION_ANSWERS[i][0]}:${r.verdict.ruling}`).join(', '))

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

/**
 * `euclidean-algorithm` — EVERY DIVISION IN BOTH RUNS, RE-DERIVED.
 *
 * The fortieth promotion, and the group's job is the one the three above it
 * have: a wrong worked example is the worst thing ontology-arithmetic.ts can
 * contain, `ontologyProblems` reads structure and would not notice one, and the
 * task references say nothing about the prose. So every number in the three
 * examples is recomputed here and compared against WHAT THE EXAMPLE SAYS rather
 * than against a number repeated in this file.
 *
 * This concept needs it more than most, for a reason specific to its shape: an
 * algorithm's worked example is a CHAIN, so a single wrong quotient makes every
 * line after it wrong while each line still looks locally plausible. The two
 * runs are checked step by step rather than only at their answers.
 */
group('euclidean-algorithm — every division in both runs, re-derived')
const EA = conceptById(A, 'euclidean-algorithm')
const EA_SUBGOALS = EA.knowledgePoints.flatMap(p => p.workedExample.subgoals)
const eaAnswer = i => EA.knowledgePoints[i].workedExample.answer
const EA_TASKS = EA.knowledgePoints.flatMap(p => tasksForPoint(p.id))

t('the three divisions of the first run are each right, and each quotient is the largest that fits',
  exactly('360-84*4') === '24' && exactly('84*5') === '420'
  && exactly('84-24*3') === '12' && exactly('24*4') === '96'
  && exactly('24-12*2') === '0',
  `${exactly('360-84*4')}, ${exactly('84-24*3')}, ${exactly('24-12*2')}`)
/*
 * The quotient being the LARGEST that fits is half of what makes the step a
 * division rather than any old true equation, and it is the half a chain of
 * subtractions would still satisfy. 84·5 = 420 is past 360 and 24·4 = 96 is past
 * 84, which is what the example asserts and is checked rather than read.
 */
t('each remainder sits in the window the prerequisite demands, which is why the run terminates',
  [[24, 84], [12, 24], [0, 12]].every(([r, b]) => r >= 0 && r < b))
t('the answer is the last NON-ZERO remainder, and the example says so',
  eaAnswer(0).includes('last non-zero')
  && eaAnswer(0).includes('gcd(360, 84) = 12')
  && !/gcd\(360, 84\) = 0/.test(eaAnswer(0)),
  eaAnswer(0))
/*
 * AND IT AGREES WITH THE OTHER ROUTE, which is this point's own cross-check and
 * the one claim in the concept that reaches outside it. `gcd-and-lcm`'s group
 * above asserts the same 12 from the same pair by taking minima, so these two
 * groups now check one number by two methods — which is exactly what the
 * material claims and is worth asserting in both places rather than cross
 * referencing one.
 */
t('the factorisations it cites are right and their minima give the same 12',
  exactly('2^3*3^2*5') === '360' && exactly('2^2*3*7') === '84' && exactly('2^2*3') === '12'
  && conceptById(A, 'gcd-and-lcm').knowledgePoints[0].workedExample.answer
    .includes('gcd(360, 84) = 12'))

t('the Bézout coefficients the second point derives really do give the gcd',
  exactly('360*(-3)+84*13') === '12' && exactly('13*84') === '1092' && exactly('3*360') === '1080'
  && eaAnswer(1).includes('12 = (−3)·360 + 13·84'),
  eaAnswer(1))
t('the substitution it performs collects the 84s as 1 + 3·4 = 13, which is what it says',
  exactly('1+3*4') === '13'
  && EA.knowledgePoints[1].workedExample.subgoals[2].detail.includes('1 + 12 = 13'))
t('the second pair of coefficients it offers works too, and the two changes really cancel',
  exactly('360*4+84*(-17)') === '12'
  && exactly('84/12') === '7' && exactly('360/12') === '30'
  && exactly('7*360') === '2520' && exactly('30*84') === '2520'
  && eaAnswer(1).includes('12 = 4·360 + (−17)·84'),
  eaAnswer(1))
/*
 * THE SIGN CLAIM IS AN INEQUALITY AND IS CHECKED AS ONE, because it is the only
 * statement in the concept that is about every case rather than about these
 * numbers. The example says one coefficient must be negative whenever the gcd is
 * smaller than both numbers, and the reason given is that any non-zero whole
 * multiple of either is already at least the smaller of them. Asserted over the
 * small non-negative pairs rather than argued: nothing in 0..9 × 0..9 reaches 12.
 */
t('no pair of non-negative coefficients can reach 12, which is why a sign has to be negative',
  (() => {
    for (let x = 0; x <= 9; x += 1) {
      for (let y = 0; y <= 9; y += 1) if (360 * x + 84 * y === 12) return false
    }
    return 12 < 84 && 12 < 360
  })())

t('the second run picks up from the division the prerequisite actually performs',
  exactly('2026-7*289') === '3'
  && conceptById(A, 'division-algorithm').knowledgePoints[0].workedExample.answer
    .includes('2026 = 7·289 + 3')
  && exactly('7-3*2') === '1' && exactly('3-1*3') === '0'
  && eaAnswer(2).includes('gcd(2026, 7) = 1'),
  eaAnswer(2))
t('and the coprimality it concludes is true of those two numbers',
  exactly('2*1013') === '2026'
  // 1013 is prime, which the worked example asserts; checked rather than
  // believed, since it is the one factual claim in the concept that is about a
  // number rather than about an arithmetic step.
  && (() => {
    for (let d = 2; d * d <= 1013; d += 1) if (1013 % d === 0) return false
    return true
  })()
  && 2026 % 7 !== 0)
t('its Bézout identity for the coprime pair holds',
  exactly('2026*(-2)+7*579') === '1' && exactly('579*7') === '4053' && exactly('2*2026') === '4052'
  && eaAnswer(2).includes('1 = (−2)·2026 + 579·7'))
t('the solvability test it runs really does reject 30 and accept 60',
  exactly('30-12*2') === '6' && 30 % 12 !== 0 && 60 % 12 === 0 && exactly('60/12') === '5'
  && exactly('360*(-15)+84*65') === '60'
  && exactly('-15*360') === '-5400' && exactly('65*84') === '5460'
  && eaAnswer(2).includes('60 = (−15)·360 + 65·84'),
  eaAnswer(2))

/*
 * ONE TASK'S REFERENCE IS 0 AND THAT IS ITS CONTENT, which is the shape
 * `percent`'s group had to establish a perturbation check for. The property
 * asserted there is per concept and scoped to that concept's tasks, so nothing
 * here breaks it — but a reader who met a 0 reference in this subject for the
 * first time would reasonably go looking for a rule it violates, so the
 * deliberateness is asserted rather than left to the comment in tasks.ts.
 *
 * The pairing is what makes it evidence: the task before it produces 12 and is
 * told not to call it the gcd yet, and this one produces the 0 that entitles
 * the conclusion. Both are asserted, because either alone would be the weak
 * version.
 */
t('the one task with a reference of 0 is the stopping signal, and it is paired',
  taskById('the-zero-remainder-is-the-signal-not-the-answer-1').reference === '0'
  && taskById('the-second-step-reaches-the-gcd-without-saying-so-1').reference === '12'
  && EA_TASKS.filter(x => x.reference === '0').length === 1,
  EA_TASKS.filter(x => x.reference === '0').map(x => x.id).join(', '))
/*
 * AND THE RESERVED SUBSTITUTION IS NOT RE-ASKED. (2026, 7, 289) → 3 is a task of
 * `division-algorithm`, and this concept uses that division in its own third
 * worked example — quoting it rather than re-deriving it, which is precisely the
 * situation in which a second task with the same expression, the same
 * substitution and the same answer gets written by accident. Asserted as a
 * property of the whole task list rather than of this concept's, since the
 * duplicate could be written in either place.
 */
t('no two tasks in the subject share one expression at one substitution',
  (() => {
    const key = x => `${x.given}@${JSON.stringify(x.at ?? {})}`
    const keys = ARITH_TASKS.filter(x => x.kind === 'evaluate').map(key)
    return new Set(keys).size === keys.length
  })(),
  (() => {
    const key = x => `${x.given}@${JSON.stringify(x.at ?? {})}`
    const seen = new Set()
    return ARITH_TASKS.filter(x => x.kind === 'evaluate')
      .filter(x => (seen.has(key(x)) ? true : (seen.add(key(x)), false)))
      .map(x => x.id).join(', ') || 'none repeated'
  })())

/*
 * THE TWO EDGE DECISIONS, ASSERTED AS ABSENCES WITH THEIR REASONS CHECKABLE.
 *
 * The map node carried `exercises: ['gcd-and-lcm']`, which `expandEdges` would
 * have made an `encompasses` edge, and it is declined: measured against the nine
 * tasks, not one takes a minimum of two exponents, uses gcd · lcm = a · b, or
 * touches an lcm. The second clause is that measurement rather than a restated
 * opinion — if a later task here does mention an lcm, this goes red and the
 * declination has to be re-read.
 *
 * `division-algorithm` is the stronger candidate and is also declined, at five
 * of nine. That one is asserted WITH its count, because the standard this
 * subject set (`absolute-value => negative-numbers`) is that there must be no
 * way to answer ANY task without doing the other concept's work — so the number
 * that matters is how many fail, and it is four.
 */
t('taking a gcd by division claims no credit for the factorisation route',
  !encompassedBy(A, 'euclidean-algorithm').includes('gcd-and-lcm')
  && !EA_TASKS.some(x => /lcm|minimum exponent|smaller exponent/i.test(x.prompt)),
  encompassedBy(A, 'euclidean-algorithm').join(', ') || 'nothing')
t('…nor for the division algorithm, four of its nine tasks doing no division at all',
  !encompassedBy(A, 'euclidean-algorithm').includes('division-algorithm')
  && EA_TASKS.length === 9
  && EA_TASKS.filter(x => x.given === 'n - p*k').length === 5
  && EA_TASKS.filter(x => x.given === 'a*x + b*y').length === 4,
  EA_TASKS.map(x => x.given).join(' | '))
t('and no interference was invented on a prerequisite pair',
  interferesWith(A, 'euclidean-algorithm').length === 0,
  interferesWith(A, 'euclidean-algorithm').join(', ') || 'none')

/*
 * EVERY SUBGOAL IS PHRASED AS A QUESTION, which is the thing the authored-
 * question coverage figure counts and the one property of new material that the
 * printed coverage line can move. Asserted here rather than trusted to that
 * line, because a single unphrased subgoal lowers a fraction by a fiftieth and
 * nothing names which one.
 *
 * `isInterrogative` is not used: it answers whether a LABEL reads as a question,
 * which is a different measurement (see the socratic group below). What is
 * required of a `socratic` field is that it be present, non-trivial and end in a
 * question mark — the last of which is load-bearing, since `questionCoverage`
 * scores a period-ended question at zero.
 */
t('all fifteen subgoals carry a written question, and every one ends in a question mark',
  EA_SUBGOALS.length === 15
  && EA_SUBGOALS.every(s => !!s.socratic && s.socratic.trim().endsWith('?')),
  `${EA_SUBGOALS.filter(s => !s.socratic).length} unphrased, `
  + `${EA_SUBGOALS.filter(s => s.socratic && !s.socratic.trim().endsWith('?')).length} not a question`)
t('and no question contains its own answer in the form the design note names',
  EA_SUBGOALS.every(s => !/^(Should|Do|Does|Is|Are|Can|Will) you /i.test(s.socratic.trim())),
  EA_SUBGOALS.filter(s => /^(Should|Do|Does|Is|Are|Can|Will) you /i.test(s.socratic.trim()))
    .map(s => s.label).join('; ') || 'none')
/*
 * AND EVERY SUBGOAL LABEL NAMES A MOVE, checked as the absence of the shape a
 * flat list of steps takes. The design note's claim is that a labelled example
 * teaches which move answers which question, and the failure mode is a label
 * that restates the step ("Divide 360 by 84") instead of naming what the step
 * is FOR. Not mechanically decidable in general; what is decidable is that no
 * label is bare arithmetic, which is the version of it this file can hold.
 */
t('no subgoal label is bare arithmetic standing in for a move',
  EA_SUBGOALS.every(s => s.label.length > 20 && !/^\d/.test(s.label)),
  EA_SUBGOALS.filter(s => s.label.length <= 20).map(s => s.label).join('; ') || 'all name a move')

/*
 * NO `automaticityTarget` AND NO `visualRef` ON ANY OF THE THREE, which the
 * header argues for and which is worth one assertion because both fields are
 * the kind a later pass adds for tidiness. A clock here would reward the fast
 * version of the three errors the three points exist to prevent, and no figure
 * exists, so a `visualRef` would be a placeholder — the thing types.ts says is
 * worse than an absence.
 */
t('neither a timing target nor a figure is claimed, both being absent on purpose',
  EA.knowledgePoints.every(p => p.automaticityTarget === undefined && p.visualRef === undefined))
t('and the positions restart at 1 for this concept',
  EA.knowledgePoints.map(p => p.position).join(',') === '1,2,3')

/**
 * `absolute-value` — THE CONCEPT THIS FILE'S HEADER USED TO SAY COULD NOT EXIST.
 *
 * The twentieth promotion out of `algebra-foundations`, and the first anywhere
 * chosen by disbelieving a refusal that was CORRECT when it was written.
 * ontology-arithmetic.ts declined this concept because "`exactValue` returns
 * null for a `function` node, so nothing here uses `abs`" — a true statement
 * about numerals.ts, reversed later by a `case 'function'` branch added for
 * `sqrt`, and never re-read.
 *
 * So the first assertion in this group is the mechanism itself, and it is the
 * load-bearing one: if somebody removes the `abs` branch from `exactValue`,
 * this concept's whole claim to be locally rulable goes with it and the suite
 * should say which concept broke and why, rather than reporting four
 * inconclusive tasks. The generic group above would catch the symptom; this
 * catches the cause.
 *
 * Then the mathematics of all three worked examples, re-derived here and
 * compared against WHAT THE EXAMPLE SAYS rather than against a number repeated
 * in this file — the standard the two groups above hold to, for the same
 * reason: a wrong worked example is the worst thing that file can contain and
 * no structural check would notice one.
 */
group('absolute-value — the concept an expired refusal was holding back')
const AV = conceptById(A, 'absolute-value')
const AV_SUBGOALS = AV.knowledgePoints.flatMap(p => p.workedExample.subgoals)
const avAnswer = i => AV.knowledgePoints[i].workedExample.answer
const AV_TASKS = AV.knowledgePoints.flatMap(p => tasksForPoint(p.id))

/*
 * `avExact` rather than `exactly`, and the difference is the point of having
 * it. `exactly` throws on a null value, so an assertion written with it does
 * not go RED when `exactValue` stops settling something — it kills the run at
 * that line and every assertion after it, including the ones that would name
 * the cause. This group exists to report a broken mechanism, so it must
 * survive the mechanism being broken.
 */
const avExact = src => { const v = exactValue(parseExpression(src, [])); return v === null ? null : showExact(v) }
t('exactValue settles abs exactly, which is the fact the refusal denied',
  avExact('abs(0 - 8)') === '8' && avExact('abs(8)') === '8',
  'if this is red, the concept below is no longer locally rulable and the refusal is live again')
/*
 * And that it is EXACT rather than merely non-null, which is the property the
 * subject's contract needs. A float path would pass the check above.
 */
t('…and on a fraction too, so it is the rational branch and not a numeric one',
  avExact('abs(0 - 3/7)') === '3/7' && avExact('abs(3/7)') === '3/7')

t('three points, at positions 1, 2, 3 — which restart per concept, not per subject',
  AV.knowledgePoints.length === 3
  && AV.knowledgePoints.map(p => p.position).join(',') === '1,2,3',
  AV.knowledgePoints.map(p => p.position).join(','))

/* First point: |x − 9| at x = 4 and x = 14, both branches, both answers 5. */
t('the first example\'s two inputs really do straddle 9, so the two branches are both used',
  avExact('4 - 9') === '-5' && avExact('14 - 9') === '5')
t('and both give 5, which is what it answers',
  avExact('abs(4 - 9)') === '5' && avExact('abs(14 - 9)') === '5'
  && avAnswer(0).includes('5 at both inputs'),
  avAnswer(0))
t('the distance reading it finishes on holds: both inputs are 5 from 9',
  avExact('abs(4 - 9)') === avExact('abs(14 - 9)')
  && avAnswer(0).includes('5 away from 9')
  && AV.knowledgePoints[0].workedExample.subgoals[3].detail
    .includes('|x| is |x − 0|'),
  avAnswer(0))

/* Second point: x = −5. −x = 5, |x| = 5, |x|/x = −1, |x| − x = 10. */
t('the second example\'s four numbers are the ones it states',
  avExact('0 - (0 - 5)') === '5'
  && avExact('abs(0 - 5)') === '5'
  && avExact('abs(0 - 5)/(0 - 5)') === '-1'
  && avExact('abs(0 - 5) - (0 - 5)') === '10',
  avAnswer(1))
t('…and the answer string says all four of them',
  ['−x = 5', '|x| = 5', '|x|/x = −1', '|x| − x = 10'].every(s => avAnswer(1).includes(s)),
  avAnswer(1))
/*
 * The general claim the point makes, checked at a second input rather than
 * trusted: the quotient is 1 on the positives and −1 on the negatives, and the
 * difference is 0 on the non-negatives. Those are the three facts the subgoals
 * assert about inputs the example does not use.
 */
t('the quotient is 1 on the positives and the difference 0, which is the half the example claims without showing',
  avExact('abs(5)/5') === '1' && avExact('abs(5) - 5') === '0'
  && avExact('abs(0 - 5)/(0 - 5)') === '-1')
t('and |x| − x is twice the size at a negative input, not merely nonzero',
  avExact('abs(0 - 5) - (0 - 5)') === avExact('2*abs(0 - 5)'))

/* Third point: a = −4, b = 7. Both subtractions give 11; 4 + 7 = 11. */
t('the third example\'s two subtractions are the stated −11 and 11',
  avExact('(0 - 4) - 7') === '-11' && avExact('7 - (0 - 4)') === '11')
t('so both absolute values are 11, which is what it answers',
  avExact('abs((0 - 4) - 7)') === '11' && avExact('abs(7 - (0 - 4))') === '11'
  && avAnswer(2).includes('11 both ways'),
  avAnswer(2))
t('and the gap really is the SUM of the two distances from zero, since they are on opposite sides',
  avExact('abs(0 - 4) + abs(7)') === '11' && avAnswer(2).includes('4 + 7 = 11'),
  avAnswer(2))
/*
 * The contrast the last subgoal draws — same side, so a difference instead —
 * checked because it is the one number in this concept's prose that is not in
 * any `answer` string and therefore not pinned by the assertions above.
 */
t('while two numbers on the same side give a difference: between 4 and 7 the gap is 3',
  avExact('abs(4 - 7)') === '3'
  && AV.knowledgePoints[2].workedExample.subgoals[3].detail.includes('the gap is 3'))

/**
 * THE TASKS, AND THE MEASUREMENT THE CREDIT EDGE RESTS ON.
 *
 * `absolute-value => negative-numbers` is the first `encompasses` edge in this
 * subject to be ADDED rather than declined, and the rule it had to meet is the
 * one that killed the other three: the claim is about what practising
 * exercises, measured against the tasks actually shipped. The measurement is
 * that the argument of every `abs` in the concept is NEGATIVE at that task's
 * own stated inputs — so there is no way to answer any of the four without
 * doing signed arithmetic.
 *
 * Asserted by computing the argument rather than by reading the inputs,
 * because the strongest case is the task whose inputs are both POSITIVE:
 * `abs-two-branches-1` is 2 and 9, and the signed arithmetic is 2 − 9. A check
 * on the `at` values would have missed it and would have looked like it
 * passed.
 */
const absArgument = task => {
  const symbols = task.variables.map(v => v.name)
  const at = {}
  for (const [name, raw] of Object.entries(task.at)) at[name] = parseExpression(raw, [])
  const find = node => {
    if (node.kind === 'function' && node.name === 'abs') return node.args[0]
    for (const child of [
      ...(node.args ?? []), node.operand, node.left, node.right,
      node.numerator, node.denominator, node.base, node.exponent,
    ]) {
      if (!child) continue
      const hit = find(child)
      if (hit) return hit
    }
    return null
  }
  const arg = find(parseExpression(task.given, symbols))
  return arg === null ? null : exactValue(substitute(arg, at))
}
t('four tasks: two on the middle point, one on each of the others',
  AV_TASKS.length === 4
  && tasksForPoint(AV.knowledgePoints[0].id).length === 1
  && tasksForPoint(AV.knowledgePoints[1].id).length === 2
  && tasksForPoint(AV.knowledgePoints[2].id).length === 1,
  AV.knowledgePoints.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
t('every one of them puts an `abs` in its given, which no task in the build did before',
  AV_TASKS.every(x => /\babs\(/.test(x.given)),
  AV_TASKS.map(x => `${x.id}:${x.given}`).join(' '))
t('and the argument of every one is NEGATIVE at its own inputs — the measurement the credit edge rests on',
  AV_TASKS.every(x => {
    const v = absArgument(x)
    return v !== null && v.n < 0n
  }),
  AV_TASKS.map(x => `${x.id}:${(() => { const v = absArgument(x); return v ? showExact(v) : 'null' })()}`).join(' '))
t('including the one whose stated inputs are both positive, which an `at` check would have passed',
  (() => {
    const x = taskById('abs-two-branches-1')
    return Object.values(x.at).every(raw => exactValue(parseExpression(raw, [])).n > 0n)
      && absArgument(x).n < 0n
  })(),
  'inputs 2 and 9; argument 2 − 9')
t('so the credit edge is carried, unlike the three this subject declined',
  encompassedBy(A, 'absolute-value').includes('negative-numbers')
  && prerequisitesOf(A, 'absolute-value').includes('negative-numbers'),
  encompassedBy(A, 'absolute-value').join(', '))
/*
 * The interference that was checked for and NOT declared. The map node carried
 * no `confusedWith`, so nothing was stranded — and none was invented during the
 * promotion either, because these two are in a prerequisite relation and
 * `interferes_with` would forbid the session that teaches them together.
 * Asserted so the absence reads as a decision rather than as an omission,
 * which is the shape the stranding no test catches would otherwise hide in.
 */
t('and no interference was invented between a concept and its own prerequisite',
  !A.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'absolute-value' || e.to === 'absolute-value')),
  A.edges.filter(e => e.kind === 'interferes_with').map(e => `${e.from}~${e.to}`).join(' '))
/*
 * And the task that is deliberately NOT here. The third point's claim is
 * |a − b| = |b − a|, whose direct ask is `abs(a - b) - abs(b - a)` — and that
 * is 0 at every pair of inputs, so a learner writing 0 unread is marked
 * correct. A reference that does not move when the inputs move is not
 * evidence. Asserted as the property rather than as "no such task exists",
 * since the property is the reason and would catch the same mistake made with
 * a different expression.
 */
t('no task in the concept has a reference that is 0 regardless of its inputs',
  AV_TASKS.every(x => avExact(x.reference) !== '0'),
  AV_TASKS.map(x => `${x.id}:${x.reference}`).join(' '))
t('…though the symmetry it would have asked about does hold at that task\'s own inputs',
  avExact('abs((0 - 9) - 6)') === avExact('abs(6 - (0 - 9))')
  && avExact('abs((0 - 9) - 6)') === taskById('abs-distance-between-1').reference)

/* Every subgoal asked as a question, the standard this subject now holds to. */
t('twelve subgoals across the three worked examples', AV_SUBGOALS.length === 12,
  `${AV_SUBGOALS.length}`)
t('every subgoal carries an authored socratic phrasing',
  AV_SUBGOALS.every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  AV_SUBGOALS.filter(s => !s.socratic).map(s => s.label).join(', '))
t('and every one of them is actually phrased as a question',
  AV_SUBGOALS.every(s => isInterrogative(s.socratic)),
  AV_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join(', '))
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  AV_SUBGOALS.every(s => !isInterrogative(s.label)))
/*
 * One timing target, on the first point only, and the absences are the claim.
 * Reading |−6| quickly is a real automaticity; realising that −x is the
 * positive one is not a speed skill, and a target there would measure typing.
 * The third point gets one because computing a gap is a fluency.
 */
t('the middle point carries no automaticity target, and the other two do',
  AV.knowledgePoints[1].automaticityTarget === undefined
  && typeof AV.knowledgePoints[0].automaticityTarget === 'number'
  && typeof AV.knowledgePoints[2].automaticityTarget === 'number',
  AV.knowledgePoints.map(p => `${p.position}:${p.automaticityTarget ?? 'none'}`).join(' '))
/*
 * Every objective names a kind this concept actually SHIPS. 28 objectives
 * elsewhere in the build name `justify`, of which zero exist as tasks — an
 * objective naming a kind nothing serves is the "complete but unreachable"
 * failure types.ts warns about, one step removed. This concept names only
 * `evaluate`, and the assertion is what keeps that true of it.
 */
t('every objective names only task kinds the concept actually ships',
  AV.objectives.length === 3 && AV.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => AV_TASKS.some(x => x.kind === k))),
  AV.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))

/**
 * `percent` — the fourteenth concept, and the two things it is here to pin.
 *
 * The arithmetic of all three worked examples is re-derived rather than read,
 * for the reason `prime-factorisation`'s group gives: a wrong worked example is
 * the worst thing these files can contain and the only thing no structural
 * check would notice. Every assertion below reads the AUTHORED string and
 * compares it against a computed value, so repeating a number in this file
 * cannot make it pass.
 *
 * And the two judgements the promotion made by declining something. Both are
 * absences, so both would read as omissions if nothing asserted them — which is
 * the shape the stranding no suite catches hides in.
 */
group('percent — the ratio with its denominator fixed')
const PC = conceptById(A, 'percent')
const PC_SUBGOALS = PC.knowledgePoints.flatMap(p => p.workedExample.subgoals)
const pcAnswer = i => PC.knowledgePoints[i].workedExample.answer
const PC_TASKS = PC.knowledgePoints.flatMap(p => tasksForPoint(p.id))
const pcExact = src => { const v = exactValue(parseExpression(src, [])); return v === null ? null : showExact(v) }

t('three points, at positions 1, 2, 3 — which restart per concept, not per subject',
  PC.knowledgePoints.length === 3
  && PC.knowledgePoints.map(p => p.position).join(',') === '1,2,3',
  PC.knowledgePoints.map(p => p.position).join(','))

/*
 * The scope pattern's near-miss, which is the one claim its comment makes that
 * is worth testing rather than arguing. `/^percent(age)?\b/i` has to take
 * "Percentage point" and reject "Percentile", and the whole of the difference
 * is that there is no word boundary between the `t` and the `i`. Carried
 * verbatim from the map node, so this also pins that the promotion did not
 * widen recognition while nobody was looking.
 */
t('the pattern takes the titles that ARE this concept',
  ['Percent', 'Percentage', 'Percentage point'].every(s => PC.scope.match.test(s)))
t('…and rejects the quantile that merely starts the same way',
  !PC.scope.match.test('Percentile') && !PC.scope.match.test('Percentiles'))
t('…and is anchored, so a ratio that mentions one in passing is not it',
  !PC.scope.match.test('Likelihood-ratio test gives a percentage'))
t('and its fidelity claim is what the option can actually do',
  PC.fidelity === 'checked' && PC.caveat === undefined
  && fidelityMismatches(A).length === 0)

/*
 * EVERY STATED NUMBER IS INTERPOLATED FROM A COMPUTED ONE, never typed twice.
 *
 * This matters more than it looks and the first draft of this group got it
 * wrong. `pcAnswer(1).includes('84 · 5/4 = ')` with the value left off, or
 * `includes('84 · 5/4 = 105')` with the 105 typed here, both pass when the
 * authored answer is changed to 106 — the first because it never reads the
 * value and the second because the literal in this file agrees with the
 * arithmetic rather than with the prose. Fault injection found it: changing the
 * answer string to 106 left both suites green.
 *
 * The form that bites is a template: compute, then require the authored string
 * to contain what was computed. Then the only way to pass is for the prose and
 * the arithmetic to agree, which is the thing worth guarding.
 *
 * `pcExact` parses decimals exactly, so an authored "£100.80" can be compared
 * against a computed 504/5 by parsing the authored spelling rather than by
 * converting it here. That is what the decimal bridges below do.
 */

/* First point: 60% of 30 and of 45. 60/100 = 3/5; 18 and 27; both check back. */
t('the first example\'s percent really is the fraction it claims',
  pcExact('60/100') === '3/5' && pcExact('0.6') === pcExact('60/100')
  && PC.knowledgePoints[0].workedExample.subgoals[0].detail
    .includes(`60/100 = ${pcExact('60/100')} = 0.6`),
  PC.knowledgePoints[0].workedExample.subgoals[0].detail)
t('and 3/5 of the two bases gives the two numbers the answer states',
  pcAnswer(0).includes(`30 · 3/5 = ${pcExact('30*3/5')}`)
  && pcAnswer(0).includes(`45 · 3/5 = ${pcExact('45*3/5')}`),
  `${pcExact('30*3/5')} and ${pcExact('45*3/5')} | ${pcAnswer(0)}`)
t('and both answers check back against the definition, which is the subgoal\'s claim',
  pcExact('18/30') === pcExact('60/100') && pcExact('27/45') === pcExact('60/100')
  && PC.knowledgePoints[0].workedExample.subgoals[2].detail
    .includes(`18/30 = ${pcExact('18/30')}`)
  && PC.knowledgePoints[0].workedExample.subgoals[2].detail
    .includes(`27/45 = ${pcExact('27/45')}`),
  PC.knowledgePoints[0].workedExample.subgoals[2].detail)
t('…so the point it finishes on holds: a third pair satisfies the same percent',
  pcExact('3/5') === pcExact('18/30') && pcAnswer(0).includes('3 out of 5'),
  pcAnswer(0))

/* Second point: 20% off leaves 84. Original 105, not 100.80. */
t('the second example\'s discount factor undoes to the price it states',
  pcAnswer(1).includes(`84 · 5/4 = ${pcExact('84*5/4')}`)
  && PC.knowledgePoints[1].workedExample.subgoals[1].detail
    .includes(`84 · 5/4 = ${pcExact('84*5/4')}`),
  `84 · 5/4 = ${pcExact('84*5/4')} | ${pcAnswer(1)}`)
t('and the forward check it runs really does re-derive the given',
  pcExact('105 - 20*105/100') === '84'
  && pcAnswer(1).includes(`20% of 105 is ${pcExact('20*105/100')}`)
  && pcAnswer(1).includes(`105 − ${pcExact('20*105/100')} = 84`),
  pcAnswer(1))
t('the wrong move lands where the example says, which is not the answer',
  pcExact('100.80') === pcExact('84*6/5') && pcExact('84*6/5') !== pcExact('84*5/4')
  && pcAnswer(1).includes('£100.80'),
  `84 · 6/5 = ${pcExact('84*6/5')}, authored as 100.80 = ${pcExact('100.80')}`)
t('…and taking 20% off THAT fails to come back to 84, which is why it is wrong',
  pcExact('80.64') === pcExact('(84*6/5)*4/5') && pcExact('(84*6/5)*4/5') !== '84'
  && pcAnswer(1).includes('£80.64'),
  `20% off 100.80 = ${pcExact('(84*6/5)*4/5')}, authored as 80.64 = ${pcExact('80.64')}`)
t('and the two bases the subgoal names carry the two amounts it names',
  pcExact('16.80') === pcExact('20*84/100')
  && PC.knowledgePoints[1].workedExample.subgoals[2].detail
    .includes(`£${pcExact('20*105/100')}`)
  && PC.knowledgePoints[1].workedExample.subgoals[2].detail.includes('£16.80'),
  `20% of 105 = ${pcExact('20*105/100')}, 20% of 84 = ${pcExact('20*84/100')}`)

/* Third point: +20% then −20% on 50. Net ×24/25, finishing at 48, down 4%. */
t('the third example\'s two factors multiply to the one it states',
  pcAnswer(2).includes(`× ${pcExact('6/5*4/5')} = 96%`)
  && pcExact('6/5*4/5') === pcExact('0.96'),
  `6/5 · 4/5 = ${pcExact('6/5*4/5')} | ${pcAnswer(2)}`)
t('and stepping through the money gives the price it finishes on',
  pcAnswer(2).includes(`50 → ${pcExact('50*6/5')} → ${pcExact('50*6/5*4/5')}`)
  && pcExact('50*6/5*4/5') === '48',
  `50 → ${pcExact('50*6/5')} → ${pcExact('50*6/5*4/5')}`)
t('the order really is immaterial, which the answer claims in both forms',
  pcExact('4/5*6/5') === pcExact('6/5*4/5') && pcExact('50*4/5*6/5') === pcExact('50*6/5*4/5')
  && pcAnswer(2).includes(`4/5 · 6/5 is the same ${pcExact('4/5*6/5')}`),
  pcAnswer(2))
t('the percentage it reports is the loss it computes, not a figure beside it',
  pcAnswer(2).includes(`£${pcExact('50 - 50*6/5*4/5')} lost`)
  && pcAnswer(2).includes(`${pcExact('100*(50 - 50*6/5*4/5)/50')}% of £50`),
  `loss ${pcExact('50 - 50*6/5*4/5')}, which is ${pcExact('100*(50 - 50*6/5*4/5)/50')}% of 50`)
t('and the loss is exactly the gap between the two bases\' 20%s',
  pcExact('20*60/100 - 20*50/100') === pcExact('50 - 50*6/5*4/5')
  && pcAnswer(2).includes(`20% of £50 = £${pcExact('20*50/100')}`)
  && pcAnswer(2).includes(`20% of £60 = £${pcExact('20*60/100')}`),
  `${pcExact('20*50/100')} vs ${pcExact('20*60/100')}, gap ${pcExact('20*60/100 - 20*50/100')}`)
/*
 * The general condition in the last subgoal, which is the only claim in this
 * concept that is not about the specific numbers — so it is checked by
 * substituting it back, not by re-stating it. q = 100p/(100 + p) at p = 20
 * multiplied into the rise factor must give exactly 1, and that is the whole
 * claim; the particular value is interpolated from the same expression the
 * subgoal spells out.
 */
t('the undoing fall the last subgoal derives is the one that actually undoes it',
  pcExact('6/5*(1 - (100*20/(100 + 20))/100)') === '1'
  && pcAnswer(2).includes(`100 · 20/120 = ${pcExact('100*20/(100 + 20)')}`),
  `q = ${pcExact('100*20/(100 + 20)')},`
  + ` and 6/5 · (1 − q/100) = ${pcExact('6/5*(1 - (100*20/(100 + 20))/100)')}`)
t('…and it really is the SMALLER percentage, which is the claim that generalises',
  (() => {
    const q = exactValue(parseExpression('100*20/(100 + 20)', []))
    // q < 20 as exact rationals: q.n/q.d < 20, i.e. q.n < 20 * q.d.
    return q !== null && q.n < 20n * q.d
  })()
  && PC.knowledgePoints[2].workedExample.subgoals[3].detail.includes('always less than p'),
  `q = ${pcExact('100*20/(100 + 20)')} against p = 20`)

t('three tasks, one on each point', PC_TASKS.length === 3
  && PC.knowledgePoints.every(p => tasksForPoint(p.id).length === 1),
  PC.knowledgePoints.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
/*
 * NO TASK HERE HAS AN INPUT-INDEPENDENT REFERENCE, which is the trap
 * `absolute-value` above had to ship a second task to get out of and the reason
 * this concept needed none.
 *
 * Asserted by PERTURBING each task's own `at` and requiring the value to move,
 * rather than by checking the reference is non-zero. Those are different
 * claims: `abs(a - b) - abs(b - a)` is 0 at every input, and an expression that
 * happened to be 7 at every input would pass a non-zero check while being just
 * as answerable without the content.
 *
 * The third task is why this had to be a perturbation check and not "no
 * reference is 0". Its reference IS 0 at q = 20, because (100+p)(100−q) = 10000
 * is exactly the undoing condition — which is content rather than a defect, and
 * the prompt says so. A blanket "never 0" rule would have forbidden the best
 * task in the concept.
 */
const pcMoves = task => {
  const symbols = task.variables.map(v => v.name)
  const valueAt = table => {
    const at = {}
    for (const [name, raw] of Object.entries(table)) at[name] = parseExpression(raw, [])
    const v = exactValue(substitute(parseExpression(task.given, symbols), at))
    return v === null ? null : showExact(v)
  }
  const base = valueAt(task.at)
  // One variable at a time, so a hit names which one the answer depends on.
  return task.variables.every(v => {
    const bumped = { ...task.at, [v.name]: String(Number(task.at[v.name]) + 1) }
    const moved = valueAt(bumped)
    return base !== null && moved !== null && moved !== base
  })
}
t('every task\'s answer moves when any one of its inputs moves',
  PC_TASKS.every(pcMoves),
  PC_TASKS.filter(x => !pcMoves(x)).map(x => x.id).join(', ') || 'all three depend on every variable')
t('…and the third one is 0 at the fall that DOES undo the rise, which is its content',
  (() => {
    const x = taskById('equal-rises-and-falls-1')
    const at = {}
    for (const [n, raw] of Object.entries({ ...x.at, q: '20' })) at[n] = parseExpression(raw, [])
    const undone = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    return showExact(undone) === '0' && x.reference === '-4' && /q = 20/.test(x.prompt)
  })(),
  'at q = 25 the reference is −4; at q = 20 the same expression is 0')
t('each task uses different numbers from its own worked example, so it is not a recall',
  tasksForPoint(PC.knowledgePoints[0].id).every(x => x.at.p === '35')
  && tasksForPoint(PC.knowledgePoints[1].id).every(x => x.at.p === '10')
  && tasksForPoint(PC.knowledgePoints[2].id).every(x => x.at.p === '25'),
  PC_TASKS.map(x => `${x.id}:${JSON.stringify(x.at)}`).join(' '))

/*
 * BOTH stranded edges restated inside this subject, which is what made the
 * promotion cheap — and the measurement rather than the claim, since `percent`
 * naming two concepts of one file is the property that cannot recur in that
 * area. Checked as prerequisites OF the concept, in THIS ontology, because that
 * is where they had to land for `algebra-foundations` to need no `links` entry.
 */
t('both of its own edges live in this subject, so neither crossed a boundary',
  prerequisitesOf(A, 'percent').slice().sort().join(' ') === 'decimal-representation ratio-and-rate'
  && ['ratio-and-rate', 'decimal-representation'].every(id => conceptById(A, id) !== undefined),
  prerequisitesOf(A, 'percent').join(', '))
t('and it is teachable and practisable, which a restated edge is no use without',
  isTeachable(A, 'percent') && isPractisable(A, 'percent'))
/*
 * THE INTERFERENCE THAT WAS ASKED FOR BY NAME AND DECLINED.
 *
 * This is the one absence in the build that somebody specifically requested a
 * decision on: the note beside `ratio-and-rate`'s stranded edge in
 * ontology-arithmetic.ts ends "Whoever promotes `percent` should look at the
 * pair again from that end", because an ontology may only name concepts it
 * contains and the far end was a map node. The answer is no, for the reason
 * `absolute-value ~ negative-numbers` is also absent — these two are in a
 * PREREQUISITE relation, and `interferes_with` is a hard constraint that would
 * forbid the session teaching them in their intended order.
 *
 * Asserted as the pair rather than as one, because the rule is now the
 * subject's and not a one-off: no interference anywhere in this file runs
 * between a concept and its own prerequisite.
 */
t('no interference was invented between percent and the ratio it specialises',
  !A.edges.some(e => e.kind === 'interferes_with'
    && (e.from === 'percent' || e.to === 'percent')),
  A.edges.filter(e => e.kind === 'interferes_with').map(e => `${e.from}~${e.to}`).join(' '))
t('and that is the subject\'s rule now, not a judgement about this pair alone',
  A.edges.filter(e => e.kind === 'interferes_with').every(e =>
    !prerequisitesOf(A, e.to).includes(e.from) && !prerequisitesOf(A, e.from).includes(e.to)),
  A.edges.filter(e => e.kind === 'interferes_with').map(e => `${e.from}~${e.to}`).join(' '))
/*
 * And the credit edge declined, with the measurement that declined it. The
 * standard is what PRACTISING exercises, read off the shipped tasks: two of the
 * three scale by a factor and so do something `ratio-and-rate` is about, and
 * `percent-of-a-stated-base-1` does not — it is one multiplication and one
 * division with no factor in it at all. Two of three is not enough, because an
 * encompasses edge stops a concept coming due and a learner who practised only
 * the third would be credited for ratios on evidence containing none.
 *
 * Asserted on the two-of-three split rather than on the edge's absence alone,
 * so that adding a factor to the first task — which is what would make the edge
 * correct — turns this red and sends the next reader to the argument.
 */
t('the credit edge is declined, and exactly two of the three tasks earn it',
  !encompassedBy(A, 'percent').includes('ratio-and-rate')
  && PC_TASKS.filter(x => /\(100 [-+] [pq]\)/.test(x.given)).length === 2,
  `${PC_TASKS.filter(x => /\(100 [-+] [pq]\)/.test(x.given)).map(x => x.id).join(' ')}`
  + ` | encompasses: ${encompassedBy(A, 'percent').join(', ') || 'none'}`)

/* Every subgoal asked as a question, the standard this subject holds to. */
t('twelve subgoals across the three worked examples', PC_SUBGOALS.length === 12,
  `${PC_SUBGOALS.length}`)
t('every subgoal carries an authored socratic phrasing',
  PC_SUBGOALS.every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  PC_SUBGOALS.filter(s => !s.socratic).map(s => s.label).join(', '))
/*
 * The type guard is load-bearing, not belt-and-braces. `isInterrogative` calls
 * `trimEnd()` on what it is given, so it THROWS on a missing socratic rather
 * than returning false — and a missing socratic is precisely what the assertion
 * above exists to report. Without the guard, deleting one turns that red into a
 * red followed by a crash, which takes every assertion after it in the file.
 * Found by injecting exactly that fault. The same null-unsafety is in the
 * `absolute-value` group above and in several others; it is left alone here
 * because fixing it is not this promotion's change, but it is the same bug.
 */
t('and every one of them is actually phrased as a question',
  PC_SUBGOALS.every(s => typeof s.socratic === 'string' && isInterrogative(s.socratic)),
  PC_SUBGOALS.filter(s => typeof s.socratic !== 'string' || !isInterrogative(s.socratic))
    .map(s => s.label).join(', '))
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  PC_SUBGOALS.every(s => !isInterrogative(s.label)))
t('every subgoal says which move it makes AND what the move establishes',
  PC_SUBGOALS.every(s => s.label.length > 0 && s.detail.length > 0))
/*
 * No timing target on any of the three, and that is the claim rather than a
 * copy of the neighbours. Each of these points is a read-it-slowly one: the
 * first error is reading the percent as the amount, the second is multiplying
 * where you should divide, and the third is believing equal percentages cancel.
 * A speed reward on any of them trains reaching for the number already written
 * down. The arithmetic underneath is multiplication and division of whole
 * numbers, which `place-value` already times.
 */
t('no point here is timed, every one of them being a read-it-slowly point',
  PC.knowledgePoints.every(p => p.automaticityTarget === undefined),
  PC.knowledgePoints.map(p => `${p.position}:${p.automaticityTarget ?? 'none'}`).join(' '))
t('and none claims a figure that does not exist',
  PC.knowledgePoints.every(p => p.visualRef === undefined))
/*
 * Every objective names a kind this concept actually SHIPS, which is the
 * standard `absolute-value` introduced and this is the second concept to hold.
 * The three concepts before those two name `justify` as well, of which the
 * build contains zero tasks — so this is the assertion that keeps the newer
 * convention from drifting back.
 */
t('every objective names only task kinds the concept actually ships',
  PC.objectives.length === 3 && PC.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => PC_TASKS.some(x => x.kind === k))),
  PC.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))
t('…and `justify` is not among them, there being no such task anywhere in the build',
  PC.objectives.every(o => !o.taskKinds.includes('justify'))
  && !PC_TASKS.some(x => x.kind === 'justify'))

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
t('five concepts, fifteen knowledge points',
  VE.concepts.length === 5 && allKnowledgePoints(VE).length === 15,
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
t('and so is the nonlinear system, the first concept here no file had argued against',
  isTeachable(VE, 'nonlinear-systems')
  && isPractisable(VE, 'nonlinear-systems'))
/*
 * THE FIFTH CONCEPT IS `guided`, WHICH IS THE FIRST TIME THIS SUBJECT HAS
 * SHIPPED ONE, AND THE CAVEAT IS WHAT MAKES THAT HONEST.
 *
 * The four concepts above each carried a `match` verbatim from the map node
 * they were promoted out of. This node never had one, and the right answer is
 * `guided` with a caveat rather than a pattern written during an authoring pass
 * — `fidelityMismatches` already refuses the other combination, so what is
 * asserted here is the half it cannot see: that the caveat exists and is a
 * sentence rather than a placeholder, since types.ts says it is printed
 * VERBATIM to the learner.
 *
 * The specific reason is worth asserting too, because it is the one a later
 * reader would be most tempted to "fix": "Nonlinear system" IS an article
 * title and it is about nonlinear DYNAMICS, so a pattern on the name would
 * claim the wrong page confidently. A test cannot check what an encyclopaedia
 * contains; what it can check is that the concept makes no `checked` claim
 * while having no pattern to back one with.
 */
t('the fifth concept claims only guided recognition, and says in a caveat why',
  (() => {
    const c = VE.concepts.find(x => x.id === 'nonlinear-systems')
    return c.fidelity === 'guided' && c.scope.match === undefined
      && typeof c.caveat === 'string' && c.caveat.length > 120
      && VE.concepts.filter(x => x.fidelity === 'guided').length === 1
  })(),
  VE.concepts.map(c => `${c.id}:${c.fidelity}${c.scope.match ? '+match' : ''}`).join(' '))
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
t('it declares five edges, four of them prerequisites, and the reading is still the root',
  VE.edges.length === 5
  && VE.edges.filter(e => e.kind === 'prerequisite').length === 4
  && roots(VE).length === 1 && roots(VE)[0] === 'variables-and-expressions',
  `${VE.edges.length} edge(s), roots: ${roots(VE).join(', ')}`)
t('and all four are edges the promoted nodes arrived carrying, each pointing the way it was written',
  [['variables-and-expressions', 'linear-equations'],
    ['linear-equations', 'systems-of-linear-equations'],
    ['systems-of-linear-equations', 'gaussian-elimination'],
    ['systems-of-linear-equations', 'nonlinear-systems']].every(([from, to]) => {
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
 * And the order, as a walk rather than as a string — WHICH IS NO LONGER THE
 * SAME CLAIM, because the subject has stopped being a chain.
 *
 * This read `teachingOrder(VE).join(' ') === 'variables-and-expressions
 * linear-equations systems-of-linear-equations gaussian-elimination'`, and that
 * was a correct statement about four concepts in a line. The forty-third
 * promotion forked it: `nonlinear-systems` hangs off
 * `systems-of-linear-equations` alongside `gaussian-elimination` rather than
 * behind it, so there are TWO valid teaching orders and `teachingOrder`
 * returning one of them says nothing about which parent the new concept is
 * under. An ordered string would have accepted this concept hung off the row
 * reduction by accident, and three unknowns have nothing to do with a line
 * meeting a circle.
 *
 * So the claim is split into the two halves that are still decidable:
 *
 *  - THE SPINE, as a relative order rather than a sequence. Each of the three
 *    chain links comes before what it feeds, whatever order the fork is walked
 *    in. That is the part the `covers` paragraph claims about itself and the
 *    part that fails loudly if an edge is reversed — which the edge checks
 *    above cannot catch, a backwards edge still being an edge between the
 *    right pair.
 *  - THE BRANCH POINT, by name. `nonlinear-systems` comes after the system and
 *    is NOT downstream of the row reduction, asserted in both directions
 *    because "after the system" alone is satisfied by hanging it off the row
 *    reduction too.
 */
const veOrderOf = id => teachingOrder(VE).indexOf(id)
t('the spine is still in the order the subject claims to teach it, however the fork is walked',
  veOrderOf('variables-and-expressions') < veOrderOf('linear-equations')
  && veOrderOf('linear-equations') < veOrderOf('systems-of-linear-equations')
  && veOrderOf('systems-of-linear-equations') < veOrderOf('gaussian-elimination')
  && teachingOrder(VE).length === 5,
  teachingOrder(VE).join(' '))
t('and the fifth concept branches off the SYSTEM specifically, not off the row reduction',
  veOrderOf('systems-of-linear-equations') < veOrderOf('nonlinear-systems')
  && prerequisitesOf(VE, 'nonlinear-systems').join(' ') === 'systems-of-linear-equations'
  && !prerequisitesOf(VE, 'nonlinear-systems').includes('gaussian-elimination')
  && !prerequisitesOf(VE, 'gaussian-elimination').includes('nonlinear-systems'),
  `${prerequisitesOf(VE, 'nonlinear-systems').join(', ') || 'nothing'} -> nonlinear-systems`)

group('the seventh subject is gradable with no worker')
const VE_TASKS = allKnowledgePoints(VE).flatMap(p => tasksForPoint(p.id))
t('thirty-three tasks across the fifteen points', VE_TASKS.length === 33, `${VE_TASKS.length}`)
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
t('fifty-eight questions, one per subgoal', VE_QUESTIONS.length === 58, `${VE_QUESTIONS.length}`)
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
 *
 * AND IT WENT RED A SECOND TIME, ON THE SAME KIND OF SUCCESS AND FOR A DEEPER
 * REASON THAN THE FIRST. "Walked in teaching order" was a stand-in for "walked
 * up the prerequisite chain" and the two are the same walk only while the
 * subject IS a chain. The forty-third promotion forked it: `nonlinear-systems`
 * rests on `systems-of-linear-equations` and not on `gaussian-elimination`, so
 * `teachingOrder` puts it after the row reduction while the mathematics puts it
 * beside it, and comparing its 25 to the row reduction's 30 compares two
 * concepts that are not above and below each other at all.
 *
 * So the comparison now follows the PREREQUISITE, which is what the reason this
 * assertion gives always described: each concept's timed minimum is at least
 * the timed maximum of the concept or concepts it actually rests on inside this
 * subject. That holds across a fork by construction — both branches are
 * measured against their shared parent and never against each other — and it
 * still catches the thing worth catching, a concept timed faster than its own
 * prerequisite. The spine satisfies it at 20 → 20 → 25, and both branches off
 * the system satisfy it at 25: the row reduction's 25 and the nonlinear
 * systems' 25 are each no faster than the system's own 25.
 *
 * A one-sided ratchet went red twice, and the pattern in both failures is the
 * same: the assertion was implemented against a SHAPE the subject happened to
 * have rather than against the reason the claim was true. The fix each time was
 * to say the reason.
 */
t('timing never drops along a prerequisite — no concept is timed faster than what it rests on',
  (() => {
    const timedOf = id => VE.concepts.find(c => c.id === id).knowledgePoints
      .map(p => p.automaticityTarget).filter(v => v !== undefined)
    return VE.concepts.every(c => {
      const mine = timedOf(c.id)
      if (mine.length === 0) return true
      return prerequisitesOf(VE, c.id).every(p => {
        const theirs = timedOf(p)
        return theirs.length === 0 || Math.min(...mine) >= Math.max(...theirs)
      })
    })
  })(),
  VE.concepts.map(c => `${c.id}:${c.knowledgePoints
    .map(p => p.automaticityTarget ?? '-').join('/')}`).join(' '))
/*
 * And the fork measured rather than described, because the paragraph above
 * rests on it: the two branches are timed against their shared parent, so the
 * assertion above would pass even if they disagreed with each other — and here
 * they do not disagree, which is worth pinning so that a later edit to one
 * branch's figure is visible as a choice rather than as drift.
 */
t('and the two branches off the system are timed against it rather than against each other',
  Math.min(...VE.concepts.find(c => c.id === 'gaussian-elimination').knowledgePoints
    .map(p => p.automaticityTarget).filter(v => v !== undefined)) === 25_000
  && Math.min(...VE.concepts.find(c => c.id === 'nonlinear-systems').knowledgePoints
    .map(p => p.automaticityTarget).filter(v => v !== undefined)) === 25_000
  && Math.max(...SYSTEM_CONCEPT.knowledgePoints
    .map(p => p.automaticityTarget).filter(v => v !== undefined)) === 25_000,
  VE.concepts.filter(c => prerequisitesOf(VE, c.id).includes('systems-of-linear-equations'))
    .map(c => `${c.id}:${c.knowledgePoints.map(p => p.automaticityTarget ?? '-').join('/')}`)
    .join(' '))
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
  'circle-measure', 'distance-and-midpoint', 'isometries-and-symmetry',
  'plane-transformations',
]
t('thirteen concepts, three knowledge points each',
  PG.concepts.length === 13 && allKnowledgePoints(PG).length === 39
  && PG.concepts.every(c => c.knowledgePoints.length === 3),
  `${PG.concepts.length} concepts, ${allKnowledgePoints(PG).length} points`)
t('all thirteen concepts are teachable AND practisable — a syllabus, not thirteen map entries',
  PG_CONCEPT_IDS.every(id => isTeachable(PG, id) && isPractisable(PG, id)),
  PG_CONCEPT_IDS.filter(id => !isTeachable(PG, id) || !isPractisable(PG, id)).join(', '))
t('and the list is the whole subject, so a concept cannot be added without being named here',
  PG.concepts.map(c => c.id).slice().sort().join(',')
    === PG_CONCEPT_IDS.slice().sort().join(','),
  PG.concepts.map(c => c.id).filter(id => !PG_CONCEPT_IDS.includes(id)).join(', '))
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
  PG_PREREQS.length === 15
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
t('and the eighth widens the congruence fork without adding a branch point',
  PG_PREREQS.filter(e => e.from === 'congruence').map(e => e.to).sort().join(',')
    === 'geometric-proof,isometries-and-symmetry,plane-transformations,'
      + 'quadrilaterals-and-polygons,similarity'
  && PG_PREREQS.filter(e => e.to === 'geometric-proof').map(e => e.from).join(',') === 'congruence'
  && PG_PREREQS.filter(e => e.from === 'geometric-proof').length === 1,
  PG_PREREQS.map(e => `${e.from}->${e.to}`).join(' '))
/*
 * THE TWELFTH PROMOTION WIDENED THAT SAME FORK TO FOUR, which is why the
 * assertion above holds the named set and why its title no longer says "to
 * three" — the figure was the one-sided-ratchet shape the block above `pgForks`
 * warns about, phrased over the complement of whatever arrived last. Membership
 * is the durable claim; the size is not.
 *
 * Its own claim is asserted separately and is about the EDGE rather than the
 * fork: `isometries-and-symmetry` is reached from `congruence` and from nowhere
 * else, which is the check that would catch the edge being hung off a plausible
 * neighbour. `similarity` is the plausible one — both concepts are about two
 * figures agreeing — and it is not a prerequisite here, because what this
 * concept needs from below is SSS and the base-angle theorem, both of which are
 * `congruence`'s.
 */
t('and the twelfth takes that fork to four, hanging off congruence specifically',
  PG_PREREQS.filter(e => e.to === 'isometries-and-symmetry').map(e => e.from).join(',')
    === 'congruence'
  && prerequisitesOf(PG, 'isometries-and-symmetry').join(',') === 'congruence'
  && allPrerequisitesOf(PG, 'isometries-and-symmetry').includes('triangle-basics')
  && allPrerequisitesOf(PG, 'isometries-and-symmetry').includes('points-lines-angles')
  && !allPrerequisitesOf(PG, 'isometries-and-symmetry').includes('similarity'),
  allPrerequisitesOf(PG, 'isometries-and-symmetry').join(', '))
/*
 * And it is a LEAF of this subject: nothing in `plane-geometry` depends on it,
 * and its one dependent anywhere in the build is `binary-operations`, a node of
 * `abstract-algebra`. So the fork set did not move, and the claim is written as
 * "no edge leaves this node" alongside the named set rather than as a count,
 * since a count would read the same if an edge had been added out of it to a
 * node that already had a parent.
 */
t('and nothing in this subject rests on it, so the three branch points are unmoved',
  PG_PREREQS.filter(e => e.from === 'isometries-and-symmetry').length === 0
  && pgForks() === 'congruence,pythagoras,triangle-basics',
  `${pgForks()} | out: ${PG_PREREQS.filter(e => e.from === 'isometries-and-symmetry').length}`)
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
 * `congruence` forked three ways when this was written — `similarity` at the
 * fourth promotion, `quadrilaterals-and-polygons` at the sixth,
 * `geometric-proof` at the eighth; it has a fourth child now and the paragraph
 * below this one says what that did to the claim. `circles` reconverged two of
 * the three and provably not the third: the assertion above holds that the
 * polygons are deliberately NOT behind it. `circle-measure` reaches all three,
 * because its second parent `area-and-perimeter` sits on the polygons branch.
 * So this is the first concept of the subject with all three of those branches
 * in its ancestry.
 *
 * The contrast against `circles` is asserted in the same breath rather than
 * separately, because the claim is comparative: "has all three" means nothing
 * here unless the node one promotion down is known not to.
 *
 * THE TWELFTH PROMOTION GAVE `congruence` A FOURTH CHILD AND DID NOT FALSIFY
 * THIS, which is worth stating because the obvious reading says it should have.
 * The claim was written as "every child of `congruence` in its ancestry", and
 * `isometries-and-symmetry` is a child of `congruence` that is NOT behind
 * `circle-measure`. But it cannot be behind anything: it is a leaf of the
 * subject, so no concept here has it as an ancestor and the quantified form of
 * the claim became unsatisfiable rather than false. So the assertion now names
 * the three branches it was always about and adds the exclusion explicitly —
 * which is the one-sided-ratchet repair the block above `pgForks` describes,
 * done before the ratchet fired rather than after.
 *
 * THE THIRTEENTH GAVE IT A FIFTH CHILD, AND THE REPAIR ABOVE IS WHY NOTHING
 * HAD TO BE RETHOUGHT — which is the point of recording it. `congruence`'s
 * child set is asserted by name here and the new member is simply added to it;
 * the three-branch claim is untouched, because it was narrowed to the three
 * branches it was always about rather than left as "every child". Had it still
 * read "every child of `congruence`", this promotion would have been the
 * second consecutive one to make it unsatisfiable, and the second repair would
 * have looked like the test being wrong rather than like the ratchet firing.
 *
 * The new child needs its own exclusion for the same reason the last one did,
 * and the reason is identical: `plane-transformations` is a LEAF of this
 * subject, so it is behind nothing and the quantifier would pass vacuously
 * over it. Both exclusions are therefore stated as named negatives.
 */
t('the tenth is the first node with all three authored branches of the congruence fork behind it',
  ['similarity', 'quadrilaterals-and-polygons', 'geometric-proof']
    .every(id => PG_ANC('circle-measure').includes(id))
  && !PG_ANC('circles').includes('quadrilaterals-and-polygons')
  && !PG_ANC('circle-measure').includes('isometries-and-symmetry')
  && !PG_ANC('circle-measure').includes('plane-transformations')
  && PG_PREREQS.filter(e => e.from === 'congruence').map(e => e.to).sort().join(',')
    === 'geometric-proof,isometries-and-symmetry,plane-transformations,'
      + 'quadrilaterals-and-polygons,similarity',
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
t('seventy-eight tasks, two on each of the thirty-nine points', PG_TASKS.length === 78
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
/*
 * `isometries-and-symmetry` added the last six, all `evaluate`, and the pair
 * above stays a pair for a THIRD reason — which is what makes it worth writing
 * down rather than noting a third concept that happened not to need a form.
 *
 * `circle-measure` wanted a form and none existed: every measure it produces is
 * a multiple of π and no `NamedForm` speaks about one. `distance-and-midpoint`
 * had one that fitted and declined it, as a fourth copy of a question
 * `roots-and-irrationals` owns. Here there is nothing for a form to be about at
 * all: every quantity in the concept is a whole number of degrees or a count of
 * maps, and a `NamedForm` is a claim about the SHAPE of an expression, so "12"
 * admits no syntactic demand. Wanted-and-absent, available-and-declined,
 * inapplicable — the three ways a subject can fail to gain a form, and the
 * ordered pair below has now survived all three.
 */
/*
 * `plane-transformations` added the last six, all `evaluate`, and it is the
 * fourth concept running not to need a form — which is now a settled property
 * of the subject rather than four coincidences, and the reason this note is
 * short where the three above it are long.
 *
 * Its answers are coordinates, squared distances and whole distances, so the
 * `isometries-and-symmetry` argument applies unchanged: a `NamedForm` is a
 * claim about the SHAPE of an expression and there is nothing syntactic to
 * demand of "2". The one place it came closer than that concept did is the
 * second knowledge point, where a distance IS a root and `surd_reduced` would
 * have fitted — and it is declined on `distance-and-midpoint`'s ground, as a
 * fifth copy of a question `roots-and-irrationals` owns. The figures make
 * every root whole (5, 5 and 15) so the comparison of three distances is the
 * difficulty rather than the radical.
 *
 * The first point is where a form was genuinely wanted and genuinely absent,
 * and it is worth naming because it is the `circle-measure` case in a new
 * place. What that point is about is which SLOT each coordinate lands in —
 * (−y, x) against (−x, y) — and that is a claim about the shape of a PAIR, not
 * of a scalar expression. No member of the union speaks about an ordered pair,
 * because every form in it is about one expression in one variable. So the
 * ask is carried by arithmetic designed to expose the slots instead: the pair
 * of tasks computes a squared distance BETWEEN the two images, which comes out
 * differently if the slots are swapped, rather than asking for one image's
 * coordinate, which would come out differently only in its label.
 */
t('seventy-six evaluate and two transform_to_form, both surds that a right angle produced',
  PG_EVAL.length === 76 && PG_FORM.length === 2
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

/*
 * THE TWELFTH PROMOTION'S SHARED EXPRESSION, AS A PAIR, which is this subject's
 * habit of making the repetition the content and is the third instance of it.
 *
 * `count-a-regular-polygons-symmetries-1` and
 * `the-scalene-triangle-has-one-symmetry-and-not-none-1` are the same
 * `360/a + b`, at a = 60, b = 6 and at a = 360, b = 0. One formula covers the
 * most symmetric figure in the concept and the least, which is what makes "the
 * identity is a symmetry" a consequence rather than a caveat: a learner who
 * expects 0 has to disagree with the arithmetic rather than with a rule.
 * Asserted as a pair because each task alone is unremarkable and the agreement
 * is the claim — exactly as with `a*b - c*d` above.
 *
 * The rectangle is read as well, at a = 180, b = 2, and it is not a task. It is
 * here because the two authored inputs sit at the ends of the range and a
 * reading between them is what shows the expression is not a two-case lookup.
 */
t('one symmetry count serves the regular polygon, the rectangle and the scalene triangle', (() => {
  const task = taskById('count-a-regular-polygons-symmetries-1')
  const twin = taskById('the-scalene-triangle-has-one-symmetry-and-not-none-1')
  const read = (a, b) => {
    const at = { a: parseExpression(a, []), b: parseExpression(b, []) }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b']), at))
    return v === null ? null : showExact(v)
  }
  // 360/60 + 6 = 12 for the hexagon, 360/72 + 5 = 10 for the pentagon,
  // 360/180 + 2 = 4 for the non-square rectangle, and 360/360 + 0 = 1 for the
  // scalene triangle. The last is the one the point is built on: 1 and not 0.
  return task.given === twin.given && read('60', '6') === '12' && read('72', '5') === '10'
    && read('180', '2') === '4' && read('360', '0') === '1'
})())
/*
 * And the doubling, which has to be able to FAIL or the task is a free mark.
 *
 * `(2a + 2b) - 2c` is zero exactly when a + b = c, which is what it means for
 * the first mirror image to lie between the two mirrors. A learner who misreads
 * the figure gets a non-zero answer rather than a 0 the expression would have
 * produced whatever they put in — which is the check
 * `the-four-angles-are-two-angles-twice-1` is asserted for in the polygons, and
 * the reason neither task is an identity dressed up as a claim.
 */
t('the mirror doubling is zero only where the image lies between the mirrors', (() => {
  const task = taskById('the-starting-point-drops-out-of-the-doubling-1')
  const read = (a, b, c) => {
    const at = {
      a: parseExpression(a, []), b: parseExpression(b, []), c: parseExpression(c, []),
    }
    const v = exactValue(substitute(parseExpression(task.given, ['a', 'b', 'c']), at))
    return v === null ? null : showExact(v)
  }
  // The authored 20, 15, 35 gives 0; 20, 16, 35 gives 2 and 25, 15, 35 gives
  // 10, so the expression separates the configuration the point describes from
  // the ones it does not. A second valid pair of half-angles on the same
  // mirrors — 5 and 30 — also gives 0, which is the claim that the starting
  // point drops out rather than a coincidence of 20 and 15.
  return read('20', '15', '35') === '0' && read('5', '30', '35') === '0'
    && read('20', '16', '35') === '2' && read('25', '15', '35') === '10'
})())

/*
 * THE THIRTEENTH PROMOTION'S THREE PAIRS, each asserted for the thing it is
 * about rather than for its authored answer — which the two blocks above are
 * the precedent for and which matters more here than in any concept of the
 * subject so far, because this one's prompts hand the learner every rule.
 *
 * The first pair is a LOCUS claim and is the one most easily reduced to a
 * coincidence. `((-a) - (-b))^2 + (b - a)^2` is the squared distance between a
 * point's image under a reflection in the y-axis and its image under a quarter
 * turn, and it simplifies to 2(b − a)² — so it vanishes exactly on the line
 * y = x. The authored pair reads 18 at (5, 2) and 0 at (4, 4), and a 0 at one
 * authored input proves nothing about a line: a third point on y = x is
 * checked, and two points off it, so the expression is shown to separate the
 * locus from its complement rather than to be identically zero or to be zero by
 * luck at (4, 4). Negative coordinates on the third, since the two maps are
 * sign rules and all three authored inputs are positive.
 */
t('the two maps agree on the whole line y = x and nowhere else, not just at the authored point',
  (() => {
    const task = taskById('the-two-maps-disagree-away-from-the-mirror-1')
    const twin = taskById('the-two-maps-agree-on-the-mirror-line-1')
    const read = (a, b) => {
      const at = { a: parseExpression(a, []), b: parseExpression(b, []) }
      const v = exactValue(substitute(parseExpression(task.given, ['a', 'b']), at))
      return v === null ? null : showExact(v)
    }
    // Same expression at two inputs, which is what makes the pair a comparison.
    // 2(b − a)²: 18 at (5, 2), 0 at (4, 4), 0 again at (−7, −7) — a third point
    // on the line, and the only one of the three with negative coordinates —
    // and non-zero at two points off it.
    return task.given === twin.given
      && read('5', '2') === '18' && read('4', '4') === '0'
      && read('-7', '-7') === '0'
      && read('0', '5') === '50' && read('3', '-3') === '72'
  })())
/*
 * The second pair against the ELEVENTH promotion's task, because "the distance
 * was preserved" is a claim about two numbers produced by one instrument and
 * neither task states it alone.
 *
 * All three share `sqrt((c - a)^2 + (d - b)^2)` deliberately — the reuse is in
 * the tasks.ts comment — and the shared `given` is what the assertion holds
 * first, since a comparison of distances means nothing unless the same
 * instrument produced all of them.
 *
 * The ORIGINAL distance is then recomputed here rather than read off a task,
 * because there is no task for it: the segment A(1, 2) B(4, 6) is the worked
 * example's and the two tasks are its two images. So the shared expression is
 * evaluated at the original pair, and that value — not a numeral in a prompt —
 * is what the quarter turn's answer must equal and what the scaling's must be
 * exactly three times. Writing 5 and 15 in would have asserted the arithmetic
 * twice and the preservation not at all.
 *
 * The nine is excluded explicitly. Three times and nine times are the two
 * answers a learner picks between, the factor having entered each squared leg
 * twice, so an assertion that passed on either would not be about the thing
 * the task is about.
 */
t('the distance pair is measured with the eleventh promotion\'s own instrument, and the factor leaves once',
  (() => {
    const orig = taskById('the-distance-is-a-hypotenuse-1')
    const rot = taskById('the-quarter-turn-returns-the-distance-1')
    const scaled = taskById('the-scaling-multiplies-the-distance-once-1')
    const num = s => {
      const v = exactValue(parseExpression(s, []))
      return v === null ? null : showExact(v)
    }
    // The worked example's own segment, through the shared expression: legs 3
    // and 4, so AB = 5. The quarter turn's image measures the same 5 and the
    // scaling's measures 15.
    const at = { a: '1', b: '2', c: '4', d: '6' }
    const subs = {}
    for (const [k, v] of Object.entries(at)) subs[k] = parseExpression(v, [])
    const abVal = exactValue(substitute(parseExpression(rot.given, ['a', 'b', 'c', 'd']), subs))
    const ab = abVal === null ? null : showExact(abVal)
    return orig.given === rot.given && rot.given === scaled.given
      && ab === rot.reference
      && num(`${scaled.reference} - 3*(${ab})`) === '0'
      && num(`${scaled.reference} - 9*(${ab})`) !== '0'
  })())
/*
 * The third pair by the CHECK the worked example ends on, which is the only
 * assertion in this group that could catch a wrong answer rather than a
 * changed one.
 *
 * A rotation about C holds C fixed and therefore cannot move any point off its
 * circle about C. So the two authored references, taken as a point, must sit at
 * the same squared distance from C(4, 1) as P(7, 3) does — and the answer the
 * origin rule would have given must NOT. Both halves are checked: without the
 * second, an assertion that the authored answer passes the test says nothing
 * about whether the test discriminates.
 *
 * The two expressions are also asserted to DIFFER, which is this pair's own
 * content and the one place it departs from `distance-and-midpoint`'s x/y pair.
 * There one expression served both coordinates; here the first subtracts the
 * vertical displacement and the second adds the horizontal one, and a pair that
 * had drifted into using one expression twice would be asserting that a quarter
 * turn is symmetric in its two coordinates, which it is not.
 */
t('the rotation about a centre lands on the circle through P, and the origin rule does not',
  (() => {
    const xt = taskById('rotate-about-a-centre-the-x-coordinate-1')
    const yt = taskById('rotate-about-a-centre-the-y-coordinate-1')
    const sq = (px, py) => {
      const v = exactValue(parseExpression(`(${px} - 4)^2 + (${py} - 1)^2`, []))
      return v === null ? null : showExact(v)
    }
    // CP² = (7 − 4)² + (3 − 1)² = 13. The image (2, 4) gives 4 + 9 = 13; the
    // origin rule's (−3, 7) gives 49 + 36 = 85, so the check discriminates.
    return xt.given !== yt.given
      && sq('7', '3') === '13'
      && sq(xt.reference, yt.reference) === '13'
      && sq('-3', '7') === '85'
  })())
/*
 * And the two things this promotion did NOT do, both of which fail silently.
 *
 * It is a LEAF, like `isometries-and-symmetry` beside it, so the branch-point
 * set is unmoved — written as "no edge leaves this node" alongside the named
 * set rather than as a count, for the reason the twelfth promotion's note
 * gives: a count reads the same if an edge were added out of it to a node that
 * already had a parent.
 *
 * And it declared no interference with `isometries-and-symmetry`, which is the
 * refusal ontology-geometry.ts records in two places. The subject's
 * single-interference assertion above would catch an added one, so what is
 * held here is the specific pair — because the general count would also be
 * satisfied by swapping the existing `similarity`/`congruence` interference
 * for this one.
 */
t('and the thirteenth is a leaf too, so the branch points are unmoved and no interference was invented',
  PG_PREREQS.filter(e => e.from === 'plane-transformations').length === 0
  && pgForks() === 'congruence,pythagoras,triangle-basics'
  && !PG.edges.some(e => e.kind === 'interferes_with'
    && [e.from, e.to].includes('plane-transformations'))
  && prerequisitesOf(PG, 'plane-transformations').join(',') === 'congruence',
  `${pgForks()} | out: ${PG_PREREQS.filter(e => e.from === 'plane-transformations').length}`)

const PG_QUESTIONS = allQuestions(PG)
t('a hundred and sixty-four questions, one per subgoal',
  PG_QUESTIONS.length === 164, `${PG_QUESTIONS.length}`)
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
t('two concepts, six knowledge points',
  TT.concepts.length === 2 && allKnowledgePoints(TT).length === 6,
  `${TT.concepts.length} concepts, ${allKnowledgePoints(TT).length} points`)
t('both concepts are teachable AND practisable — a syllabus, not a map entry',
  ['right-triangle-trig', 'law-of-sines-cosines'].every(id =>
    isTeachable(TT, id) && isPractisable(TT, id)),
  ['right-triangle-trig', 'law-of-sines-cosines']
    .map(id => `${id}:${isTeachable(TT, id)}/${isPractisable(TT, id)}`).join(' '))
t('its points number from 1 per CONCEPT, which the second concept is the first proof of',
  TT.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  TT.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
/*
 * The positions assertion above was vacuous as a claim about the SUBJECT while
 * the subject held one concept: "restarts at 1 per concept, not per subject" is
 * unobservable until there are two, so until this promotion the line could not
 * tell the two rules apart. It can now — six points numbered 1,2,3,1,2,3 rather
 * than 1..6 — and the message prints both concepts so which one drifted is
 * visible. Asserted here separately from the shape above, because the shape
 * would still pass if a future third concept numbered its points 4,5,6.
 */
t('and the subject therefore has two points at each of positions 1, 2 and 3',
  [1, 2, 3].every(n => allKnowledgePoints(TT).filter(p => p.position === n).length === 2),
  allKnowledgePoints(TT).map(p => p.position).join(','))
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
 * THE EDGE LIST WAS EMPTY AS A BOUNDARY AND NOW HOLDS EXACTLY ONE, WHICH IS
 * THE SAME BOUNDARY MEASURED FROM THE OTHER SIDE.
 *
 * While the subject held one concept there was no internal pair to join, and
 * the single concept's prerequisites, `similarity` and `pythagoras`, are fully
 * AUTHORED concepts that simply belong to `plane-geometry` — and an ontology's
 * edges may only name concepts it CONTAINS, so being authored in another
 * subject fails the containment test exactly as being unwritten does.
 *
 * The second concept's `needs` SPLIT on that rule, which is why this block is
 * worth asserting rather than just updating. `right-triangle-trig` is in this
 * subject, so that edge is the one below. `triangle-basics` is authored,
 * teachable and practisable, and is a concept of `plane-geometry` — so it is
 * still barred, and it went to `TRIGONOMETRY.links` with the other two. One
 * promotion, both outcomes, so neither is the general case: what decides is
 * the far endpoint's SUBJECT and not whether it has material.
 */
t('it declares one edge, the second concept resting on the first',
  TT.edges.length === 1
  && TT.edges[0].from === 'right-triangle-trig'
  && TT.edges[0].to === 'law-of-sines-cosines'
  && TT.edges[0].kind === 'prerequisite'
  && !!TT.edges[0].rationale,
  TT.edges.map(e => `${e.from}->${e.to}:${e.kind}`).join(' '))
t('so the first concept is still the subject\'s only root, now with something above it',
  roots(TT).length === 1 && roots(TT)[0] === 'right-triangle-trig',
  roots(TT).join(' '))
t('and the prerequisites in ANOTHER subject are barred even though they have material',
  ['similarity', 'pythagoras', 'triangle-basics'].every(id =>
    isTeachable(PG, id) && isPractisable(PG, id) && !TT.concepts.some(c => c.id === id)
    && !TT.edges.some(e => e.from === id || e.to === id)),
  ['similarity', 'pythagoras', 'triangle-basics']
    .map(id => `${id}:${isTeachable(PG, id)}`).join(' '))
t('no knowledge point claims a figure, because there are none to claim',
  allKnowledgePoints(TT).every(p => p.visualRef === undefined))

/*
 * EVERY SUBGOAL ASKED AS A QUESTION — and this subject had no such check at
 * all until now, which is why it is added here rather than only extended.
 * `partial-fractions`, `geometric-proof` and `absolute-value` each carry the
 * pair; the ninth subject shipped without it and has been relying on the
 * build-wide coverage figure, which reports a fraction and names no subject.
 *
 * WRITTEN NULL-SAFE, which the three precedents are not. `isInterrogative`
 * calls `trimEnd()`, so it THROWS on a missing `socratic` — exactly the state
 * the assertion above exists to report. Unguarded, a dropped field makes the
 * presence check fail and then kills the run on the next line, taking every
 * later assertion with it and reporting "1 failed". So the shape check filters
 * to the subgoals that HAVE a string before asking whether it is a question,
 * and the presence check is what reports the absence.
 */
const TT_SUBGOALS = allKnowledgePoints(TT).flatMap(p => p.workedExample.subgoals)
t('twenty-five subgoals across the six worked examples', TT_SUBGOALS.length === 25,
  `${TT_SUBGOALS.length}`)
t('every subgoal carries an authored socratic phrasing',
  TT_SUBGOALS.every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  TT_SUBGOALS.filter(s => typeof s.socratic !== 'string' || !s.socratic.length)
    .map(s => s.label).join(', '))
t('and every one of them is actually phrased as a question',
  TT_SUBGOALS.filter(s => typeof s.socratic === 'string')
    .every(s => isInterrogative(s.socratic)),
  TT_SUBGOALS.filter(s => typeof s.socratic === 'string' && !isInterrogative(s.socratic))
    .map(s => s.label).join(', '))
t('while the labels stay imperative — the map draws moves, the tutor asks sentences',
  TT_SUBGOALS.every(s => !isInterrogative(s.label)),
  TT_SUBGOALS.filter(s => isInterrogative(s.label)).map(s => s.label).join(', '))

group('the ninth subject is gradable with no worker')
const TT_TASKS = allKnowledgePoints(TT).flatMap(p => tasksForPoint(p.id))
/*
 * THIRTEEN TASKS, AND THE TWO-PER-POINT SHAPE IS BROKEN ON PURPOSE AT ONE
 * POINT, so the number is stated as a shape rather than as a total.
 *
 * Two per point held across all three points of the first concept and holds on
 * two of the three in the second. The cosine-law point carries THREE because it
 * carries three distinct moves rather than one move drilled three times: the law
 * forwards from two sides and the included angle, the law backwards from three
 * sides to a cosine whose SIGN is the verdict, and the surd that an oblique
 * triangle's third side normally is. Its two objectives want all three —
 * `produce-the-third-side...` names `transform_to_form` and
 * `read-the-corrections-sign...` names `evaluate` — so dropping any one of them
 * would leave an objective in that concept evidenced by nothing.
 *
 * Asserted per point by name rather than as `every(p => length === 2)`, because
 * the uniform version would now be false and the fix of relaxing it to `>= 2`
 * would stop catching a point that quietly grew a fourth.
 */
t('thirteen tasks: two on every point but the cosine law, which carries three',
  TT_TASKS.length === 13
  && tasksForPoint('the-cosine-law-is-pythagoras-with-one-correction-term').length === 3
  && allKnowledgePoints(TT)
    .filter(p => p.id !== 'the-cosine-law-is-pythagoras-with-one-correction-term')
    .every(p => tasksForPoint(p.id).length === 2),
  allKnowledgePoints(TT).map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
const TT_EVAL = TT_TASKS.filter(x => x.kind === 'evaluate')
const TT_FORM = TT_TASKS.filter(x => x.kind === 'transform_to_form')
t('eleven evaluate and two transform_to_form, one surd per concept',
  TT_EVAL.length === 11 && TT_FORM.length === 2
  && TT_EVAL.every(x => x.form === undefined)
  && TT_FORM.map(x => x.id).sort().join(' ')
    === 'the-cosine-law-left-a-surd-1 the-derived-quotient-at-thirty-degrees-1'
  && TT_FORM.every(x => x.form === 'surd_reduced'),
  TT_TASKS.map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
/*
 * THE SURD TASK SITS ON THE COSINE POINT AND THAT IS A FACT ABOUT THE TWO LAWS.
 * The cosine law produces a², so a given of `sqrt(76)` is the honest next step
 * of the learner's own working; the sine law produces a side directly.
 *
 * Which is load-bearing rather than tidy, and the reason is a property of
 * `surd_reduced` that only shows up under test: it checks that each radicand is
 * square-free and nothing more, so the authentic sine-law expression
 * `10*sqrt(3)/sqrt(2)` PASSES the form check unchanged — 3 and 2 are both
 * square-free — and a task with that given would rule its own input correct.
 * Asserted as the property rather than as the choice, since the choice is only
 * defensible while the property holds.
 */
t('each surd task\'s given is a single radical with a square still in it',
  TT_FORM.every(x => /^sqrt\(\d+\)$/.test(x.given)
    && [4, 9, 25, 36, 49, 64, 100].some(sq => Number(x.given.slice(5, -1)) % sq === 0)),
  TT_FORM.map(x => `${x.id}:${x.given}`).join(' '))
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
 * BOTH DIRECTIONS ON THE SECOND SURD TOO, driven off its own `given` and
 * `reference` rather than off repeated literals. The retyped-literal trap is
 * that `includes('2*sqrt(19)')` agrees with the arithmetic in the test and not
 * with the task, so an authored reference changed to 2*sqrt(18) would still
 * pass; reading the fields makes the task the subject of the assertion.
 *
 * Refusing the given back is the half that matters, since a checker comparing
 * only VALUES would mark √76 correct against itself.
 */
const TT_SURD2 = TT_FORM.find(x => x.id === 'the-cosine-law-left-a-surd-1')
const tt2Surd = await ruleTransform(TT_SURD2, TT_SURD2.reference, NO_WORKER)
t('the cosine law\'s surd rules correct with no worker, from the task\'s own reference',
  tt2Surd.verdict.ruling === 'correct' && /no worker was needed/.test(tt2Surd.verdict.method),
  tt2Surd.verdict.method)
const tt2Unreduced = await ruleTransform(TT_SURD2, TT_SURD2.given, NO_WORKER)
t('and refuses its own given back, naming the square 4 that can still come out',
  tt2Unreduced.verdict.ruling === 'incorrect'
  && /\b4\b/.test(tt2Unreduced.verdict.brokeAt?.detail ?? ''),
  tt2Unreduced.verdict.brokeAt?.detail ?? '')
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
 * And the sides-and-angles constraint, which the second concept forced to be
 * RESTATED rather than merely re-checked. This block used to read "exactly one
 * task names a degree measure", and that was the right assertion for a subject
 * made only of right triangles: a right triangle cannot have three whole-number
 * sides AND whole-number acute angles, the figure does not exist, and nothing
 * in this build would catch it — so the tasks describing a triangle by whole
 * sides stated no angle, and the single one naming 30° and 60° was the one
 * whose answer is irrational.
 *
 * Four of the oblique tasks name 60° and have whole-number sides, which the old
 * assertion would have called a fault and which is in fact fine. The general
 * rule, argued in full in ontology-trigonometry.ts's header:
 *
 *   In a triangle with three whole-number sides, every angle has a RATIONAL
 *   cosine, by the cosine law rearranged. A whole number of degrees is a
 *   rational multiple of π, and the only rational cosines a rational multiple
 *   of π has are 0 and ±1/2 — so such an angle is 90°, 60° or 120° and nothing
 *   else. Two at once would need two of those three to sum below 180°, which
 *   leaves 60° twice, i.e. the equilateral triangle.
 *
 * The right-triangle wording is that rule at 90°. So the check below computes
 * all three cosines of every integer triangle the subject uses and requires at
 * most one to be a whole-degree cosine — which is a live computation on the
 * figures rather than a scrape of the prose, and which would catch "sides 5, 7,
 * 8 with angles of 60° and 50°" exactly as the old one caught its own case.
 */
t('no task asks for an angle, which is the subject\'s boundary and not the grader\'s',
  TT_TASKS.every(x => !/\b(what angle|which angle|find the angle|arcsin|arccos|arctan)\b/i
    .test(x.prompt)),
  TT_TASKS.filter(x => /angle\?/.test(x.prompt)).map(x => x.id).join(', '))
t('every degree measure the subject names is one it can write a ratio for exactly',
  TT_TASKS.flatMap(x => x.prompt.match(/(\d+)°/g) ?? [])
    .every(d => ['30°', '60°'].includes(d)),
  [...new Set(TT_TASKS.flatMap(x => x.prompt.match(/\d+°/g) ?? []))].join(' '))
t('and no evaluate task names a degree but 60°, the only one with a non-zero rational cosine',
  TT_EVAL.flatMap(x => x.prompt.match(/\d+°/g) ?? []).every(d => d === '60°'),
  TT_EVAL.map(x => `${x.id}:${(x.prompt.match(/\d+°/g) ?? []).join('+') || '-'}`).join(' '))
/*
 * The rule itself, on the figures. `TT_FIGURES` is every all-integer triangle
 * the subject's tasks and worked examples describe; a cosine is a whole-degree
 * one when it is 0 or ±1/2.
 *
 * Non-vacuous in both directions, which matters because "at most one" is
 * satisfied by zero: 5-7-8 and 3-7-8 have exactly one each — the 60° they name
 * — and 25-39-56 has none, which is why the sine-law tasks that use it name no
 * angle at all. Both halves are asserted, so a figure losing its 60° or gaining
 * a second whole-degree angle each go red.
 */
const TT_FIGURES = [[5, 7, 8], [3, 7, 8], [25, 39, 56]]
const wholeDegreeCosines = ([p, q, r]) =>
  [[p, q, r], [q, r, p], [r, p, q]]
    .map(([x, y, z]) => (y * y + z * z - x * x) / (2 * y * z))
    .filter(c => c === 0 || c === 0.5 || c === -0.5)
    .length
t('no integer figure in the subject states two whole-degree angles, which would be impossible',
  TT_FIGURES.every(f => wholeDegreeCosines(f) <= 1),
  TT_FIGURES.map(f => `${f.join('-')}:${wholeDegreeCosines(f)}`).join(' '))
t('and the two that name 60° really have one, while the sine-law figure has none to name',
  TT_FIGURES.map(wholeDegreeCosines).join(',') === '1,1,0',
  TT_FIGURES.map(f => `${f.join('-')}:${wholeDegreeCosines(f)}`).join(' '))

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
// The eleventh subject: summarising a list you already have
// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-statistics.ts's HEADER, for the reason
 * the five blocks above do it: each is the kind of statement that otherwise
 * rots into a comment that used to be true.
 *
 * `descriptive-statistics` was promoted out of the `statistics` map area, and
 * it is the FIRST authored concept anywhere in the uncertainty half of the
 * atlas — `probability` and `statistics` held thirty-two unwritten nodes
 * between them. Nothing about this promotion was route-driven: every journey
 * has read zero unwritten steps since the fourteenth promotion, so the
 * selection was rulability first, and the structural half of that story is in
 * tests/atlas.mjs. What is checkable here is that the material is real, that
 * the subject rules with no worker, and that the four decisions its header
 * argues for hold — the n divisor, the quartile convention, the
 * evaluate-only objectives, and the verbatim pattern.
 */
const DS = getOntology('data-summaries')

group('data-summaries, what a list of numbers says about itself')
/*
 * ELEVENTH as of the thirty-sixth promotion, which inserted a thirteenth
 * subject at index 6 and moved this one along again. The literal was 8 with the
 * title NINTH, then 9 with TENTH, and every version was correct when written.
 *
 * That is the hazard this file warns about three times over, caught doing
 * exactly what it was predicted to do, THREE TIMES on three consecutive
 * promotions — 8, then 9, then 10, now 11 — and the reason the assertion below
 * is the one that carries the claim. "Directly behind the subject that owns
 * sigma notation" is what this position MEANS, and it is still true; the index
 * is just where that currently puts it. A reader who wants to know whether the
 * registry still respects the prerequisite should read the `findIndex` pair
 * further down, not this line.
 *
 * FOUR breakages in four promotions is the argument for reading it that way
 * rather than a reason to delete the literal: the literal is what reports that
 * something moved, and four reports in four runs is the measurement saying
 * that every promotion since the twelfth subject has inserted BELOW this one.
 * A future subject that files above this index will not touch it, and that is
 * the information the literal exists to deliver.
 *
 * The thirty-eighth promotion moved it to 12, inserting `sets-and-membership` at
 * 8 behind the subject holding its prerequisite. That makes four consecutive
 * runs that each paid one edit here, and ontology.ts's own header now states the
 * conclusion as an instruction to future subjects: assert the relational fact
 * and leave a literal only where a position is load-bearing, which it is for
 * index 0 and nowhere else. This line stays anyway, for the reason two
 * paragraphs up — it is the thing that REPORTS the move.
 *
 * THE FORTY-FOURTH MOVED IT TO 13, inserting `counting-and-arrangements` at 10,
 * and that is FIVE consecutive runs. The literal has now reported five moves and
 * the relational assertion below has needed no edits across all five, which is
 * the comparison the paragraph above predicted and the reason this line is kept
 * as a REPORT rather than promoted to the claim. One thing is new and narrows
 * what the literal measures: the four previous insertions each went in at 8,
 * behind the subject holding a single prerequisite, so "every promotion since the
 * twelfth subject has inserted BELOW this one" was a statement about a chain of
 * logic subjects. This one went in at 10 because it has TWO prerequisites in two
 * subjects and had to clear the later of them — `binomial-theorem` in
 * `rational-expressions` at 9 — so it is below this index for a different reason
 * than its four predecessors were. The count of five is still a count of moves;
 * it is no longer a count of one pattern recurring.
 *
 * THE FORTY-FIFTH MOVED IT TO 14, inserting `chance-and-events` at 11, and that
 * is SIX consecutive runs. What is new in this one is the opposite of the
 * previous note's narrowing: that insertion did NOT go in at the earliest slot
 * its prerequisites allowed. Its later prerequisite sits at 8, so 9 was
 * available, and it went to 11 because 9 and 10 are indices other groups read by
 * name. So the six moves are not even a count of insertions finding their floor —
 * they are a count of insertions landing ABOVE this subject for whatever local
 * reason, and this literal reports the landing without claiming to explain it.
 * The relational assertion below has still needed no edits across all six.
 */
t('it is registered, and FIFTEENTH IN ORDER — directly behind the subject that owns sigma notation',
  ONTOLOGIES[14] === DS && DS?.subject.id === 'data-summaries')
t('and it displaced none of the five positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure'))
/*
 * The position is BEHIND the subject holding its prerequisite, and the
 * disagreement with a school course is asserted rather than left to be noticed.
 * A learner meets the median long before an inverse function, and registry
 * order cannot say so because it must not contradict a prerequisite. So the
 * claim is only that `sigma-notation`'s subject comes first, which is a fact
 * about where this build files Σ.
 */
t('its position is forced by where sigma notation lives, not by where a course puts the median',
  ONTOLOGIES.findIndex(o => o.subject.id === 'functions-and-inverses')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'data-summaries')
  && !!conceptById(getOntology('functions-and-inverses'), 'sigma-notation'),
  `functions at ${ONTOLOGIES.findIndex(o => o.subject.id === 'functions-and-inverses')}, `
  + `summaries at ${ONTOLOGIES.findIndex(o => o.subject.id === 'data-summaries')}`)
t('it has no internal faults', ontologyProblems(DS).length === 0, ontologyProblems(DS).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(DS).length === 0)
t('one concept, three knowledge points',
  DS.concepts.length === 1 && allKnowledgePoints(DS).length === 3,
  `${DS.concepts.length} concepts, ${allKnowledgePoints(DS).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(DS, 'descriptive-statistics') && isPractisable(DS, 'descriptive-statistics'))
t('its points number from 1, which is per concept and not per subject',
  DS.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  DS.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(DS).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(DS).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * EVERY OBJECTIVE NAMES ONLY `evaluate`, WHICH IS THE WHOLE SET THIS SUBJECT
 * SHIPS, and the rule is the tenth subject's rather than a new one. An
 * objective naming a kind nothing serves can never be satisfied — types.ts's
 * argument about an objective naming no kind, one level down — and twenty-eight
 * of `plane-geometry`'s name `justify` while no `justify` task exists anywhere.
 *
 * The best unrulable question in this file is deliberately NOT an objective:
 * "why square the deviations rather than take their absolute values" is the
 * fifth subgoal of the second point, where the tutor asks it and nothing
 * pretends to rule it. The honest answer involves `variance-and-covariance`,
 * which is an unwritten node of `probability`.
 */
const DS_KINDS = new Set(allKnowledgePoints(DS).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  DS.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => DS_KINDS.has(k)))),
  DS.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...DS_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate}, so no objective could name anything else',
  DS_KINDS.size === 1 && DS_KINDS.has('evaluate')
  && DS.concepts.every(c => c.objectives.every(o => o.taskKinds.join(',') === 'evaluate')),
  [...DS_KINDS].join('+'))
/*
 * THE EMPTY EDGE LIST IS A BOUNDARY, AND THIS IS THE FIRST SUBJECT TO REACH IT
 * WITH PREREQUISITES IN TWO DIFFERENT OTHER SUBJECTS.
 *
 * `expressions-and-equations` got there because its concept's prerequisites
 * were unwritten map nodes; `triangle-trigonometry` because both of its
 * concept's prerequisites were authored in ONE other subject; `solid-measure`
 * because there was exactly one. Here there are two and they are in two
 * different subjects, so no single ontology could have held both ends of both
 * edges and the `links` entries in atlas-uncertainty.ts are forced rather than
 * chosen. An edge added here naming either would look right and would make
 * `ontologyProblems` report an unknown endpoint.
 */
t('it declares no edges, and the single concept is therefore its own root',
  DS.edges.length === 0 && roots(DS).length === 1 && roots(DS)[0] === 'descriptive-statistics')
t('and its two real prerequisites are authored in TWO other subjects, which is new',
  isTeachable(getOntology('arithmetic-foundations'), 'percent')
  && isTeachable(getOntology('functions-and-inverses'), 'sigma-notation')
  && !DS.concepts.some(c => c.id === 'percent' || c.id === 'sigma-notation'),
  ['percent', 'sigma-notation'].map(id =>
    `${id}@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === id))?.subject.id}`).join(' '))
/*
 * NO FIGURE, and here the absence is a decision the node's own search terms
 * argue against: it arrived carrying `histogram` and `boxplot`. A histogram's
 * shape is read off a drawing, which is the judgement ontology-functions.ts
 * refuses for `graphs-of-functions`, so the third point teaches the part of the
 * shape that is a SIGN and the pictures are simply absent.
 */
t('no knowledge point claims a figure, though two of the node\'s terms name one',
  allKnowledgePoints(DS).every(p => p.visualRef === undefined)
  && /histogram/.test(DS.concepts[0].scope.hint)
  && /boxplot/.test(DS.concepts[0].scope.hint),
  DS.concepts[0].scope.hint)
/*
 * No `automaticityTarget` anywhere, which is a judgement rather than an
 * omission and is asserted because every computation here would time
 * beautifully. Each point is ABOUT a choice the arithmetic does not record:
 * which centre a question wants, whether a repeated value was counted, which
 * inputs a formula does not contain. A speed reward would train the reflex
 * each point exists to correct.
 */
t('and no point claims a speed target, since each one is about a choice rather than an arithmetic',
  allKnowledgePoints(DS).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(DS).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done and for their reason: widening in the same edit that adds
 * material moves the recognition figure in tests/atlas.mjs and the
 * written-concept count together, and there is no way afterwards to say which
 * half did it.
 *
 * Asserted against the literal rather than against the node, because the node
 * is GONE — that is what a promotion is — so there is nothing left to compare
 * with. The shortfall this leaves is in the concept's own scope comment and in
 * this file's over-broad group: "Mean", "Arithmetic mean", "Variance",
 * "Standard deviation" and "Interquartile range" are all real articles, all of
 * them this concept's, and none of them matches.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(DS.concepts[0].scope.match)
    === String(/\b(descriptive statistics|median|quartile|histogram)\b/i)
  && DS.concepts[0].fidelity === 'checked',
  String(DS.concepts[0].scope.match))

group('the eleventh subject is gradable with no worker')
const DS_TASKS = allKnowledgePoints(DS).flatMap(p => tasksForPoint(p.id))
/*
 * Eight tasks, three on the first point, two on the second, three on the third,
 * and the SHAPE is asserted rather than a total — a ratio over a total would be
 * satisfied by eight tasks distributed any way at all.
 *
 * The distribution is the content. The first point claims one thing about the
 * mean and TWO about the median (that it is a position, and that an even-length
 * list has no value at that position), the second claims exactly two things
 * (the signed deviations cancel and the squared ones do not), and the third
 * claims a sign — which costs a PAIR, since one example alone reads as a fact
 * about the subtraction — plus a robustness.
 */
t('eight tasks: three on the first point, two on the second, three on the third',
  DS_TASKS.length === 8
  && allKnowledgePoints(DS).map(p => tasksForPoint(p.id).length).join(',') === '3,2,3',
  allKnowledgePoints(DS).map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
/*
 * ALL `evaluate` AND NO `transform_to_form`, which is a fact about the subject
 * rather than a gap. A `NamedForm` is a claim about the SHAPE of an expression
 * and nothing here asks for a shape; every question is "which number does this
 * list give". The one answer that could have been a surd is the standard
 * deviation, and the sample was chosen so its variance is 4 and its root
 * exactly 2 — because the step being taught is that the root restores the
 * UNITS, and a radicand would have made it about radicals.
 *
 * Both halves asserted: a later `transform_to_form` added here would need that
 * argument withdrawn in writing rather than silently.
 */
t('all eight are evaluate, and none demands a named form',
  DS_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined)
  && !DS_TASKS.some(x => x.kind === 'transform_to_form'),
  DS_TASKS.map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  DS_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  DS_TASKS.map(x => x.id).join(', '))
const dsRulings = await Promise.all(DS_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  dsRulings.every(r => r.verdict.ruling === 'correct'),
  dsRulings.map((r, i) => `${DS_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * THE MEDIAN PAIR: ONE EXPRESSION AT TWO INPUTS WHOSE ANSWERS DIFFER IN KIND.
 *
 * `(n+1)/2` at n = 5 is 3, a whole position, so a value of the list IS the
 * median. At n = 8 it is 9/2, and there is no value at position four and a
 * half, so the median is computed from two of them and need not be in the list
 * at all. That is `geometric-proof`'s shape for scoring an asymmetry — the same
 * expression, two verdicts that differ in kind rather than in size — and
 * asserting the DENOMINATORS is what records it: a pair whose answers were 3
 * and 4 would be the same two tasks making no claim.
 */
const DS_MEDIAN_ODD = taskById('the-median-sits-at-a-position-not-at-a-value-1')
const DS_MEDIAN_EVEN = taskById('an-even-length-list-has-no-value-at-its-middle-position-1')
t('the median pair is one expression at two inputs, and only one lands on a whole position',
  DS_MEDIAN_ODD.given === DS_MEDIAN_EVEN.given
  && DS_MEDIAN_ODD.reference === '3' && DS_MEDIAN_EVEN.reference === '9/2'
  && exactValue(parseExpression(DS_MEDIAN_ODD.reference, [])).d === 1n
  && exactValue(parseExpression(DS_MEDIAN_EVEN.reference, [])).d === 2n,
  `${DS_MEDIAN_ODD.given}: ${DS_MEDIAN_ODD.reference} and ${DS_MEDIAN_EVEN.reference}`)
/*
 * THE TAIL PAIR, the same shape and the one where the verdict is a SIGN. The
 * identical `given` on two lists, positive on the donations and negative on the
 * marks — and the second list exists in the file for this job alone, since
 * every other list here is right-tailed and two positive examples would read as
 * a fact about the subtraction rather than about the data.
 */
const DS_GAP_HIGH = taskById('a-positive-gap-puts-the-tail-on-the-high-side-1')
const DS_GAP_LOW = taskById('and-a-negative-gap-puts-it-on-the-low-side-1')
t('the tail pair is one expression at two inputs whose answers differ in SIGN',
  DS_GAP_HIGH.given === DS_GAP_LOW.given
  && Number(DS_GAP_HIGH.reference) > 0 && Number(DS_GAP_LOW.reference) < 0,
  `${DS_GAP_HIGH.given}: ${DS_GAP_HIGH.reference} and ${DS_GAP_LOW.reference}`)
/*
 * THE ONE FACT THE SUBJECT PROVES, scored as a reference of zero.
 *
 * Σ(xᵢ − x̄) = Σxᵢ − n·x̄ and n·x̄ IS Σxᵢ, so the signed deviations cancel for
 * every list whatever its shape — which is why a measure of spread has to
 * square first. The task uses the most lopsided list in the file, where four
 * negatives balance one positive, so a zero is not a symmetry.
 *
 * Asserted with the non-vacuity: the inputs really are lopsided, in the sense
 * that the largest deviation is bigger than all the others put together. A
 * symmetric list would pass the zero and make no claim.
 */
const DS_CANCEL = taskById('the-signed-deviations-sum-to-zero-on-any-list-1')
t('the deviations task rules on a zero, and its list is lopsided rather than symmetric',
  DS_CANCEL.reference === '0'
  && (() => {
    const m = Number(DS_CANCEL.at.m)
    const devs = ['a', 'b', 'c', 'd', 'e'].map(k => Number(DS_CANCEL.at[k]) - m)
    const biggest = Math.max(...devs.map(Math.abs))
    return devs.reduce((s, d) => s + d, 0) === 0
      && biggest > devs.filter(d => Math.abs(d) !== biggest).reduce((s, d) => s + Math.abs(d), 0) / 2
  })(),
  JSON.stringify(DS_CANCEL.at))
/*
 * THE n DIVISOR, ASSERTED AS THE SHAPE OF THE PROMPT RATHER THAN AS A NUMBER.
 *
 * The variance here divides by n, the count of the list — 32/8 = 4 — where a
 * calculator's `s` divides by n − 1 and returns 32/7 ≈ 4.571. That is not a
 * different arithmetic but a different question: n − 1 corrects a bias in
 * estimating a population nobody has seen, which is inference and is this
 * subject's boundary.
 *
 * The prompt has to NAME the disagreement, because a learner who checks against
 * a spreadsheet and gets 4.571 has been handed a contradiction rather than an
 * error. Asserting the reference alone would be satisfied by a prompt that said
 * nothing — which is exactly how a learner concludes the material is broken.
 */
const DS_VARIANCE = taskById('the-variance-is-the-mean-of-the-squared-deviations-1')
t('the variance divides by n and the prompt says so, naming the n − 1 answer it is not',
  DS_VARIANCE.reference === '4'
  && /\/8/.test(DS_VARIANCE.given)
  && /32\/7/.test(DS_VARIANCE.prompt)
  && /n − 1|n - 1/.test(DS_VARIANCE.prompt),
  `${DS_VARIANCE.given} = ${DS_VARIANCE.reference}`)
/*
 * And the multiplicities, which are the silent half. There are eight values and
 * five distinct ones, so the expression carries the counts 3 and 2 — and
 * summarising the distinct values instead gives a whole number too, 6, which is
 * what makes dropping them silent. Both numbers are named in the prompt.
 */
t('and it counts a repeated value every time, with the distinct-values answer named as wrong',
  /3\*\(b-m\)\^2/.test(DS_VARIANCE.given)
  && /2\*\(c-m\)\^2/.test(DS_VARIANCE.given)
  && /30 ÷ 5 = 6/.test(DS_VARIANCE.prompt),
  DS_VARIANCE.given)
/*
 * THE QUARTILE CONVENTION, which has to be stated or the figure is unverifiable
 * against any tool a learner owns. Halves of four and each half's own median
 * gives 2; interpolating between order statistics gives 1.5 on the same eight
 * numbers. The prompt names both and names the part that does NOT depend on the
 * convention — that replacing the largest value leaves it alone, which is the
 * actual claim.
 */
const DS_IQR = taskById('the-interquartile-range-reads-only-the-middle-of-the-list-1')
t('the quartile task states its convention and the figure the other one gives',
  DS_IQR.reference === '2'
  && /two halves of four/.test(DS_IQR.prompt)
  && /1\.5/.test(DS_IQR.prompt)
  && /unchanged|UNCHANGED/.test(DS_IQR.prompt),
  DS_IQR.prompt.slice(0, 60))
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, the property the tenth
 * subject's block argues is the most valuable thing new material can have and
 * the one that silently fails when somebody writes labels and leaves the
 * questions for later. Fifteen arrived and fifteen are authored, so the build's
 * authored fraction moved up rather than being diluted.
 */
t('all fifteen of its subgoals ship the question written, not just the label',
  allKnowledgePoints(DS).flatMap(p => p.workedExample.subgoals).length === 15
  && allKnowledgePoints(DS).flatMap(p => p.workedExample.subgoals)
    .every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  allKnowledgePoints(DS).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
t('and none of them is an imperative wearing a question mark',
  allKnowledgePoints(DS).flatMap(p => p.workedExample.subgoals).every(s =>
    s.socratic.trim().endsWith('?')
    && !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  allKnowledgePoints(DS).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic.trim().endsWith('?')
      || /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  allKnowledgePoints(DS).every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  allKnowledgePoints(DS).flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-logic.ts's HEADER, for the reason the six
 * blocks above do it: each is the kind of statement that otherwise rots into a
 * comment that used to be true.
 *
 * `propositional-logic` was promoted out of the `discrete-mathematics` map
 * area, and it is the FIRST authored concept anywhere in that area's seventeen
 * nodes. The structural half of the story — the root it was, the sixteen nodes
 * it reaches, the anchor it vacated — is in tests/atlas.mjs. What is checkable
 * HERE is that the material is real, that the subject rules with no worker, and
 * that the decisions its header argues for hold.
 *
 * THE DECISION THIS BLOCK EXISTS FOR, ahead of all the others, is the 1-and-0
 * encoding. `evaluate` asks for a number and a truth value is not one, so the
 * material writes true as 1 and false as 0 — and the risk that creates is a
 * learner who comes away believing the polynomial IS the connective, which is
 * false twice over: a connective is a table, and the identities hold on {0, 1}
 * and nowhere else. The header says the repair is to make the limit CONTENT
 * rather than a caveat, and three assertions below are what hold it to that:
 * the excluded-middle task must name the value at a half that breaks it, the
 * first point's statement must say the identities fail off the two values, and
 * the De Morgan task must point out that its own identity needs no such
 * appeal. A promotion that had quietly used the encoding to get gradable
 * numbers would ship the same eight references and pass everything else here.
 */
const SC = getOntology('statements-and-connectives')

group('statements-and-connectives, what a compound statement gets from its parts')
/*
 * SIXTH in the registry, and the position is the solids' argument run again.
 * The concept's only prerequisite is `geometric-proof` in `plane-geometry` at
 * index 2, so index 3 is the earliest the prerequisite ALLOWS — and indices 0
 * through 4 are each read by name by the blocks above, so 5 is the earliest
 * free slot. Both halves are asserted: the literal, and the relational claim
 * that actually matters, which is that it comes after the subject holding what
 * it rests on. The second is the one that stays meaningful when a thirteenth
 * subject moves the first.
 */
t('it is registered, and SIXTH — the earliest free slot behind the geometry it rests on',
  ONTOLOGIES[5] === SC && SC?.subject.id === 'statements-and-connectives')
t('and its position is behind the subject owning its prerequisite, which is the real claim',
  ONTOLOGIES.findIndex(o => o.subject.id === 'plane-geometry')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'statements-and-connectives')
  && !!conceptById(getOntology('plane-geometry'), 'geometric-proof'),
  `plane-geometry at ${ONTOLOGIES.findIndex(o => o.subject.id === 'plane-geometry')}, `
  + `connectives at ${ONTOLOGIES.findIndex(o => o.subject.id === 'statements-and-connectives')}`)
t('and it displaced none of the five positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure'))
t('it has no internal faults', ontologyProblems(SC).length === 0, ontologyProblems(SC).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(SC).length === 0)
t('one concept, three knowledge points',
  SC.concepts.length === 1 && allKnowledgePoints(SC).length === 3,
  `${SC.concepts.length} concepts, ${allKnowledgePoints(SC).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(SC, 'propositional-logic') && isPractisable(SC, 'propositional-logic'))
t('its points number from 1, which is per concept and not per subject',
  SC.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  SC.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(SC).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(SC).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * EVERY OBJECTIVE NAMES ONLY `evaluate`, the whole set this subject ships, by
 * the rule the tenth subject decided and the eleventh carried. An objective
 * naming a kind nothing serves can never be satisfied.
 *
 * `counterexample` is the one this subject had to refuse, and refusing it was
 * less obvious here than anywhere before: the second point is ABOUT what a
 * refutation must produce, so "give a number that ends in 6 and is odd" is the
 * natural ask and `counterexample` is declared verifiable in tasks.ts. It
 * ships no tasks, because ruling one needs a checker that can test a produced
 * object against a claim. So the objective asks for the two values the
 * refutation reduces to instead, and the second assertion below is what stops
 * the obvious-looking repair of naming the kind anyway.
 */
const SC_KINDS = new Set(allKnowledgePoints(SC).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  SC.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => SC_KINDS.has(k)))),
  SC.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...SC_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate}, so no objective names counterexample',
  SC_KINDS.size === 1 && SC_KINDS.has('evaluate')
  && SC.concepts.every(c => c.objectives.every(o => o.taskKinds.join(',') === 'evaluate'))
  && !SC.concepts.some(c => c.objectives.some(o => o.taskKinds.includes('counterexample'))),
  [...SC_KINDS].join('+'))
/*
 * THE EMPTY EDGE LIST, and here it is a judgement rather than a boundary —
 * which is what separates this subject from the four before it that reached an
 * empty `edges`.
 *
 * `expressions-and-equations` got there because its concept's prerequisites
 * were unwritten map nodes. `triangle-trigonometry` because both were authored
 * in ONE other subject. `solid-measure` because there was exactly one.
 * `data-summaries` because its two were in two DIFFERENT subjects, so no
 * ontology could have held both. This one has exactly one prerequisite and
 * `plane-geometry` CONTAINS it — so that subject could have taken the concept
 * and stranded nothing at all, which is the cheapest filing the cost rule has
 * ever offered and it was refused.
 *
 * The refusal is a judgement and a test cannot assert one. What it can assert
 * is that the alternative was really available, which is the second half
 * below: the far end is authored, in that subject, and that subject does not
 * contain this concept.
 */
t('it declares no edges, and the single concept is therefore its own root',
  SC.edges.length === 0 && roots(SC).length === 1 && roots(SC)[0] === 'propositional-logic')
t('and the subject that holds its one prerequisite could have taken it, which it did not',
  isTeachable(getOntology('plane-geometry'), 'geometric-proof')
  && !SC.concepts.some(c => c.id === 'geometric-proof')
  && !getOntology('plane-geometry').concepts.some(c => c.id === 'propositional-logic'),
  `geometric-proof@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === 'geometric-proof'))
    ?.subject.id}`)
/*
 * NO FIGURE, and this is the first subject in the build where the absence costs
 * nothing. A truth table IS the figure and it is TEXT, so every row of every
 * table here is written out in the worked examples. The contrast asserted is
 * with `data-summaries`, which omitted `visualRef` while carrying `histogram`
 * in its own search terms — an honest absence that did lose something. This
 * one's terms name no picture at all.
 */
t('no knowledge point claims a figure, and unlike the summaries none of its terms names one',
  allKnowledgePoints(SC).every(p => p.visualRef === undefined)
  && !/histogram|diagram|graph|picture|venn/i.test(SC.concepts[0].scope.hint),
  SC.concepts[0].scope.hint)
/*
 * No `automaticityTarget`, and the reason is sharper here than in the subjects
 * that merely had none worth setting. Filling in a row of a truth table is
 * four arithmetic operations and would time beautifully — and timing it would
 * reward exactly the reading this subject's header spends a section refusing,
 * where the polynomial is mistaken for the connective. The one thing a speed
 * reward could train here is the thing the material is trying to prevent.
 */
t('and no point claims a speed target, since speed would reward the encoding over the table',
  allKnowledgePoints(SC).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(SC).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done: widening in the same edit that adds material moves the
 * recognition figure in tests/atlas.mjs and the written-concept count together,
 * and there is no way afterwards to say which half did it. Asserted against the
 * literal, because the node is GONE and there is nothing left to compare with.
 *
 * The shortfall is in the concept's scope comment and in this file's header:
 * "Material conditional", "Logical connective", "Contraposition",
 * "Converse (logic)", "De Morgan's laws" and "Tautology (logic)" are all real
 * titles, all of them this concept's, and none matches.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(SC.concepts[0].scope.match)
    === String(/\b(propositional (logic|calculus)|boolean algebra|truth table)\b/i)
  && SC.concepts[0].fidelity === 'checked',
  String(SC.concepts[0].scope.match))

group('the twelfth subject is gradable with no worker')
const SC_TASKS = allKnowledgePoints(SC).flatMap(p => tasksForPoint(p.id))
/*
 * Eight tasks, three on the first point, two on the second, three on the third,
 * and the SHAPE is asserted rather than the total — a ratio over a total would
 * be satisfied by eight tasks distributed any way at all.
 *
 * The distribution is the content. The first point claims three separate
 * things (that the count is a power of two, that "or" is inclusive, and that
 * the arithmetic breaks off {0, 1}), the second claims exactly two (the
 * vacuous row and the refuting row, which is one expression at two inputs),
 * and the third claims three differences of columns — two that vanish and one
 * that does not.
 */
t('eight tasks: three on the first point, two on the second, three on the third',
  SC_TASKS.length === 8
  && allKnowledgePoints(SC).map(p => tasksForPoint(p.id).length).join(',') === '3,2,3',
  allKnowledgePoints(SC).map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
/*
 * ALL `evaluate` AND NO `transform_to_form`, which is a fact about the subject.
 * A `NamedForm` is a claim about the SHAPE of an expression, and the only
 * demand of that kind available here — "write this column as a polynomial in p
 * and q" — would grade the shape of an encoding rather than anything logical.
 * The third point's content is that two expressions are EQUAL, which an
 * `evaluate` on their difference asks and no form check can say.
 */
t('all eight are evaluate, and none demands a named form',
  SC_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined)
  && !SC_TASKS.some(x => x.kind === 'transform_to_form'),
  SC_TASKS.map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  SC_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  SC_TASKS.map(x => x.id).join(', '))
const scRulings = await Promise.all(SC_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  scRulings.every(r => r.verdict.ruling === 'correct'),
  scRulings.map((r, i) => `${SC_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * EVERY SUBSTITUTED INPUT IS A 0 OR A 1, which is the subject's whole premise
 * and the thing a later task would break without noticing.
 *
 * The identities the material uses are only the connectives' tables ON those
 * two values. An `at` of p = 2 would evaluate perfectly, rule correctly, and be
 * about nothing — `p + q - p*q` at p = q = 2 is 0, which is not a truth value
 * and not an error any other check here would report. The one exception is
 * deliberate and is excluded by name: `n` counts letters rather than carrying a
 * truth value, so the 2ⁿ task substitutes 3.
 */
t('every truth-value input is 0 or 1, since the identities are the tables only there',
  SC_TASKS.every(x => Object.entries(x.at)
    .every(([name, v]) => name === 'n' || v === '0' || v === '1')),
  SC_TASKS.flatMap(x => Object.entries(x.at).map(([k, v]) => `${x.id}:${k}=${v}`)).join(' '))
t('and the one input that is not is the letter COUNT rather than a letter',
  taskById('a-table-over-n-letters-has-two-to-the-n-rows-1').at.n === '3'
  && taskById('a-table-over-n-letters-has-two-to-the-n-rows-1').variables
    .every(v => v.name === 'n' && v.assumptions.integer && v.assumptions.positive),
  JSON.stringify(taskById('a-table-over-n-letters-has-two-to-the-n-rows-1').variables))
/*
 * THE IMPLICATION PAIR: ONE EXPRESSION AT TWO INPUTS WHOSE ANSWERS DIFFER.
 *
 * `1 - p + p*q` is 1 at p = 0, q = 0 and 0 at p = 1, q = 0 — the vacuous row
 * and the only refuting row. That is `geometric-proof`'s shape for scoring an
 * asymmetry, and asserting the SHARED `given` is what records it: two tasks
 * with different expressions would be two facts rather than one connective
 * asked twice. Asserted with the hypothesis held fixed at q = 0, because that
 * is what makes the pair about the hypothesis: both rows have a false
 * conclusion and only one of them makes the implication false.
 */
const SC_VACUOUS = taskById('a-false-hypothesis-makes-an-implication-true-1')
const SC_REFUTED = taskById('the-one-row-that-refutes-an-implication-1')
t('the implication pair is one expression at two inputs, differing only in the hypothesis',
  SC_VACUOUS.given === SC_REFUTED.given
  && SC_VACUOUS.reference === '1' && SC_REFUTED.reference === '0'
  && SC_VACUOUS.at.q === '0' && SC_REFUTED.at.q === '0'
  && SC_VACUOUS.at.p === '0' && SC_REFUTED.at.p === '1',
  `${SC_VACUOUS.given}: ${SC_VACUOUS.reference} at p=${SC_VACUOUS.at.p} and `
  + `${SC_REFUTED.reference} at p=${SC_REFUTED.at.p}`)
/*
 * THE TWO IDENTITIES THAT VANISH, scored as references of zero — and the
 * NON-VACUITY is the point, because a reference of 0 is the easiest thing in
 * this file to produce by accident.
 *
 * Both differences are identically zero as expressions, not merely at the row
 * substituted, so each is checked at ALL FOUR rows here rather than at the one
 * the task uses. A task whose difference happened to be zero at p = 1, q = 0
 * and non-zero elsewhere would pass every other assertion in this block and
 * would be teaching something false.
 */
const SC_CONTRA = taskById('an-implication-and-its-contrapositive-never-differ-1')
const SC_DEMORGAN = taskById('de-morgan-is-two-columns-that-coincide-1')
const ALL_ROWS = [['0', '0'], ['0', '1'], ['1', '0'], ['1', '1']]
t('the two vanishing differences are zero at every row, not just at the one substituted',
  [SC_CONTRA, SC_DEMORGAN].every(x => x.reference === '0' && ALL_ROWS.every(([p, q]) => {
    const tree = parseExpression(x.given, ['p', 'q'])
    const v = exactValue(substitute(tree, { p: parseExpression(p, []), q: parseExpression(q, []) }))
    return v !== null && v.n === 0n
  })),
  [SC_CONTRA, SC_DEMORGAN].map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * THE ONE THAT DOES NOT VANISH, and its sign is the reading.
 *
 * An implication minus its converse is exactly q − p: zero on the two rows
 * where the letters agree, and ±1 on the other two with the sign saying which
 * of the pair is true. Asserted as all four rows rather than as the one
 * reference, because the content is the PATTERN — a single −1 would be
 * consistent with the difference being −1 everywhere, which would make the
 * converse simply the negation of the implication and is a different and false
 * claim.
 */
const SC_CONVERSE = taskById('an-implication-and-its-converse-differ-by-q-minus-p-1')
t('the converse difference is q − p: zero where the letters agree, signed where they do not',
  SC_CONVERSE.reference === '-1'
  && ALL_ROWS.every(([p, q]) => {
    const tree = parseExpression(SC_CONVERSE.given, ['p', 'q'])
    const v = exactValue(substitute(tree, { p: parseExpression(p, []), q: parseExpression(q, []) }))
    return v !== null && v.n === BigInt(Number(q) - Number(p))
  }),
  ALL_ROWS.map(([p, q]) => `${p}${q}:${showExact(exactValue(substitute(
    parseExpression(SC_CONVERSE.given, ['p', 'q']),
    { p: parseExpression(p, []), q: parseExpression(q, []) })))}`).join(' '))
/*
 * THE ENCODING'S LIMIT, ASSERTED AS THE SHAPE OF THE PROMPT RATHER THAN AS A
 * NUMBER — the same move the variance task's n divisor needed, and for a
 * stronger reason.
 *
 * The excluded-middle task's reference is 1, which is also the answer at its
 * other row, so the NUMBER scores nothing the inclusive-or task has not already
 * scored. The task exists for what its prompt says: that the expression is
 * 1 − p + p², that this is not the constant 1, and that it is 3/4 at p = 1/2 —
 * so the identity holds because p² = p on the two truth values and nowhere
 * else. Asserting the reference alone would be satisfied by a prompt that said
 * none of it, which is precisely the silent version of this promotion that the
 * header warns against.
 */
const SC_EXCLUDED = taskById('the-excluded-middle-is-a-tautology-only-on-the-two-values-1')
t('the excluded-middle task names the value that breaks its own identity',
  SC_EXCLUDED.reference === '1'
  && /3\/4/.test(SC_EXCLUDED.prompt)
  && /1\/2/.test(SC_EXCLUDED.prompt)
  && /p²|p\^2/.test(SC_EXCLUDED.prompt),
  SC_EXCLUDED.prompt.slice(0, 80))
t('and it declares one letter, since the statement it is about mentions one',
  SC_EXCLUDED.variables.length === 1 && SC_EXCLUDED.variables[0].name === 'p'
  && Object.keys(SC_EXCLUDED.at).join(',') === 'p',
  SC_EXCLUDED.variables.map(v => v.name).join(','))
/*
 * And the contrast that keeps that limit a fact rather than a caveat: De
 * Morgan's identity needs NO appeal to p² = p, and its prompt says so. Two
 * identities, one restricted and one not, both checkable by the learner — which
 * is the difference between teaching a constraint and asking somebody to accept
 * one.
 */
t('and the De Morgan prompt says its own identity needs no such restriction',
  /p²|p\^2/.test(SC_DEMORGAN.prompt)
  && /\bno\b|without/i.test(SC_DEMORGAN.prompt),
  SC_DEMORGAN.prompt.slice(-90))
/*
 * THE INCLUSIVE OR, asserted on the row that carries the claim. Three of the
 * four rows of `p + q - p*q` are uncontroversial; the both-true row is the one
 * where the mathematical reading and the English one part, so that is the row
 * the task substitutes and the prompt has to say which it is.
 */
const SC_OR = taskById('or-is-inclusive-so-both-true-makes-it-true-1')
t('the or task asks the both-true row specifically, and the prompt names it as the one that parts',
  SC_OR.at.p === '1' && SC_OR.at.q === '1' && SC_OR.reference === '1'
  && /INCLUSIVE|inclusive/.test(SC_OR.prompt)
  && /exclusive/.test(SC_OR.prompt),
  `${SC_OR.given} at p=${SC_OR.at.p}, q=${SC_OR.at.q} = ${SC_OR.reference}`)
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, the property the tenth
 * subject's block argues is the most valuable thing new material can have and
 * the one that silently fails when somebody writes labels and leaves the
 * questions for later. Twelve arrived and twelve are authored, so the build's
 * authored fraction moved up rather than being diluted.
 */
t('all twelve of its subgoals ship the question written, not just the label',
  allKnowledgePoints(SC).flatMap(p => p.workedExample.subgoals).length === 12
  && allKnowledgePoints(SC).flatMap(p => p.workedExample.subgoals)
    .every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  allKnowledgePoints(SC).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
t('and none of them is an imperative wearing a question mark',
  allKnowledgePoints(SC).flatMap(p => p.workedExample.subgoals).every(s =>
    s.socratic.trim().endsWith('?')
    && !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  allKnowledgePoints(SC).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic.trim().endsWith('?')
      || /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  allKnowledgePoints(SC).every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  allKnowledgePoints(SC).flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * These assert the CLAIMS IN ontology-quantifiers.ts's HEADER, for the reason
 * the seven blocks above do it: each is the kind of statement that otherwise
 * rots into a comment that used to be true.
 *
 * `quantifiers` was promoted out of `discrete-mathematics` one promotion after
 * `propositional-logic`, which is the first time two consecutive promotions have
 * come out of one area up one chain. The structural half of that story — the
 * edge the previous promotion correctly left alone and then had to strand, the
 * assertion that threw rather than going vacuous, the root set turning over for
 * the third time — is in tests/atlas.mjs. What is checkable HERE is that the
 * material is real, that the subject rules with no worker, and that the
 * decisions its header argues for hold.
 *
 * THE DECISION THIS BLOCK EXISTS FOR, ahead of all the others, is that the
 * finite-domain arithmetic is EXTENDED from the twelfth subject rather than
 * reinvented. There, true was 1 and false 0 and each connective was the
 * polynomial reproducing its table. Here "for all" is the product of a
 * predicate's values and "there exists" is 1 minus the product of their
 * opposites — so a quantifier is a connective REPEATED across a domain, and the
 * tasks say so by sharing their expressions across a point boundary rather than
 * by asserting it in prose. Three assertions below hold the promotion to that:
 * the two expressions really are shared, every substituted truth value is a 0 or
 * a 1, and the point where the arithmetic STOPS — an infinite domain, where
 * there is no last factor — is named in the material rather than left as a
 * caveat. A promotion that had quietly used the products to get gradable numbers
 * would ship the same nine references and pass everything else here.
 */
const PQ = getOntology('predicates-and-quantifiers')

group('predicates-and-quantifiers, a statement with a hole and the words that close it')
/*
 * SEVENTH in the registry, and the first position in that array a prerequisite
 * decided on its own. The concept's only prerequisite is `propositional-logic`
 * in `statements-and-connectives` at index 5, so index 6 is the earliest the
 * prerequisite ALLOWS — and index 6 was free, 5 being the furthest anything
 * reads positionally. Both halves are asserted: the literal, and the relational
 * claim that actually matters, which is that it comes after the subject holding
 * what it rests on. The second is the one that stays meaningful when a
 * fourteenth subject moves the first.
 */
t('it is registered, and SEVENTH — the earliest slot its prerequisite allows',
  ONTOLOGIES[6] === PQ && PQ?.subject.id === 'predicates-and-quantifiers')
t('and its position is behind the subject owning its prerequisite, which is the real claim',
  ONTOLOGIES.findIndex(o => o.subject.id === 'statements-and-connectives')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'predicates-and-quantifiers')
  && !!conceptById(getOntology('statements-and-connectives'), 'propositional-logic'),
  `connectives at ${ONTOLOGIES.findIndex(o => o.subject.id === 'statements-and-connectives')}, `
  + `quantifiers at ${ONTOLOGIES.findIndex(o => o.subject.id === 'predicates-and-quantifiers')}`)
t('and it displaced none of the six positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure')
  && ONTOLOGIES[5] === getOntology('statements-and-connectives'))
t('it has no internal faults', ontologyProblems(PQ).length === 0, ontologyProblems(PQ).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(PQ).length === 0)
t('one concept, three knowledge points',
  PQ.concepts.length === 1 && allKnowledgePoints(PQ).length === 3,
  `${PQ.concepts.length} concepts, ${allKnowledgePoints(PQ).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(PQ, 'quantifiers') && isPractisable(PQ, 'quantifiers'))
t('its points number from 1, which is per concept and not per subject',
  PQ.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  PQ.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(PQ).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(PQ).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * EVERY OBJECTIVE NAMES ONLY `evaluate`, the whole set this subject ships, by
 * the rule the tenth subject decided and the eleventh and twelfth carried. An
 * objective naming a kind nothing serves can never be satisfied.
 *
 * `counterexample` is the one this subject had to refuse, and it is the second
 * point's natural ask: "produce an n for which n² + n + 11 is composite". Ruling
 * one needs a checker that can test a produced object against a claim, and
 * tasks.ts declares the kind verifiable while shipping none of it. So the n is
 * GIVEN and the value asked instead, and the second assertion below is what
 * stops the obvious-looking repair of naming the kind anyway.
 */
const PQ_KINDS = new Set(allKnowledgePoints(PQ).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  PQ.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => PQ_KINDS.has(k)))),
  PQ.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...PQ_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate}, so no objective names counterexample',
  PQ_KINDS.size === 1 && PQ_KINDS.has('evaluate')
  && PQ.concepts.every(c => c.objectives.every(o => o.taskKinds.join(',') === 'evaluate'))
  && !PQ.concepts.some(c => c.objectives.some(o => o.taskKinds.includes('counterexample'))),
  [...PQ_KINDS].join('+'))
/*
 * THE EMPTY EDGE LIST, and here it is containment rather than the judgement the
 * twelfth subject's was. One concept, so no internal pair to join — and the one
 * prerequisite is authored in ANOTHER subject, which fails the containment test
 * exactly as an unwritten map node does. So the edge could not live here even if
 * somebody wanted it to, and tests/atlas.mjs asserts where it does live.
 *
 * The second half is the one that records the promotion: the subject that holds
 * that prerequisite could have taken the whole concept and stranded nothing, and
 * did not.
 */
t('it declares no edges, and the single concept is therefore its own root',
  PQ.edges.length === 0 && roots(PQ).length === 1 && roots(PQ)[0] === 'quantifiers')
t('and the subject that holds its one prerequisite could have taken it, which it did not',
  isTeachable(getOntology('statements-and-connectives'), 'propositional-logic')
  && !PQ.concepts.some(c => c.id === 'propositional-logic')
  && !getOntology('statements-and-connectives').concepts.some(c => c.id === 'quantifiers'),
  `propositional-logic@${ONTOLOGIES.find(o =>
    o.concepts.some(c => c.id === 'propositional-logic'))?.subject.id}`)
/*
 * NO FIGURE, AND UNLIKE THE TWELFTH SUBJECT THE ABSENCE COSTS SOMETHING — which
 * is worth asserting precisely because the honest version of this claim is the
 * weaker one. There, a truth table IS the figure and it is text, so nothing was
 * lost. Here the natural figure is a grid of ticks with the two quantifier
 * orders read off it by rows and by columns, and no such figure exists in this
 * build. So `visualRef` is absent rather than pointed at a placeholder, and the
 * file's header says what that costs instead of claiming it costs nothing.
 */
t('no knowledge point claims a figure, and the header admits what the absence costs',
  allKnowledgePoints(PQ).every(p => p.visualRef === undefined),
  allKnowledgePoints(PQ).filter(p => p.visualRef !== undefined).map(p => p.id).join(', '))
/*
 * No `automaticityTarget`, and the reason is the twelfth subject's sharpened by
 * one step. Multiplying four 0s and 1s would time beautifully — and timing it
 * would reward exactly the reading this subject's header spends a section
 * refusing, where the product is mistaken for the quantifier. The one thing a
 * speed reward could train here is the thing the material is trying to prevent.
 */
t('and no point claims a speed target, since speed would reward the product over the claim',
  allKnowledgePoints(PQ).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(PQ).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done: widening in the same edit that adds material moves the
 * recognition figure in tests/atlas.mjs and the written-concept count together,
 * and there is no way afterwards to say which half did it. Asserted against the
 * literal, because the node is GONE and there is nothing left to compare with.
 *
 * The shortfall this one leaves is the largest any promotion has recorded and is
 * named in the file's header: `\bquantifier\b` does not match "quantification",
 * so "Universal quantification" and "Existential quantification" — the two
 * likeliest titles for this concept — both miss.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(PQ.concepts[0].scope.match) === String(/\bquantifier\b/i)
  && PQ.concepts[0].fidelity === 'checked',
  String(PQ.concepts[0].scope.match))
t('and the shortfall that pattern leaves is named rather than quietly widened',
  !PQ.concepts[0].scope.match.test('Universal quantification')
  && !PQ.concepts[0].scope.match.test('Existential quantification')
  && PQ.concepts[0].scope.match.test('Quantifier (logic)'),
  `matches "Quantifier (logic)": ${PQ.concepts[0].scope.match.test('Quantifier (logic)')}`)

group('the thirteenth subject is gradable with no worker')
const PQ_TASKS = allKnowledgePoints(PQ).flatMap(p => tasksForPoint(p.id))
/*
 * Nine tasks, three on each point, and the SHAPE is asserted rather than the
 * total — a ratio over a total would be satisfied by nine tasks distributed any
 * way at all.
 *
 * The distribution is the content and it is even for once, because each point
 * claims three things. The first: the witness count, the universal as a product,
 * the existential as its co-product. The second: the value that refutes, the
 * negation duality as an identity, the counterexample count. The third: each
 * quantifier order, and then the relation that closes the gap between them.
 */
t('nine tasks, three on each of the three points',
  PQ_TASKS.length === 9
  && allKnowledgePoints(PQ).map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  allKnowledgePoints(PQ).map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, and none demands a named form',
  PQ_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined)
  && !PQ_TASKS.some(x => x.kind === 'transform_to_form'),
  PQ_TASKS.map(x => `${x.id}:${x.kind}:${x.form}`).join(', '))
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  PQ_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  PQ_TASKS.map(x => x.id).join(', '))
const pqRulings = await Promise.all(PQ_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  pqRulings.every(r => r.verdict.ruling === 'correct'),
  pqRulings.map((r, i) => `${PQ_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * EVERY SUBSTITUTED TRUTH VALUE IS A 0 OR A 1, the twelfth subject's premise
 * inherited unchanged and the thing a later task would break without noticing.
 * The products reproduce the quantifiers ON those two values and nowhere else:
 * an `at` of a = 2 would evaluate perfectly, rule correctly, and be about
 * nothing.
 *
 * The one exception is deliberate and is excluded by name. `n` is a MEMBER of
 * the domain a universal claim ranges over rather than a truth value, so the
 * refuting-case task substitutes 10 — and `WHOLE_NUMBER_INDEX` declares it
 * `integer` without `positive`, because the claim's domain includes 0 and the
 * worked example's search starts there.
 */
t('every truth-value input is 0 or 1, since the products reproduce the quantifiers only there',
  PQ_TASKS.every(x => Object.entries(x.at)
    .every(([name, v]) => name === 'n' || v === '0' || v === '1')),
  PQ_TASKS.flatMap(x => Object.entries(x.at).map(([k, v]) => `${x.id}:${k}=${v}`)).join(' '))
t('and the one input that is not is a member of the domain, declared without positive',
  taskById('nine-cases-in-a-row-are-not-a-proof-1').at.n === '10'
  && taskById('nine-cases-in-a-row-are-not-a-proof-1').variables
    .every(v => v.name === 'n' && v.assumptions.integer && !v.assumptions.positive),
  JSON.stringify(taskById('nine-cases-in-a-row-are-not-a-proof-1').variables))
/*
 * A QUANTIFIER IS A REPEATED CONNECTIVE, AND THE SHARED EXPRESSIONS ARE HOW THAT
 * IS SCORED RATHER THAN SAID.
 *
 * `a*b*c*d` is asked twice — once over a predicate's four values, where it is 0,
 * and once over four inner existentials, where it is 1 — which is the twelfth
 * subject's implication pair carried ACROSS a point boundary. The claim is that
 * a universal is one product whatever its factors mean, and two different
 * expressions would have said they were two facts. Same for the existential's
 * co-product, asked three times at three different rows.
 *
 * Asserted as the `given`s being IDENTICAL rather than as a count of distinct
 * expressions, because the whole content is which tasks share which.
 */
const PQ_FORALL = ['for-all-is-and-repeated-so-one-zero-factor-kills-it-1',
  'for-every-x-there-is-a-y-chosen-afresh-each-time-1'].map(taskById)
const PQ_EXISTS = ['there-exists-is-or-repeated-over-the-domain-1',
  'swapping-to-there-is-one-y-for-every-x-makes-it-false-1',
  'a-uniform-witness-closes-the-gap-between-the-two-orders-1'].map(taskById)
t('the universal is one product asked twice, over a predicate and over inner existentials',
  PQ_FORALL[0].given === 'a*b*c*d' && PQ_FORALL[1].given === 'a*b*c*d'
  && PQ_FORALL[0].reference === '0' && PQ_FORALL[1].reference === '1'
  && PQ_FORALL[0].knowledgePointId !== PQ_FORALL[1].knowledgePointId,
  PQ_FORALL.map(x => `${x.given}=${x.reference}`).join(' | '))
t('and the existential is one co-product asked three times, at three different rows',
  PQ_EXISTS.every(x => x.given === '1 - (1-a)*(1-b)*(1-c)*(1-d)')
  && PQ_EXISTS.map(x => x.reference).join(',') === '1,0,1'
  && new Set(PQ_EXISTS.map(x => Object.values(x.at).join(''))).size === 3,
  PQ_EXISTS.map(x => `${Object.values(x.at).join('')}=${x.reference}`).join(' | '))
/*
 * THE ONE IDENTITY, scored as a reference of zero — and the NON-VACUITY is the
 * point, because a reference of 0 is the easiest thing in this file to produce
 * by accident.
 *
 * Negating a universal gives an existential as the SAME expression, since
 * 1 − (1 − a) is a outright. So the difference is identically zero rather than
 * zero at the row substituted, and it is checked here at all SIXTEEN rows of the
 * four symbols. A task whose difference happened to vanish at a = b = c = 1,
 * d = 0 and nowhere else would pass every other assertion in this block and
 * would be teaching something false.
 */
const PQ_DUALITY = taskById('negating-a-universal-gives-an-existential-as-the-same-expression-1')
const FOUR_ROWS = Array.from({ length: 16 }, (_, m) =>
  [(m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1].map(String))
t('the negation duality is zero at every one of the sixteen rows, not just at the one asked',
  PQ_DUALITY.reference === '0' && FOUR_ROWS.every(row => {
    const tree = parseExpression(PQ_DUALITY.given, ['a', 'b', 'c', 'd'])
    const at = {}
    for (const [i, name] of ['a', 'b', 'c', 'd'].entries()) at[name] = parseExpression(row[i], [])
    const v = exactValue(substitute(tree, at))
    return v !== null && v.n === 0n
  }),
  `${PQ_DUALITY.reference} at ${Object.values(PQ_DUALITY.at).join('')}`)
t('and its prompt says the collapse needs no restriction, unlike the excluded middle',
  /a²|a\^2/.test(PQ_DUALITY.prompt)
  && /\bno\b|without/i.test(PQ_DUALITY.prompt),
  PQ_DUALITY.prompt.slice(-120))
/*
 * THE ENCODING'S LIMIT, ASSERTED AS THE SHAPE OF THE MATERIAL RATHER THAN AS A
 * NUMBER — the move the twelfth subject needed for the excluded middle, and here
 * for a limit that no task can carry at all.
 *
 * The products and the count require the domain to be FINITE. No `evaluate` can
 * ask about an infinite domain, because there is no value to produce; so the
 * fact has to live in the first point's statement and in its worked example, and
 * the only thing a test can do is insist it is there. Without this assertion the
 * subject would be a set of nine products with the reason they are allowed left
 * out, which is the silent version of this promotion.
 */
const PQ_FIRST = allKnowledgePoints(PQ)[0]
t('the first point says where the product stops, which no task can ask',
  /last factor|run out|does not run out/i.test(PQ_FIRST.statement)
  && PQ_FIRST.workedExample.subgoals.some(s =>
    /\barbitrary\b/i.test(s.detail) && /every whole number|infinite/i.test(s.detail))
  && /finite|run out/i.test(PQ_FIRST.workedExample.answer),
  PQ_FIRST.workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * AND EVERY FINITE-DOMAIN PROMPT NAMES ITS DOMAIN, since the subject's first
 * point is that a quantified claim quoted without one is not a statement. Each
 * of the eight symbol tasks repeats the four numbers in full rather than saying
 * "the same domain as before", because a learner meeting one task has not
 * necessarily read the one before it.
 *
 * ONE EXEMPTION, AND IT IS NAMED RATHER THAN SCOPED AROUND. The negation-duality
 * task is an IDENTITY: it holds over any four-member domain and over any
 * predicate, so naming 1, 2, 3, 4 there would be a false specificity — the
 * claim is not about those numbers. It names the domain's SIZE instead, which is
 * the only thing the identity depends on, and that is what the second clause
 * checks. Exempting it by id rather than by a predicate over the prompt is what
 * stops this assertion quietly widening to cover a future task that simply
 * forgot.
 */
t('and the domain is part of every finite-domain prompt, since a claim without one is not one',
  PQ_TASKS.filter(x => x.variables.some(v => v.name === 'a')
    && x.id !== PQ_DUALITY.id)
    .every(x => /1, 2, 3, 4/.test(x.prompt))
  && /four-member domain/.test(PQ_DUALITY.prompt)
  && !/1, 2, 3, 4/.test(PQ_DUALITY.prompt),
  PQ_TASKS.filter(x => x.variables.some(v => v.name === 'a')
    && x.id !== PQ_DUALITY.id && !/1, 2, 3, 4/.test(x.prompt)).map(x => x.id).join(', '))
/*
 * THE QUANTIFIER-ORDER PAIR, AND THE DIRECTION OF THE IMPLICATION.
 *
 * On 1, 2, 3, 4 with x + y = 5, "for every x there is a y" is 1 and "there is a
 * y for every x" is 0, so the difference is 1 — and it can never be −1, because
 * one y serving everybody serves each in particular. The asymmetry is asserted
 * as the two references, because the content is the pair and neither value says
 * anything alone. The third task is the relation where the gap closes, which is
 * what stops the pair being read as "the second order is always false".
 */
const PQ_WEAK = taskById('for-every-x-there-is-a-y-chosen-afresh-each-time-1')
const PQ_STRONG = taskById('swapping-to-there-is-one-y-for-every-x-makes-it-false-1')
const PQ_UNIFORM = taskById('a-uniform-witness-closes-the-gap-between-the-two-orders-1')
t('the mixed orders are scored as a pair, the weaker true and the stronger false',
  PQ_WEAK.reference === '1' && PQ_STRONG.reference === '0'
  && Number(PQ_WEAK.reference) - Number(PQ_STRONG.reference) === 1
  && PQ_WEAK.knowledgePointId === PQ_STRONG.knowledgePointId,
  `${PQ_WEAK.reference} - ${PQ_STRONG.reference}`)
t('and a third task closes the gap, so the stronger order is not taught as always false',
  PQ_UNIFORM.reference === '1'
  && PQ_UNIFORM.given === PQ_STRONG.given
  && /uniform|all four x/i.test(PQ_UNIFORM.prompt),
  `${PQ_UNIFORM.given} = ${PQ_UNIFORM.reference} at ${Object.values(PQ_UNIFORM.at).join('')}`)
/*
 * TEN SUPPORTING CASES AND A FALSE CLAIM, which is the second point's whole
 * business and the one place in this subject where a number alone would mislead.
 *
 * The reference is 121, and 121 is not interesting — what matters is that the
 * prompt names its factorisation, names the nine primes before it, and says what
 * the ten checks DO establish. Asserting the reference alone would be satisfied
 * by a prompt that said none of it, which is exactly the silent version of this
 * task: a learner who computes 121 and is not told it is 11 × 11 has learnt
 * arithmetic rather than the difference between evidence and proof.
 */
const PQ_REFUTE = taskById('nine-cases-in-a-row-are-not-a-proof-1')
t('the refuting task names its factorisation and the nine cases that supported the claim',
  PQ_REFUTE.reference === '121'
  && /11 × 11|11 \* 11/.test(PQ_REFUTE.prompt)
  && /101/.test(PQ_REFUTE.prompt)
  && /0 ≤ n ≤ 9/.test(PQ_REFUTE.prompt),
  PQ_REFUTE.prompt.slice(-200))
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, the property the tenth
 * subject's block argues is the most valuable thing new material can have and
 * the one that silently fails when somebody writes labels and leaves the
 * questions for later. Fourteen arrived and fourteen are authored, so the
 * build's authored fraction moved up rather than being diluted.
 */
t('all fourteen of its subgoals ship the question written, not just the label',
  allKnowledgePoints(PQ).flatMap(p => p.workedExample.subgoals).length === 14
  && allKnowledgePoints(PQ).flatMap(p => p.workedExample.subgoals)
    .every(s => typeof s.socratic === 'string' && s.socratic.length > 0),
  allKnowledgePoints(PQ).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic).map(s => s.label).join(' | '))
t('and none of them is an imperative wearing a question mark',
  allKnowledgePoints(PQ).flatMap(p => p.workedExample.subgoals).every(s =>
    s.socratic.trim().endsWith('?')
    && !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  allKnowledgePoints(PQ).flatMap(p => p.workedExample.subgoals)
    .filter(s => !s.socratic.trim().endsWith('?')
      || /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  allKnowledgePoints(PQ).every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  allKnowledgePoints(PQ).flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * A fourteenth subject: what you do when the cases do not run out.
 *
 * `proof-techniques` was a map node of `discrete-mathematics` and is now the
 * single concept of `methods-of-proof` in lib/concepts/ontology-proof.ts. The
 * structural half of the promotion — the third consecutive departure from one
 * area up one chain, the third `links` entry, the anchor slot emptying a second
 * time — is in tests/atlas.mjs. What is checkable HERE is that the material is
 * real, that the subject rules without a worker where it claims to, and that
 * the decisions its header argues for hold.
 *
 * THE DECISION THIS BLOCK EXISTS FOR, ahead of all the others, is that the
 * concept is not a fourth restatement of converse-versus-contrapositive. Three
 * shipped subjects already mention proof: `propositional-logic` PROVES that the
 * contrapositive is the same claim by subtracting columns, `geometric-proof`
 * draws the same distinction on one statement about triangles, and
 * `quantifiers` establishes the asymmetry between refuting and establishing a
 * universal. A promotion that simply said all of that again would pass every
 * count in this file. So four assertions below hold this one to its own
 * argument: the contrapositive identity is CITED and not re-derived, the two
 * techniques nothing else in the build covers are really here, and the two
 * facts imported from the arithmetic are named rather than smuggled.
 */
const MP = getOntology('methods-of-proof')

group('methods-of-proof, what you do when the cases do not run out')
/*
 * EIGHTH in the registry, which is the earliest slot its prerequisite allows
 * and the second position in that array a prerequisite decided on its own.
 * `quantifiers` is in `predicates-and-quantifiers` at index 6, so 7 is the
 * floor, and 7 was free. Both halves are asserted: the literal, and the
 * relational claim that actually matters, which is that it comes after the
 * subject holding what it rests on. The second is the one that stays meaningful
 * when a fifteenth subject moves the first — and the `data-summaries` block
 * above is the record of how often that happens, three promotions in a row.
 */
t('it is registered, and EIGHTH — the earliest slot its prerequisite allows',
  ONTOLOGIES[7] === MP && MP?.subject.id === 'methods-of-proof')
t('and its position is behind the subject owning its prerequisite, which is the real claim',
  ONTOLOGIES.findIndex(o => o.subject.id === 'predicates-and-quantifiers')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'methods-of-proof')
  && !!conceptById(getOntology('predicates-and-quantifiers'), 'quantifiers'),
  `quantifiers at ${ONTOLOGIES.findIndex(o => o.subject.id === 'predicates-and-quantifiers')}, `
  + `proof at ${ONTOLOGIES.findIndex(o => o.subject.id === 'methods-of-proof')}`)
t('and it displaced none of the seven positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure')
  && ONTOLOGIES[5] === getOntology('statements-and-connectives')
  && ONTOLOGIES[6] === getOntology('predicates-and-quantifiers'))
t('it has no internal faults', ontologyProblems(MP).length === 0, ontologyProblems(MP).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(MP).length === 0)
t('one concept, three knowledge points',
  MP.concepts.length === 1 && allKnowledgePoints(MP).length === 3,
  `${MP.concepts.length} concepts, ${allKnowledgePoints(MP).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(MP, 'proof-techniques') && isPractisable(MP, 'proof-techniques'))
t('its points number from 1, which is per concept and not per subject',
  MP.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  MP.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(MP).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(MP).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * THE TWO KINDS THIS SUBJECT SHIPS, AND THE TWO IT REFUSES.
 *
 * `evaluate` and `transform_to_form`, which breaks the run of four consecutive
 * `evaluate`-only subjects and does so because the demand is real rather than
 * because variety is good: "write (2k + 1)² multiplied out" is the move the
 * contrapositive bought, and `expanded` is exactly that claim, since an
 * unexpanded power of a sum cannot be read for parity at all.
 *
 * `justify` is the kind this concept is REALLY about and is the one refusal that
 * is a ceiling rather than a gap. "Prove that if n² is even then n is even" is
 * the whole concept and nothing in this build can rule it, so naming it in an
 * objective would promise an observation that cannot be made — the rule the
 * tenth subject decided and the three after it carried. `counterexample` is
 * refused for the thirteenth subject's reason, one step along: the natural ask
 * is "produce a prime that is not on the list", and the factor is given and the
 * quotient asked instead.
 */
const MP_KINDS = new Set(allKnowledgePoints(MP).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  MP.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => MP_KINDS.has(k)))),
  MP.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...MP_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate, transform_to_form}, so neither refusal is named',
  [...MP_KINDS].slice().sort().join(',') === 'evaluate,transform_to_form'
  && MP.concepts.every(c => c.objectives.every(o =>
    !o.taskKinds.includes('justify') && !o.taskKinds.includes('counterexample')
    && !o.taskKinds.includes('state'))),
  [...MP_KINDS].join(','))
/*
 * THE EMPTY EDGE LIST, containment again rather than a judgement. One concept,
 * so no internal pair to join — and the one prerequisite is authored in ANOTHER
 * subject, which fails the containment test exactly as an unwritten map node
 * does. tests/atlas.mjs asserts where the edge does live.
 *
 * The second half is what records THIS promotion and is doubled where the
 * thirteenth subject's was single: BOTH logic subjects could have taken this
 * concept for less than a new subject costs — one holds the prerequisite and
 * the other holds the fact the first knowledge point cites — and neither did,
 * because each had already written it out of its own `covers`.
 */
t('it declares no edges, and the single concept is therefore its own root',
  MP.edges.length === 0 && roots(MP).length === 1 && roots(MP)[0] === 'proof-techniques')
t('and BOTH logic subjects could have taken it, which is why neither taking it is a decision',
  isTeachable(getOntology('predicates-and-quantifiers'), 'quantifiers')
  && isTeachable(getOntology('statements-and-connectives'), 'propositional-logic')
  && !getOntology('predicates-and-quantifiers').concepts.some(c => c.id === 'proof-techniques')
  && !getOntology('statements-and-connectives').concepts.some(c => c.id === 'proof-techniques')
  && !MP.concepts.some(c => c.id === 'quantifiers' || c.id === 'propositional-logic'),
  `proof-techniques@${ONTOLOGIES.find(o =>
    o.concepts.some(c => c.id === 'proof-techniques'))?.subject.id}`)
t('and both covers say so by naming the node they declined, so the boundary is findable',
  /`proof-techniques`/.test(getOntology('statements-and-connectives').subject.covers)
  && /`proof-techniques`/.test(getOntology('predicates-and-quantifiers').subject.covers)
  && /direct, contrapositive, contradiction, cases/i
    .test(getOntology('predicates-and-quantifiers').subject.covers),
  getOntology('predicates-and-quantifiers').subject.covers.slice(-200))
/*
 * NO FIGURE AND NO SPEED TARGET, and here BOTH absences are the easy kind.
 *
 * The thirteenth subject had to admit that its missing quantifier grid cost
 * something. Nothing of the sort applies here: every object is a whole number
 * written in a form and every move is a substitution or an expansion, so the
 * only drawing available — three residue classes as three rows of dots — would
 * illustrate the case split rather than decide it.
 *
 * The timing target is refused for the sharper of the two available reasons.
 * Expanding (2k + 1)² would time beautifully, and this concept is about
 * CHOOSING a starting end; a speed reward would train the expansion, which is
 * the step that is only worth doing once the choice has been made.
 */
t('no knowledge point claims a figure, and no drawing would have decided anything',
  allKnowledgePoints(MP).every(p => p.visualRef === undefined),
  allKnowledgePoints(MP).filter(p => p.visualRef !== undefined).map(p => p.id).join(', '))
t('and no point claims a speed target, since speed would reward the step after the choice',
  allKnowledgePoints(MP).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(MP).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done: widening in the same edit that adds material moves the
 * recognition figure in tests/atlas.mjs and the written-concept count together,
 * and there is no way afterwards to say which half did it. Asserted against the
 * literal, the node being GONE and there being nothing left to compare with.
 *
 * The shortfall is named in the file's header and the third knowledge point is
 * entirely about one of the misses: "Proof by cases" and "Proof by exhaustion"
 * are real titles and neither matches. The widening to avoid is `/\bproof\b/i`,
 * which would hand this concept "Proof of Fermat's Last Theorem" and "Burden of
 * proof" alike — so that is asserted too, as the thing a future widening must
 * not be.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(MP.concepts[0].scope.match)
    === String(/\b(mathematical proof|proof by contradiction|contraposition)\b/i)
  && MP.concepts[0].fidelity === 'checked',
  String(MP.concepts[0].scope.match))
t('and the shortfall that pattern leaves is named rather than quietly widened',
  !MP.concepts[0].scope.match.test('Proof by cases')
  && !MP.concepts[0].scope.match.test('Proof by exhaustion')
  && !MP.concepts[0].scope.match.test('Burden of proof')
  && MP.concepts[0].scope.match.test('Proof by contradiction')
  && MP.concepts[0].scope.match.test('Contraposition'),
  `cases: ${MP.concepts[0].scope.match.test('Proof by cases')}, `
  + `contradiction: ${MP.concepts[0].scope.match.test('Proof by contradiction')}`)

group('the fourteenth subject is new content, not a fourth pass at the contrapositive')
/*
 * THE IDENTITY IS CITED AND NOT RE-DERIVED, which is the claim the whole
 * promotion rests on and the one a careless version would have failed silently.
 *
 * `propositional-logic` proves that "if not Q then not P" has the same column as
 * "if P then Q" by multiplying out two polynomials. If this concept did that
 * again it would be a second pass dressed as a new subject. So the first point
 * must (a) say the fact is established elsewhere and (b) contain no polynomial
 * in p and q at all — its arithmetic is in k, over whole numbers, not over truth
 * values. Both halves are checked, and the second is the one with teeth: a
 * rewrite that quietly reintroduced `1 - p + p*q` anywhere in this subject's
 * tasks would fail it.
 */
const MP_FIRST = allKnowledgePoints(MP)[0]
const MP_TASKS = allKnowledgePoints(MP).flatMap(p => tasksForPoint(p.id))
t('the first point cites the identity rather than proving it again',
  /taken as given|proved two concepts down|subtracting columns/i.test(MP_FIRST.statement)
  && !MP_TASKS.some(x => /\bp\b/.test(x.given) && /\bq\b/.test(x.given))
  && MP_TASKS.every(x => x.variables.every(v => ['k', 'n', 'p', 'a', 'b', 'c', 'd', 'e', 'f']
    .includes(v.name))),
  MP_TASKS.map(x => x.given).join(' | '))
/*
 * AND WHAT IS NEW IS THE CHOICE, not the equivalence. The first point's worked
 * example has to spend a subgoal on the end that does NOT work, because "you may
 * start at either end" is only useful alongside a reason to prefer one — and
 * that reason is which hypothesis is a form you can substitute. A worked example
 * that only ran the successful direction would teach the contrapositive as a
 * ritual.
 */
t('and its worked example spends a subgoal on the starting end that fails',
  MP_FIRST.workedExample.subgoals.some(s =>
    /nothing to substitute|no form|has no first move|nothing there to put/i.test(s.detail))
  && /2m/.test(MP_FIRST.workedExample.answer),
  MP_FIRST.workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * THE TWO TECHNIQUES NOTHING ELSE IN THE BUILD COVERS ARE REALLY HERE.
 *
 * Contradiction and proof by cases appear in no other authored material — which
 * was checked across all thirteen shipped subjects before this one was written,
 * and is asserted here as the positive half only, since a negative sweep over
 * every `covers` would go red the day somebody legitimately mentions one in
 * passing. `roots-and-irrationals` RUNS a contradiction without naming the
 * technique, and the second point says so by pointing at it, which is the
 * division of labour that keeps the two from being the same material.
 */
t('contradiction and cases are each a point of their own, with the four shapes all named',
  /contradiction/i.test(allKnowledgePoints(MP)[1].statement)
  && /cases/i.test(allKnowledgePoints(MP)[2].statement)
  && /direct, contrapositive, contradiction, cases/i.test(MP.subject.covers),
  allKnowledgePoints(MP).map(p => p.id).join(' | '))
t('and the contradiction point points at the one this build had already run',
  /√2|not a ratio/i.test(allKnowledgePoints(MP)[1].statement)
  && isTeachable(ARITHMETIC_FOUNDATIONS, 'roots-and-irrationals'),
  allKnowledgePoints(MP)[1].statement.slice(-200))
/*
 * THE TWO IMPORTED FACTS ARE NAMED IN THE MATERIAL, not only in the header.
 *
 * Neither is a prerequisite the map declares. "Every whole number above 1 has a
 * prime factor" is `prime-factorisation`'s and is what the contradiction closes
 * on; the general statement that dividing by p leaves one of p remainders is
 * `division-algorithm`, which is a node ABOVE this concept and names it as a
 * prerequisite — so the general form may NOT be leaned on and the third point
 * says it is using the single instance for 3 instead.
 *
 * That second one is the assertion worth having, because leaning on a concept
 * that depends on you is a circularity no suite can detect: `division-algorithm`
 * is unwritten, so nothing fails, and the material would simply be resting on
 * something a learner has not met and the map says comes later.
 */
t('the imported arithmetic is named where it is used, including the one that comes later',
  /unique factorisation|prime factor/i.test(allKnowledgePoints(MP)[1]
    .workedExample.subgoals.map(s => s.detail).join(' '))
  && /`division-algorithm`/.test(allKnowledgePoints(MP)[2]
    .workedExample.subgoals.map(s => s.detail).join(' '))
  && /above this one|single instance/i.test(allKnowledgePoints(MP)[2]
    .workedExample.subgoals.map(s => s.detail).join(' ')),
  allKnowledgePoints(MP)[2].workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * The other half of that claim — that `division-algorithm` really does name
 * this concept as a prerequisite, so the "comes later" is the map's word and not
 * this file's — needs the COMPOSED atlas and is asserted in tests/atlas.mjs,
 * which has it. This harness only ever loads one ontology at a time.
 */

group('the fourteenth subject grades its evaluate half with no worker')
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE is asserted rather than the
 * total — a ratio over a total would be satisfied by nine tasks distributed any
 * way at all.
 *
 * The split between the kinds is 7 evaluate and 2 transform, and it is asserted
 * because it is load-bearing twice over. The transform pair needs the worker for
 * equivalence, so a subject that was ALL transforms would be ungradable without
 * one and would have to be named in `WORKERLESS_CONCEPTS` above; and the two of
 * them are the same demand on the same shape in two different points, which is
 * the parallel between the odd case and the 3k + 2 case drawn in the tasks
 * rather than in prose.
 */
t('nine tasks, three on each of the three points',
  MP_TASKS.length === 9
  && allKnowledgePoints(MP).map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  allKnowledgePoints(MP).map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('seven evaluate and two transform, the transforms being one demand asked twice',
  MP_TASKS.filter(x => x.kind === 'evaluate').length === 7
  && MP_TASKS.filter(x => x.kind === 'transform_to_form').length === 2
  && MP_TASKS.filter(x => x.kind === 'transform_to_form').every(x => x.form === 'expanded')
  && new Set(MP_TASKS.filter(x => x.kind === 'transform_to_form')
    .map(x => x.knowledgePointId)).size === 2,
  MP_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
const MP_EVALS = MP_TASKS.filter(x => x.kind === 'evaluate')
t('every evaluate reference is exactly reproducible from the given — no worker consulted',
  MP_EVALS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  MP_EVALS.map(x => x.id).join(', '))
const mpRulings = await Promise.all(MP_EVALS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  mpRulings.every(r => r.verdict.ruling === 'correct'),
  mpRulings.map((r, i) => `${MP_EVALS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * "FOR AN ARBITRARY MEMBER OF THE CASE" IS THE CONCEPT AND IT IS SCORED RATHER
 * THAN SAID — the assertion this block exists for.
 *
 * Two of the nine `evaluate` tasks are expressions that are identically 1:
 * (2k + 1)² − 4(k² + k) and (3k + 2)² − 3(3k² + 4k + 1). The answer does not
 * depend on the k substituted, which is exactly what makes each a proof about
 * every member of its case rather than a check at one — and it is the previous
 * subject's lesson inverted, where ten agreeable values of n settled nothing
 * BECAUSE the value depended on n.
 *
 * Checked at twelve further values of k rather than at the one asked, for the
 * reason the thirteenth subject checked its duality at all sixteen rows: a task
 * whose difference happened to vanish at k = 7 and nowhere else would pass every
 * other assertion here and would be teaching something false. The range runs
 * from 0 deliberately, since `CASE_INDEX` declares k without `positive` and k = 0
 * is the smallest instance of each case.
 */
const MP_ARBITRARY = ['an-arbitrary-odd-square-leaves-remainder-one-1',
  'the-missing-case-leaves-remainder-one-for-every-k-1'].map(taskById)
t('the two "arbitrary member" tasks are identically 1, checked well away from the k asked',
  MP_ARBITRARY.every(x => x.reference === '1'
    && x.variables.length === 1 && x.variables[0].name === 'k'
    && Array.from({ length: 13 }, (_, i) => String(i)).every(kv => {
      const v = exactValue(substitute(parseExpression(x.given, ['k']), { k: parseExpression(kv, []) }))
      return v !== null && v.n === 1n && v.d === 1n
    })),
  MP_ARBITRARY.map(x => `${x.given} at k=${x.at.k}`).join(' | '))
t('and they sit in different points on different splits, so independence is not a fact about 2',
  MP_ARBITRARY[0].knowledgePointId !== MP_ARBITRARY[1].knowledgePointId
  && MP_ARBITRARY[0].at.k !== MP_ARBITRARY[1].at.k
  && /2\*k/.test(MP_ARBITRARY[0].given) && /3\*k/.test(MP_ARBITRARY[1].given),
  MP_ARBITRARY.map(x => `${x.knowledgePointId}@k=${x.at.k}`).join(' | '))
/*
 * READING A REMAINDER IS ONE MOVE, AND THE SHARED EXPRESSION IS HOW THAT IS
 * SCORED RATHER THAN SAID — the thirteenth subject's technique applied to a
 * different claim.
 *
 * `n - p*k` is asked twice across a point boundary: at n = 30031, p = 13 it
 * answers "does anything on the assumed-complete list divide N", where a
 * remainder of 1 means no; at n = 2027, p = 3 it answers "which case is this
 * number in", where a remainder of 2 names the case a two-case split dropped.
 * Two different facts and ONE move, and two differently-written expressions
 * would have said they were two moves.
 *
 * Asserted as the `given`s being IDENTICAL and the references DIFFERENT, because
 * the whole content is that one expression carries both.
 */
const MP_REMAINDER = ['a-remainder-of-one-means-nothing-on-the-list-divides-it-1',
  'which-case-a-number-is-in-decides-whether-a-split-covers-it-1'].map(taskById)
t('one remainder expression answers two different questions in two different points',
  MP_REMAINDER.every(x => x.given === 'n - p*k')
  && MP_REMAINDER[0].reference === '1' && MP_REMAINDER[1].reference === '2'
  && MP_REMAINDER[0].knowledgePointId !== MP_REMAINDER[1].knowledgePointId,
  MP_REMAINDER.map(x => `${x.given}=${x.reference}`).join(' | '))
/*
 * THE TRANSFORM PAIR REALLY DEMANDS A CHANGE OF SHAPE, which the global
 * `shapeHolds` sweep near the top of this file already checks for every form
 * task in the build — so what is added here is the pair's own claim: both are
 * `expanded` on a squared binomial, in two different points, because reading a
 * case for a remainder means multiplying its form out and that is one technique
 * rather than two tricks.
 */
t('both transforms demand expansion of a squared case form, in two different points',
  MP_TASKS.filter(x => x.kind === 'transform_to_form')
    .every(x => /\^2$/.test(x.given.trim()) && x.form === 'expanded'
      && x.variables.length === 1 && x.variables[0].name === 'k'),
  MP_TASKS.filter(x => x.kind === 'transform_to_form')
    .map(x => `${x.given} -> ${x.reference}`).join(' | '))
/*
 * THE CEILING, ASSERTED AS THE SHAPE OF THE MATERIAL RATHER THAN AS A NUMBER —
 * the move the thirteenth subject needed for its infinite domain, and here for
 * the concept's own subject.
 *
 * No task asks for an argument, because `justify` cannot be ruled. So each
 * point's tasks ask the one computation its argument turns on and the argument
 * lives in the worked example — which means the SUBGOALS carry more of the
 * teaching here than in most subjects, and the only thing a test can do is
 * insist every one of them is phrased as a question for the tutor to ask. The
 * three points' examples hold 15 subgoals between them, and every one is
 * authored rather than left to be phrased at ask time.
 */
t('no task asks for an argument, the kind that would being unrulable',
  MP_TASKS.every(x => x.kind !== 'justify' && x.kind !== 'state')
  && !isVerifiableKind('justify'),
  MP_TASKS.map(x => x.kind).join(' '))
t('so every subgoal of every example is authored as a question, since they carry the argument',
  allKnowledgePoints(MP).flatMap(p => p.workedExample.subgoals).length === 15
  && allKnowledgePoints(MP).every(p => p.workedExample.subgoals.every(s =>
    typeof s.socratic === 'string' && s.socratic.trim().endsWith('?'))),
  allKnowledgePoints(MP).flatMap(p => p.workedExample.subgoals)
    .filter(s => typeof s.socratic !== 'string' || !s.socratic.trim().endsWith('?'))
    .map(s => s.label).join(' | '))
t('and no question is an imperative with a question mark, which contains its own answer',
  allKnowledgePoints(MP).flatMap(p => p.workedExample.subgoals).every(s =>
    !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  allKnowledgePoints(MP).flatMap(p => p.workedExample.subgoals)
    .filter(s => /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  allKnowledgePoints(MP).every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  allKnowledgePoints(MP).flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * A fifteenth subject: an object fixed by what belongs to it.
 *
 * `sets` was a map node of `discrete-mathematics` and is now the single concept
 * of `sets-and-membership` in lib/concepts/ontology-sets.ts. The structural half
 * of the promotion — the fourth consecutive departure from one area, the fourth
 * `links` entry, and the root set SPLITTING instead of turning over — is in
 * tests/atlas.mjs. What is checkable HERE is that the material is real, that the
 * subject rules with no worker at all, and that the decisions its header argues
 * for hold.
 *
 * THE DECISION THIS BLOCK EXISTS FOR, ahead of all the others, is that the
 * concept is not a third pass at De Morgan. `propositional-logic` PROVES the two
 * identities by multiplying out polynomials in 0 and 1, and `quantifiers` proves
 * the quantified version by the same route one layer up. A promotion that simply
 * restated either would pass every count in this file. So the assertions below
 * hold this one to its own argument: the identity is CITED and not re-derived,
 * what is new is the step from a claim about truth values to a claim about SETS,
 * and the one thing this concept does that neither of those can — double
 * inclusion on an arbitrary member — is really the method of both its proofs.
 *
 * AND THE SECOND, WHICH IS UNUSUAL ENOUGH TO BE WORTH ITS OWN ASSERTIONS: the
 * absence of a figure here is not a shortfall but the third point's SUBJECT. The
 * material's claim is that a Venn diagram settles an identity only for as many
 * sets as it can draw, and the arithmetic behind that is exact — so this is the
 * first subject where "no `visualRef`" is checked alongside the numbers that
 * justify refusing one.
 */
const SETS = getOntology('sets-and-membership')

group('sets-and-membership, an object fixed by what belongs to it')
/*
 * NINTH in the registry, which is the earliest slot its prerequisite allows and
 * the third position in that array a prerequisite decided on its own.
 * `proof-techniques` is in `methods-of-proof` at index 7, so 8 is the floor, and
 * 8 was free. Both halves are asserted: the literal, and the relational claim
 * that actually matters, which is that it comes after the subject holding what it
 * rests on. The second is the one that stays meaningful when a sixteenth subject
 * moves the first — and the `data-summaries` block above is now the record of
 * FOUR consecutive promotions doing exactly that.
 */
t('it is registered, and NINTH — the earliest slot its prerequisite allows',
  ONTOLOGIES[8] === SETS && SETS?.subject.id === 'sets-and-membership')
t('and its position is behind the subject owning its prerequisite, which is the real claim',
  ONTOLOGIES.findIndex(o => o.subject.id === 'methods-of-proof')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')
  && !!conceptById(getOntology('methods-of-proof'), 'proof-techniques'),
  `proof at ${ONTOLOGIES.findIndex(o => o.subject.id === 'methods-of-proof')}, `
  + `sets at ${ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')}`)
t('and it displaced none of the eight positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure')
  && ONTOLOGIES[5] === getOntology('statements-and-connectives')
  && ONTOLOGIES[6] === getOntology('predicates-and-quantifiers')
  && ONTOLOGIES[7] === getOntology('methods-of-proof'))
t('it has no internal faults', ontologyProblems(SETS).length === 0, ontologyProblems(SETS).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(SETS).length === 0)
t('one concept, three knowledge points',
  SETS.concepts.length === 1 && allKnowledgePoints(SETS).length === 3,
  `${SETS.concepts.length} concepts, ${allKnowledgePoints(SETS).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(SETS, 'sets') && isPractisable(SETS, 'sets'))
t('its points number from 1, which is per concept and not per subject',
  SETS.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  SETS.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(SETS).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(SETS).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
/*
 * THE ONE KIND THIS SUBJECT SHIPS, AND THE THREE IT REFUSES.
 *
 * `evaluate` alone, which puts it back with the four consecutive evaluate-only
 * subjects the fourteenth broke — and the reason is an absence rather than a
 * preference, which is why it is asserted rather than noted.
 *
 * `transform_to_form` is the interesting refusal. The forms tasks.ts ships are
 * claims about an ALGEBRAIC shape, and there is no demand of shape in this
 * material: `2^n` is asked because the question is how many subsets there are,
 * not how to write the count, and the one place a shape really IS the answer is
 * the membership condition, which is a sentence rather than an expression. A form
 * invented for it would grade the shape of an encoding, which is what the two
 * logic subjects refused. `justify` is the kind the concept is really about —
 * "prove A \ (B ∩ C) = (A \ B) ∪ (A \ C)" — and `counterexample` is the natural
 * "produce a member of A that is not in B"; neither can be ruled, so neither may
 * be named in an objective.
 */
const SETS_KINDS = new Set(allKnowledgePoints(SETS).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  SETS.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => SETS_KINDS.has(k)))),
  SETS.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...SETS_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate}, so none of the three refusals is named',
  [...SETS_KINDS].slice().sort().join(',') === 'evaluate'
  && SETS.concepts.every(c => c.objectives.every(o =>
    !o.taskKinds.includes('justify') && !o.taskKinds.includes('counterexample')
    && !o.taskKinds.includes('transform_to_form') && !o.taskKinds.includes('state'))),
  [...SETS_KINDS].join(','))
/*
 * THE EMPTY EDGE LIST, containment again rather than a judgement. One concept, so
 * no internal pair to join — and the one prerequisite is authored in ANOTHER
 * subject, which fails the containment test exactly as an unwritten map node
 * does. tests/atlas.mjs asserts where the edge does live.
 *
 * The second half is what records THIS promotion, and it is the SHARPEST version
 * of it any of these four has had: the subject that could have taken this concept
 * for nothing is the one holding its SOLE prerequisite, so the filing was not one
 * cheap option among several — it was the only other option there was, and it was
 * unavailable because that subject had written the concept out of its own
 * `covers` by name.
 */
t('it declares no edges, and the single concept is therefore its own root',
  SETS.edges.length === 0 && roots(SETS).length === 1 && roots(SETS)[0] === 'sets')
t('the subject holding its SOLE prerequisite could have taken it, and declined in writing',
  isTeachable(getOntology('methods-of-proof'), 'proof-techniques')
  && !getOntology('methods-of-proof').concepts.some(c => c.id === 'sets')
  && !getOntology('predicates-and-quantifiers').concepts.some(c => c.id === 'sets')
  && !SETS.concepts.some(c => c.id === 'proof-techniques' || c.id === 'quantifiers'),
  `sets@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === 'sets'))?.subject.id}`)
t('and both covers say so by naming the node they declined, so the boundary is findable',
  /`sets`/.test(getOntology('methods-of-proof').subject.covers)
  && /`sets`/.test(getOntology('predicates-and-quantifiers').subject.covers)
  && /objects in their own right/i.test(getOntology('methods-of-proof').subject.covers)
  && /objects in their own right/i.test(getOntology('predicates-and-quantifiers').subject.covers),
  getOntology('methods-of-proof').subject.covers.slice(-220))
/*
 * NO FIGURE, AND HERE THE ABSENCE IS THE THIRD POINT'S SUBJECT RATHER THAN A
 * SHORTFALL — which no previous subject has been able to say.
 *
 * The thirteenth had to admit its missing quantifier grid cost something and the
 * fourteenth could say a drawing would have illustrated rather than decided. This
 * one goes further: the figure a reader expects is a Venn diagram, and the
 * material's claim is that such a diagram settles an identity only for as many
 * sets as it can draw. So the absence is asserted together with the material
 * making the argument for it, which is the only form in which "no figure" is a
 * decision rather than a gap.
 *
 * The speed target is refused for the same shape of reason as the fourteenth's.
 * Counting 2ⁿ would time beautifully, and the point is that each member is an
 * independent choice; a speed reward trains the doubling, and a learner who has
 * memorised the powers of two has not learned why they are the answer.
 */
t('no knowledge point claims a figure, and the third point argues for the absence',
  allKnowledgePoints(SETS).every(p => p.visualRef === undefined)
  && /venn diagram/i.test(allKnowledgePoints(SETS)[2].statement)
  && /region/i.test(allKnowledgePoints(SETS)[2].statement),
  allKnowledgePoints(SETS).filter(p => p.visualRef !== undefined).map(p => p.id).join(', '))
t('and no point claims a speed target, since speed would reward memorising the doubling',
  allKnowledgePoints(SETS).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(SETS).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done. Asserted against the literal, the node being GONE and
 * there being nothing left to compare with.
 *
 * AND THE OVERCLAIM IS ASSERTED AS AN OVERCLAIM, which is new. Every previous
 * promotion's version of this assertion checked titles the pattern FAILS to
 * reach; this pattern also reaches titles above its own depth, because
 * `\bset theory\b` matches "Axiomatic set theory" — a page this subject's
 * `covers` writes out of itself by name. The file's header argues that `checked`
 * survives it, on the ground that the match is right about the SUBJECT and wrong
 * about the DEPTH, and that is categorically unlike "Cantor set", which would be
 * a different field altogether. What is asserted here is that both facts are
 * true, so that whoever next narrows the pattern finds the claim rather than
 * discovering the behaviour.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(SETS.concepts[0].scope.match)
    === String(/\bset (theory|operations)\b|^set \(mathematics\)/i)
  && SETS.concepts[0].fidelity === 'checked',
  String(SETS.concepts[0].scope.match))
t('and the shortfall that pattern leaves is named rather than quietly widened',
  !SETS.concepts[0].scope.match.test('Algebra of sets')
  && !SETS.concepts[0].scope.match.test('Subset')
  && !SETS.concepts[0].scope.match.test('Power set')
  && !SETS.concepts[0].scope.match.test('Venn diagram')
  && !SETS.concepts[0].scope.match.test('Cantor set')
  && SETS.concepts[0].scope.match.test('Set theory')
  && SETS.concepts[0].scope.match.test('Set operations')
  && SETS.concepts[0].scope.match.test('Set (mathematics)'),
  `algebra of sets: ${SETS.concepts[0].scope.match.test('Algebra of sets')}, `
  + `cantor: ${SETS.concepts[0].scope.match.test('Cantor set')}`)
t('and it really does overclaim upward, which the header states rather than hides',
  SETS.concepts[0].scope.match.test('Axiomatic set theory')
  && SETS.concepts[0].scope.match.test('Naive set theory')
  && /`formal-logic-and-incompleteness`/.test(SETS.subject.covers)
  && /unwritten/i.test(SETS.subject.covers),
  `axiomatic: ${SETS.concepts[0].scope.match.test('Axiomatic set theory')}`)

group('the fifteenth subject is new content, not a third pass at De Morgan')
/*
 * THE IDENTITY IS CITED AND NOT RE-DERIVED, which is the claim the whole
 * promotion rests on and the one a careless version would have failed silently.
 *
 * `propositional-logic` proves De Morgan by multiplying out polynomials in 0 and
 * 1. If this concept did that again it would be a second pass dressed as a new
 * subject. So the third point must (a) say the fact is established elsewhere and
 * (b) contain no polynomial in p and q anywhere in the subject's tasks — its
 * arithmetic is in SIZES, over counts, not over truth values. Both halves are
 * checked, and the second is the one with teeth: a rewrite that quietly
 * reintroduced `1 - p*q` anywhere here would fail it.
 */
const SETS_POINTS = allKnowledgePoints(SETS)
const SETS_TASKS = SETS_POINTS.flatMap(p => tasksForPoint(p.id))
t('the third point cites De Morgan rather than proving it again',
  /`propositional-logic`/.test(SETS_POINTS[2].statement)
  && /proves|proved|established/i.test(SETS_POINTS[2].statement)
  && !SETS_TASKS.some(x => /\bp\b/.test(x.given) && /\bq\b/.test(x.given))
  && SETS_TASKS.every(x => x.variables.every(v => ['a', 'b', 'c', 'n', 'd', 'u', 'r']
    .includes(v.name))),
  SETS_TASKS.map(x => x.given).join(' | '))
/*
 * AND WHAT IS NEW IS THE STEP FROM TRUTH VALUES TO SETS, not the identity. "x is
 * in B" is a statement whose truth depends on x, so an identity holding at every
 * truth value holds at every x — and that sentence is the entire bridge between
 * the two subjects. A worked example that applied De Morgan without saying why it
 * applies would teach set algebra as a notation to be trusted.
 */
t('and its worked example says why a fact about two columns may be used on two sets',
  SETS_POINTS[2].workedExample.subgoals.some(s =>
    /truth value/i.test(s.detail) && /depends on x|for each x|every x/i.test(s.detail)),
  SETS_POINTS[2].workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * DOUBLE INCLUSION IS REALLY THE METHOD, IN BOTH PROOFS, which is the thing the
 * map node's own `is` promised — "proved by double inclusion rather than by
 * picture" — and the thing a version of this concept written around Venn
 * diagrams would have quietly dropped.
 *
 * Asserted on BOTH examples that prove an equality, not just the identity one.
 * The first point proves that the common divisors of 12 and 18 are the divisors
 * of 6, and it is the easier place to get this wrong: two lists that both read
 * 1, 2, 3, 6 look like a proof, and the example has to say in so many words that
 * they are not one.
 */
t('both equality proofs run two inclusions, and the first refuses its own two lists',
  SETS_POINTS[0].workedExample.subgoals.some(s =>
    /two inclusions|two directions/i.test(s.label + s.detail))
  && /never listed either set|two lists agreeing is a check|rather than observed/i
    .test(SETS_POINTS[0].workedExample.subgoals.map(s => s.detail).join(' '))
  && SETS_POINTS[2].workedExample.subgoals.filter(s =>
    /inclusion/i.test(s.label + s.detail)).length >= 2,
  SETS_POINTS[0].workedExample.subgoals.map(s => s.label).join(' | '))
t('and the identity proof runs the chain in both directions rather than once',
  /backwards|reversed|second inclusion/i
    .test(SETS_POINTS[2].workedExample.subgoals.map(s => s.label).join(' '))
  && /both hold|both inclusions/i.test(SETS_POINTS[2].workedExample.answer),
  SETS_POINTS[2].workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * THE TWO BOUNDARIES THE MATERIAL IMPORTS ARE NAMED WHERE THEY ARE USED, not
 * only in the header, and the second is the one worth the assertion.
 *
 * `gcd-and-lcm` COMPUTES the gcd; this concept says what it IS — the member whose
 * divisors are the whole list of common divisors. That is the division of labour
 * that keeps the first point from being a second pass at the arithmetic.
 *
 * `cardinality` is the boundary a careless version would have crossed without
 * noticing. The first point argues that a subset of the same FINITE size must be
 * the whole set, and that argument is false for infinite sets — the evens are a
 * proper subset of the whole numbers. So the material has to name the finiteness
 * and say where the infinite case lives, which is a node three steps above this
 * one and unwritten. A suite cannot detect the omission, so it is asserted.
 */
t('the gcd is named as something this concept explains rather than computes',
  /`gcd-and-lcm`/.test(SETS_POINTS[0].workedExample.subgoals.map(s => s.detail).join(' '))
  && /gcd\(12, 18\)/.test(SETS_POINTS[0].workedExample.answer)
  && isTeachable(ARITHMETIC_FOUNDATIONS, 'gcd-and-lcm'),
  SETS_POINTS[0].workedExample.answer.slice(-160))
t('and the finite-size argument names its own limit, which is a concept above this one',
  /`cardinality`/.test(SETS_TASKS.map(x => x.prompt).join(' '))
  && /finite/i.test(SETS_TASKS.map(x => x.prompt).join(' '))
  && /even/i.test(SETS_TASKS.map(x => x.prompt).join(' ')),
  SETS_TASKS.find(x => /`cardinality`/.test(x.prompt))?.id ?? 'none names it')

group('the fifteenth subject grades every task with no worker at all')
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE is asserted rather than the
 * total — a ratio over a total would be satisfied by nine tasks distributed any
 * way at all.
 *
 * All nine are `evaluate`, so the subject grades with no worker in full rather
 * than in part, which is the first time since the thirteenth that is true of a
 * new subject and is why it is asserted as an exact set rather than a majority.
 */
t('nine tasks, three on each of the three points',
  SETS_TASKS.length === 9
  && SETS_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  SETS_POINTS.map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, so nothing here needs the worker even for equivalence',
  SETS_TASKS.every(x => x.kind === 'evaluate')
  && SETS_TASKS.every(x => x.form === undefined),
  SETS_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
t('every reference is exactly reproducible from the given — no worker consulted',
  SETS_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  SETS_TASKS.map(x => x.id).join(', '))
const setsRulings = await Promise.all(SETS_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  setsRulings.every(r => r.verdict.ruling === 'correct'),
  setsRulings.map((r, i) => `${SETS_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * ONE EXPRESSION ACROSS THREE POINTS, which is further than any previous subject
 * has carried one — the fourteenth managed two and the thirteenth two.
 *
 * `a - c` is `|A| − |A ∩ B|`. At (6, 6) it is the second half of a double
 * inclusion, at (6, 4) a difference of two divisor sets, at (6, 2) one side of
 * the identity. The first is what the sharing is FOR: A ⊆ B is the case where the
 * overlap IS the smaller set, so an inclusion is a difference that came out zero
 * rather than a different kind of fact.
 *
 * Asserted as the `given`s being IDENTICAL, the references DIFFERENT, and the
 * three points DISTINCT, because the whole content is that one expression carries
 * all three.
 */
const SETS_DIFFS = SETS_TASKS.filter(x => x.given === 'a - c')
t('one difference expression answers three different questions in three different points',
  SETS_DIFFS.length === 3
  && new Set(SETS_DIFFS.map(x => x.knowledgePointId)).size === 3
  && SETS_DIFFS.map(x => x.reference).slice().sort().join(',') === '0,2,4',
  SETS_DIFFS.map(x => `${x.reference}@${x.at.a}-${x.at.c}`).join(' | '))
t('and the one that comes out zero is the inclusion, which is why it is the same expression',
  SETS_DIFFS.some(x => x.reference === '0' && x.at.a === x.at.c
    && /inclusion/i.test(x.prompt))
  && SETS_DIFFS.find(x => x.reference === '0').knowledgePointId === SETS_POINTS[0].id,
  SETS_DIFFS.find(x => x.reference === '0')?.id ?? 'none is zero')
/*
 * THE UNION CORRECTION IS ASKED TWICE AND THE SECOND ASKING REFUSES ITS OWN
 * EVIDENCE — the assertion this block exists for, and this subject's version of
 * the fourteenth's "a value that still mentions k settles nothing".
 *
 * `a + b - c` counts a union of two divisor sets at (6, 6, 4) and a union of two
 * DIFFERENCES at (2, 3, 1). The second answer is 4 and so is the left-hand side
 * of the identity, which looks like a proof and is strictly weaker than one:
 * equal sizes do not make equal sets. So the prompt has to say so and has to hand
 * over the refutation rather than leaving it, because a learner who could supply
 * {1, 2} against {3, 4} would not have needed the warning.
 *
 * This is the assertion that would catch the most damaging possible rewrite of
 * this concept — one that quietly let two agreeing counts stand as the proof.
 */
const SETS_UNIONS = SETS_TASKS.filter(x => x.given === 'a + b - c')
t('the union correction is one move asked on two kinds of set',
  SETS_UNIONS.length === 2
  && new Set(SETS_UNIONS.map(x => x.knowledgePointId)).size === 2
  && SETS_UNIONS.map(x => x.reference).slice().sort().join(',') === '4,8',
  SETS_UNIONS.map(x => `${x.reference}@${x.at.a}+${x.at.b}-${x.at.c}`).join(' | '))
t('and the one that matches the other side says plainly that agreement is not proof',
  (() => {
    const second = SETS_UNIONS.find(x => x.knowledgePointId === SETS_POINTS[2].id)
    return !!second
      && /check/i.test(second.prompt)
      && /not a proof|and not a proof/i.test(second.prompt)
      && /\{1, 2\}/.test(second.prompt) && /\{3, 4\}/.test(second.prompt)
      && /double inclusion/i.test(second.prompt)
  })(),
  SETS_UNIONS.map(x => x.id).join(' | '))
t('and both sides of that identity really do come out the same, on the stated sets',
  SETS_UNIONS.find(x => x.knowledgePointId === SETS_POINTS[2].id)?.reference
    === SETS_DIFFS.find(x => x.knowledgePointId === SETS_POINTS[2].id)?.reference,
  `${SETS_DIFFS.find(x => x.knowledgePointId === SETS_POINTS[2].id)?.reference} vs `
  + `${SETS_UNIONS.find(x => x.knowledgePointId === SETS_POINTS[2].id)?.reference}`)
/*
 * THE DIAGRAM TASK'S ARITHMETIC IS EXACT, AND IT IS RECOMPUTED HERE RATHER THAN
 * TRUSTED — the one place in this subject where a wrong number would be a wrong
 * claim about mathematics rather than a wrong count of tasks.
 *
 * The claim is that n sets have 2ⁿ membership cases, that n circles in general
 * position cut the plane into at most n² − n + 2 regions, that those two agree at
 * n = 1, 2 and 3, and that at n = 4 there are 16 cases and 14 regions. Both
 * formulae are checked below at every n the claim mentions, because the whole
 * argument of the third knowledge point rests on the agreement at 3 as much as on
 * the shortfall at 4: a diagram that failed at three sets would make the lesson
 * "pictures are unreliable", and the honest lesson is narrower and harder — the
 * picture you were shown is complete, and the method has a last case.
 *
 * Asked at n = 4 and not at 3, which is asserted: at 3 the answer is 0 and says
 * the opposite.
 */
const SETS_DIAGRAM = SETS_TASKS.find(x => x.given === '2^n - r')
t('the diagram task asks the shortfall at four sets, where there is one',
  !!SETS_DIAGRAM && SETS_DIAGRAM.at.n === '4' && SETS_DIAGRAM.at.r === '14'
  && SETS_DIAGRAM.reference === '2'
  && SETS_DIAGRAM.knowledgePointId === SETS_POINTS[2].id,
  `${SETS_DIAGRAM?.given} at n=${SETS_DIAGRAM?.at.n}, r=${SETS_DIAGRAM?.at.r} -> ${SETS_DIAGRAM?.reference}`)
t('and both of its formulae hold at every n the material claims them at',
  [1, 2, 3].every(n => 2 ** n === n * n - n + 2)
  && 2 ** 4 === 16 && 4 * 4 - 4 + 2 === 14
  && 2 ** 4 - (4 * 4 - 4 + 2) === Number(SETS_DIAGRAM.reference),
  [1, 2, 3, 4].map(n => `n=${n}: ${2 ** n} cases, ${n * n - n + 2} regions`).join('; '))
t('and the prompt computes the three-set case too, so the lesson is not "pictures lie"',
  /3² − 3 \+ 2 = 8/.test(SETS_DIAGRAM.prompt)
  && /complete/i.test(SETS_DIAGRAM.prompt)
  && /ellipse/i.test(SETS_DIAGRAM.prompt),
  SETS_DIAGRAM.prompt.slice(-260))
/*
 * THE POWER-SET TASK AND THE DIAGRAM TASK BOTH EVALUATE A POWER OF TWO, AND THEY
 * ARE DELIBERATELY NOT THE SAME TASK. In the first `n` counts the MEMBERS of one
 * set; in the second it counts the SETS a claim is about. Two readings of one
 * letter inside one concept, which is why they have separate variable lists in
 * tasks.ts — and why the first is asked at 6 rather than at 4, since identical
 * expression, substitution and answer would have read as one task duplicated.
 */
t('the two powers of two are asked at different n, being two readings of one letter',
  (() => {
    const powers = SETS_TASKS.filter(x => /2\^n/.test(x.given))
    return powers.length === 2
      && new Set(powers.map(x => x.at.n)).size === 2
      && new Set(powers.map(x => x.reference)).size === 2
      && new Set(powers.map(x => x.knowledgePointId)).size === 2
  })(),
  SETS_TASKS.filter(x => /2\^n/.test(x.given))
    .map(x => `${x.given}@n=${x.at.n}=${x.reference}`).join(' | '))
/*
 * THE CEILING, ASSERTED AS THE SHAPE OF THE MATERIAL RATHER THAN AS A NUMBER, and
 * it is a different ceiling from the fourteenth subject's.
 *
 * There the unrulable thing was the ARGUMENT. Here it is the ANSWER: the engine
 * grades an expression, so no task can ask for a SET and every one asks for a
 * count. The consequence is specific and is the reason the worked examples are
 * long — a learner can be asked how big an intersection is and not which members
 * are in it, so no task can catch somebody right by the wrong route. What a test
 * can insist on is that the examples list the members the tasks cannot ask for,
 * and that every subgoal is phrased as a question for the tutor to ask. The three
 * examples hold 16 subgoals between them and every one is authored.
 */
t('no task asks for an argument or for a set, both kinds being unrulable here',
  SETS_TASKS.every(x => x.kind !== 'justify' && x.kind !== 'state')
  && !isVerifiableKind('justify')
  && SETS_TASKS.every(x => /^[-+*^/()0-9a-z .]+$/.test(x.given)),
  SETS_TASKS.map(x => x.kind).join(' '))
t('and the worked examples write out the members no task can ask for',
  SETS_POINTS.every(p => /\{1, 2, 3, 4, 6, 12\}/
    .test(p.workedExample.subgoals.map(s => s.detail).join(' ')
      + p.workedExample.problem + p.workedExample.answer)),
  SETS_POINTS.map(p => `${p.position}:${/\{1, 2, 3, 4, 6, 12\}/
    .test(p.workedExample.subgoals.map(s => s.detail).join(' ')
      + p.workedExample.problem + p.workedExample.answer)}`).join(' '))
t('so every subgoal of every example is authored as a question, since they carry the argument',
  SETS_POINTS.flatMap(p => p.workedExample.subgoals).length === 16
  && SETS_POINTS.every(p => p.workedExample.subgoals.every(s =>
    typeof s.socratic === 'string' && s.socratic.trim().endsWith('?'))),
  SETS_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => typeof s.socratic !== 'string' || !s.socratic.trim().endsWith('?'))
    .map(s => s.label).join(' | '))
t('and no question is an imperative with a question mark, which contains its own answer',
  SETS_POINTS.flatMap(p => p.workedExample.subgoals).every(s =>
    !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  SETS_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  SETS_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  SETS_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * The SIXTEENTH subject, from the forty-fourth promotion: counting.
 *
 * `counting-principles` was a node of `discrete-mathematics` and is the whole of
 * `counting-and-arrangements`. The structural half of the promotion is asserted
 * in tests/atlas.mjs — the node being gone, the two `links` entries carrying its
 * stranded edges, the armature slot refilled. What is asserted here is the
 * MATERIAL, and three things about it that no count would catch.
 *
 * FIRST, THAT IT IS NOT A SECOND PASS AT THE BINOMIAL THEOREM. C(9, 3) and the
 * fourth entry of row 9 are the same number, so a careless version of this
 * concept could have been Pascal's triangle retold — and it would have passed
 * every count in this file. The second point has to reach 84 by a route the other
 * concept does not have (a descending product over the orderings of one
 * selection) and then use the row as a CHECK, not as the derivation. Both halves
 * are asserted.
 *
 * SECOND, THAT THE TWO ONE-LINE RULES ARE PRESENTED WITH THEIR HYPOTHESES. The
 * product rule needs the option count to hold still and the division by r! needs
 * the overcount to be uniform, and both are conditions a learner can be taught to
 * skip. The first point's example is built to BREAK the product rule and say
 * where; the second's says the uniform overcount is why one division works. A
 * version that stated either rule without its condition is the likeliest wrong
 * version of this concept, so each condition is checked in the material.
 *
 * THIRD, THAT THE THREE-SET CORRECTION IS DERIVED AND NOT RECALLED. The
 * alternating signs are the thing people memorise wrongly, and the material's
 * claim is that they come out of auditing one element at a time. All three kinds
 * of element — in one set, in two, in all three — have to be audited, and the
 * arithmetic of each is recomputed here rather than trusted.
 */
const CA = getOntology('counting-and-arrangements')

group('counting-and-arrangements, a count built from the structure of a choice')
/*
 * ELEVENTH in the registry, and the first position in that array fixed by a
 * SECOND prerequisite rather than by what a test reads.
 *
 * The four insertions before this each went in at 8, behind the one subject
 * holding their one prerequisite. This subject has two, in two subjects, and had
 * to clear the LATER of them — `binomial-theorem` in `rational-expressions` at 9
 * — so index 10 is the floor its prerequisites allow and nothing had to be
 * weighed. Both halves are asserted, and the relational pair is the one that
 * stays meaningful when a seventeenth subject moves the literal: ontology.ts's
 * header says to prefer it, and the `data-summaries` block above is now the
 * record of FIVE consecutive promotions moving a literal index.
 */
t('it is registered, and ELEVENTH — the earliest slot its LATER prerequisite allows',
  ONTOLOGIES[10] === CA && CA?.subject.id === 'counting-and-arrangements')
t('and it is behind BOTH subjects owning its prerequisites, which is the real claim',
  ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'counting-and-arrangements')
  && ONTOLOGIES.findIndex(o => o.subject.id === 'rational-expressions')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'counting-and-arrangements')
  && !!conceptById(getOntology('sets-and-membership'), 'sets')
  && !!conceptById(getOntology('rational-expressions'), 'binomial-theorem'),
  `sets at ${ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')}, `
  + `rational at ${ONTOLOGIES.findIndex(o => o.subject.id === 'rational-expressions')}, `
  + `counting at ${ONTOLOGIES.findIndex(o => o.subject.id === 'counting-and-arrangements')}`)
/*
 * AND THE LATER PREREQUISITE IS WHAT BINDS, asserted as an inequality rather than
 * described. `sets-and-membership` at 8 would have allowed index 9; the floor is
 * 10 because `rational-expressions` sits at 9. A future reordering that moved the
 * binomial theorem above the sets would leave this subject's position correct for
 * a different reason, and this line is what would report that the binding
 * constraint had changed hands.
 */
t('and it is the LATER of the two that binds, which is why the slot is 10 and not 9',
  ONTOLOGIES.findIndex(o => o.subject.id === 'rational-expressions')
    > ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')
  && ONTOLOGIES.findIndex(o => o.subject.id === 'counting-and-arrangements')
    === ONTOLOGIES.findIndex(o => o.subject.id === 'rational-expressions') + 1,
  `rational at ${ONTOLOGIES.findIndex(o => o.subject.id === 'rational-expressions')}, `
  + `counting at ${ONTOLOGIES.findIndex(o => o.subject.id === 'counting-and-arrangements')}`)
t('and it displaced none of the ten positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure')
  && ONTOLOGIES[5] === getOntology('statements-and-connectives')
  && ONTOLOGIES[6] === getOntology('predicates-and-quantifiers')
  && ONTOLOGIES[7] === getOntology('methods-of-proof')
  && ONTOLOGIES[8] === getOntology('sets-and-membership')
  && ONTOLOGIES[9] === getOntology('rational-expressions'))
t('it has no internal faults', ontologyProblems(CA).length === 0, ontologyProblems(CA).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(CA).length === 0)
t('one concept, three knowledge points',
  CA.concepts.length === 1 && allKnowledgePoints(CA).length === 3,
  `${CA.concepts.length} concepts, ${allKnowledgePoints(CA).length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(CA, 'counting-principles') && isPractisable(CA, 'counting-principles'))
t('its points number from 1, which is per concept and not per subject',
  CA.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  CA.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(CA).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(CA).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
const CA_KINDS = new Set(allKnowledgePoints(CA).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  CA.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => CA_KINDS.has(k)))),
  CA.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...CA_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate}, so none of the four refusals is named',
  [...CA_KINDS].slice().sort().join(',') === 'evaluate'
  && CA.concepts.every(c => c.objectives.every(o =>
    !o.taskKinds.includes('justify') && !o.taskKinds.includes('counterexample')
    && !o.taskKinds.includes('transform_to_form') && !o.taskKinds.includes('state'))),
  [...CA_KINDS].join(','))
/*
 * THE EMPTY EDGE LIST, and this time containment bites TWICE. One concept, so no
 * internal pair — and BOTH of its prerequisites are authored in other subjects,
 * where every previous one-concept subject had at most one such edge to strand.
 * tests/atlas.mjs asserts where the two edges live.
 *
 * THE TWO CANDIDATE HOSTS DECLINED FOR DIFFERENT REASONS, which is what makes
 * this promotion's filing a judgement rather than a default, and the difference
 * is asserted. `sets-and-membership` declined IN WRITING, in its own `covers`,
 * which is printed verbatim to a reader — so filing there would have made a
 * shipped sentence false. `rational-expressions` never mentioned counting as a
 * boundary of itself, so that refusal is this promotion's own and rests on the
 * subject being about the algebra of quotients. Only the first can be checked
 * against a string; the second is checked as the absence of the concept plus the
 * presence of the prerequisite, which is the strongest a test can do about a
 * judgement.
 */
t('it declares no edges, and the single concept is therefore its own root',
  CA.edges.length === 0 && roots(CA).length === 1 && roots(CA)[0] === 'counting-principles')
t('BOTH prerequisites are authored elsewhere, so both edges had to leave the ontology',
  isTeachable(getOntology('sets-and-membership'), 'sets')
  && isTeachable(getOntology('rational-expressions'), 'binomial-theorem')
  && !CA.concepts.some(c => c.id === 'sets' || c.id === 'binomial-theorem'),
  `sets@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === 'sets'))?.subject.id}, `
  + `binomial@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === 'binomial-theorem'))?.subject.id}`)
/*
 * ASSERTED AGAINST `covers` AND NOT AGAINST THE PHRASE EVERY HEADER QUOTES, which
 * is a correction this promotion had to make rather than a choice it made.
 *
 * Four files cite `sets-and-membership` as having "written 'it does not claim
 * COUNTING as a subject' into its own file", and that sentence really is in
 * ontology-sets.ts — at the TOP, in a comment. It is not in `covers`, so it is a
 * maintainer's note and not shipped prose, and an assertion written against it
 * would be testing a comment. What `covers` says to a learner is the deferral by
 * name, which is the user-visible half and the half that would be falsified by
 * filing the concept there. That is what is checked.
 */
t('the subject holding its NEARER prerequisite defers this node by name, in shipped prose',
  /`counting-principles`/.test(getOntology('sets-and-membership').subject.covers)
  && /also directly above/.test(getOntology('sets-and-membership').subject.covers)
  && /permutations and combinations/.test(getOntology('sets-and-membership').subject.covers)
  && !getOntology('sets-and-membership').concepts.some(c => c.id === 'counting-principles'),
  getOntology('sets-and-membership').subject.covers.slice(-400))
t('and the other candidate host points here too, so the debt was named on both sides',
  /`counting-principles`/.test(getOntology('rational-expressions').subject.covers)
  || CA.subject.covers.includes('binomial-theorem'),
  `${/`counting-principles`/.test(getOntology('rational-expressions').subject.covers)}`)
/*
 * NO FIGURE AND NO SPEED TARGET, both refused rather than omitted.
 *
 * A figure would genuinely help here — a tree of choices for the product rule, a
 * three-circle diagram for the correction — and neither exists, so claiming one
 * would be the placeholder types.ts warns about. That is a weaker position than
 * the sets subject's, where the absence of a Venn diagram WAS the lesson, and it
 * is recorded as the weaker thing it is.
 *
 * The speed target is refused for the shape of reason the fourteenth and
 * fifteenth subjects each gave. Multiplying three small numbers would time
 * beautifully; the skill is deciding WHICH rule applies and noticing when the
 * product rule has lost its hypothesis, and a speed reward trains the
 * multiplication a learner can already do.
 */
t('no knowledge point claims a figure, since none exists to claim',
  allKnowledgePoints(CA).every(p => p.visualRef === undefined),
  allKnowledgePoints(CA).filter(p => p.visualRef !== undefined).map(p => p.id).join(', '))
t('and no point claims a speed target, since speed would reward the multiplication',
  allKnowledgePoints(CA).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(CA).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done. Asserted against the literal, the node being GONE and
 * there being nothing left to compare with.
 *
 * AND BOTH OVERCLAIMS ARE ASSERTED AS OVERCLAIMS. This pattern's shortfalls are
 * PRECISION rather than recall, which is the worse direction: "Linear
 * combination" is a vectors page and matches because the alternation has no left
 * boundary, and "Pigeonhole principle" matches a page whose content this concept
 * deliberately does not teach. The file's header argues `checked` survives both —
 * the node already declared it, so recognition is unmoved — and the ordering that
 * rescues the first is an accident of character count rather than of meaning,
 * which is exactly why it is pinned here. Whoever next narrows the pattern should
 * find the claim rather than discover the behaviour.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(CA.concepts[0].scope.match)
    === String(/\b(combination|permutation|pigeonhole principle|combinatoric)/i)
  && CA.concepts[0].fidelity === 'checked',
  String(CA.concepts[0].scope.match))
t('it really does reach the four pages it is for',
  CA.concepts[0].scope.match.test('Permutation')
  && CA.concepts[0].scope.match.test('Combination')
  && CA.concepts[0].scope.match.test('Combinatorics')
  && CA.concepts[0].scope.match.test('Pigeonhole principle'),
  `permutation: ${CA.concepts[0].scope.match.test('Permutation')}`)
t('and it overclaims into vectors, which the header names and a longer pattern outranks',
  CA.concepts[0].scope.match.test('Linear combination')
  && getOntology('vectors-and-independence').concepts
    .some(c => c.scope.match?.test('Linear combination')
      && c.scope.match.source.length > CA.concepts[0].scope.match.source.length),
  `counting source ${CA.concepts[0].scope.match.source.length}, vectors `
  + `${getOntology('vectors-and-independence').concepts
    .find(c => c.scope.match?.test('Linear combination'))?.scope.match.source.length}`)
t('and it claims the pigeonhole page while the material declines the principle',
  CA.concepts[0].scope.match.test('Pigeonhole principle')
  && /PIGEONHOLE/.test(CA.subject.covers)
  && /EXISTS|existence/i.test(CA.subject.covers)
  && !allKnowledgePoints(CA).some(p => /pigeonhole/i.test(p.statement)),
  allKnowledgePoints(CA).map(p => /pigeonhole/i.test(p.statement)).join(','))

group('the sixteenth subject states each one-line rule with its hypothesis')
/*
 * THE PRODUCT RULE IS BROKEN ON PURPOSE AND THE BREAK IS LOCATED, which is the
 * assertion this group exists for.
 *
 * The condition is that the NUMBER of options for a later choice is the same
 * whichever earlier option was taken — not that the choices are unrelated, which
 * is the plausible wrong statement. So the first point's example has to (a) show
 * the condition holding while the option SETS differ, and (b) show it failing,
 * with the failure traced to a specific choice whose count moved. A version that
 * taught "multiply the options" and moved on would pass every count in this file
 * and fail both halves below.
 */
const CA_POINTS = allKnowledgePoints(CA)
const CA_TASKS = CA_POINTS.flatMap(p => tasksForPoint(p.id))
t('the first example shows the option SETS differing while the counts agree',
  CA_POINTS[0].workedExample.subgoals.some(s =>
    /different sets of the same size|two different sets/i.test(s.detail)
    && /\{0,1,2,3,4,5,6,8,9\}/.test(s.detail)),
  CA_POINTS[0].workedExample.subgoals.map(s => s.label).join(' | '))
t('and it breaks the rule and names the choice whose count moved',
  /\bmoved\b/i.test(CA_POINTS[0].workedExample.subgoals.map(s => s.label + s.detail).join(' '))
  && /from 8 to 9/i.test(CA_POINTS[0].workedExample.subgoals.map(s => s.detail).join(' '))
  && /does not apply/i.test(CA_POINTS[0].workedExample.subgoals.map(s => s.detail).join(' ')
    + CA_POINTS[0].workedExample.answer),
  CA_POINTS[0].workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * AND THE STATEMENT SAYS "INAPPLICABLE" RATHER THAN "INACCURATE", asserted
 * separately because it is a claim about the RULE and the worked example's is a
 * claim about one problem. A learner who reads the failure as an approximation
 * will reach for a correction term; the honest reading is that the rule has no
 * hypothesis here and the repair is a case split, which is what the example then
 * does.
 */
t('and the statement says the rule is inapplicable rather than merely inaccurate',
  /inapplicable/i.test(CA_POINTS[0].statement)
  && /not merely inaccurate/i.test(CA_POINTS[0].statement),
  CA_POINTS[0].statement.slice(-300))
t('and the wrong answer is produced rather than warned about, then accounted for exactly',
  /320/.test(CA_POINTS[0].workedExample.subgoals.map(s => s.detail).join(' '))
  && /320/.test(CA_POINTS[0].workedExample.answer)
  && 328 - 320 === 8 && 9 * 8 - 8 * 8 === 8,
  CA_POINTS[0].workedExample.answer.slice(-200))
/*
 * AND THE DIVISION BY r! IS GIVEN ITS HYPOTHESIS TOO, which is the same shape of
 * claim one layer up: the overcount has to be the SAME for every selection, or
 * there is no single number to divide by and the repair would have to be a case
 * split — exactly what the first point's problem needed when its rule lost its
 * hypothesis. The two points carry one lesson about one kind of condition, and
 * the material has to say so rather than leaving the parallel to be noticed.
 */
t('the second example checks the overcount is uniform before dividing by it',
  CA_POINTS[1].workedExample.subgoals.some(s =>
    /same for every|same for EVERY/i.test(s.detail))
  && /case split|every selection/i
    .test(CA_POINTS[1].workedExample.subgoals.map(s => s.detail).join(' ')),
  CA_POINTS[1].workedExample.subgoals.map(s => s.label).join(' | '))
/*
 * IT IS NOT A SECOND PASS AT THE BINOMIAL THEOREM, which is the claim the whole
 * promotion rests on and the one a careless version would have failed silently.
 *
 * `binomial-theorem` builds a row by adding adjacent entries of the row above.
 * If this concept did that again it would be Pascal's triangle retold under a new
 * subject id. So the second point must derive 84 by a route that other concept
 * does not have — a descending product over the orderings of one selection — and
 * use the row as a CHECK. Both halves are asserted, and the second has teeth: no
 * task here may ask for an expansion or name a coefficient as its answer.
 */
t('the second point derives its answer by a route the binomial theorem does not have',
  /descending product|shrinking|9 × 8 × 7/i.test(CA_POINTS[1].statement)
  && CA_TASKS.some(x => x.given === '(a*b*c)/d' && x.reference === '84')
  && !CA_TASKS.some(x => x.form !== undefined),
  CA_TASKS.map(x => x.given).join(' | '))
t('and it uses the Pascal row as a check rather than as the derivation',
  CA_POINTS[1].workedExample.subgoals.some(s =>
    /check/i.test(s.label) && /1, 9, 36, 84, 126, 126, 84, 36, 9, 1/.test(s.detail))
  && CA_POINTS[1].workedExample.subgoals.findIndex(s =>
    /1, 9, 36, 84, 126, 126, 84, 36, 9, 1/.test(s.detail))
    > CA_POINTS[1].workedExample.subgoals.findIndex(s => /divide/i.test(s.label)),
  CA_POINTS[1].workedExample.subgoals.map(s => s.label).join(' | '))
t('and that row really is row 9, and really does sum to the subset count',
  (() => {
    const row = [1, 9, 36, 84, 126, 126, 84, 36, 9, 1]
    const choose = (n, r) => {
      let v = 1
      for (let i = 0; i < r; i += 1) v = (v * (n - i)) / (i + 1)
      return v
    }
    return row.every((v, r) => choose(9, r) === v)
      && row.reduce((a, b) => a + b, 0) === 2 ** 9
      && row[3] === 84 && row[6] === 84
  })(),
  `row 9 sums to ${[1, 9, 36, 84, 126, 126, 84, 36, 9, 1].reduce((a, b) => a + b, 0)}, 2^9 = ${2 ** 9}`)
t('and the subset total it checks against is the one the sets subject computes',
  /512|2⁹/.test(CA_POINTS[1].workedExample.subgoals.map(s => s.detail).join(' '))
  && /`sets`/.test(CA_POINTS[1].workedExample.subgoals.map(s => s.detail).join(' '))
  && isTeachable(getOntology('sets-and-membership'), 'sets'),
  CA_POINTS[1].workedExample.answer.slice(-200))
/*
 * THE THREE-SET CORRECTION IS AUDITED, NOT RECALLED, and all three kinds of
 * element are checked — because the argument is only complete if the case split
 * is. The arithmetic is recomputed here rather than trusted: this is the one
 * place in the subject where a wrong number would be a wrong claim about
 * mathematics rather than a wrong count of tasks.
 */
t('the third example audits all three kinds of element, each netting one',
  (() => {
    const text = CA_POINTS[2].workedExample.subgoals.map(s => s.detail).join(' ')
    return /3 − 3 \+ 1 = 1|3 - 3 \+ 1 = 1/.test(text + CA_POINTS[2].workedExample.answer)
      && /2 − 1 = 1|2 - 1 = 1/.test(text + CA_POINTS[2].workedExample.answer)
      && /net 1|nets 1/i.test(text + CA_POINTS[2].workedExample.answer)
  })(),
  CA_POINTS[2].workedExample.answer.slice(-280))
t('and the inclusion-exclusion arithmetic it states is correct, recomputed here',
  (() => {
    const n = 60
    const mult = d => n / d
    const union = mult(2) + mult(3) + mult(5) - mult(6) - mult(10) - mult(15) + mult(30)
    const coprime = [1, 7, 11, 13, 17, 19, 23, 29]
    return union === 44
      && [2, 3, 5, 6, 10, 15, 30].every(d => n % d === 0)
      && n - union === coprime.length * 2
      && coprime.every(k => k % 2 !== 0 && k % 3 !== 0 && k % 5 !== 0)
  })(),
  'union 44, complement 16')
t('and the multiplicity task answers the question a justify would have asked',
  (() => {
    const m = CA_TASKS.find(x => x.given === 'a - b + c')
    return !!m && m.at.a === '3' && m.at.b === '3' && m.at.c === '1'
      && m.reference === '1' && !isVerifiableKind('justify')
      && m.knowledgePointId === CA_POINTS[2].id
      && 3 - 3 + 1 === Number(m.reference)
  })(),
  CA_TASKS.find(x => x.given === 'a - b + c')?.id ?? 'none')

group('the sixteenth subject grades every task with no worker at all')
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE is asserted rather than the
 * total — a ratio over a total would be satisfied by nine tasks distributed any
 * way at all.
 *
 * Every reference is a whole number and not merely a rational, which is stronger
 * than the subjects either side hold and is also the check: every one of these
 * counts something, so a fractional answer would be a wrong answer rather than an
 * unusual one.
 */
t('nine tasks, three on each of the three points',
  CA_TASKS.length === 9
  && CA_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  CA_POINTS.map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, so nothing here needs the worker even for equivalence',
  CA_TASKS.every(x => x.kind === 'evaluate')
  && CA_TASKS.every(x => x.form === undefined)
  && CA_TASKS.every(x => x.domainConditions === undefined),
  CA_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
t('every reference is exactly reproducible from the given — no worker consulted',
  CA_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  CA_TASKS.map(x => x.id).join(', '))
t('and every one of them is a whole number, since every one of them counts something',
  CA_TASKS.every(x => /^\d+$/.test(x.reference)),
  CA_TASKS.map(x => x.reference).join(' '))
const caRulings = await Promise.all(CA_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  caRulings.every(r => r.verdict.ruling === 'correct'),
  caRulings.map((r, i) => `${CA_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * NO FACTORIAL ANYWHERE IN THE NINE, which is the constraint that chose the
 * encoding and is asserted so a later convenience cannot quietly undo it.
 *
 * `expr.ts` DOES list `factorial` in `ALLOWED_FUNCTIONS`, so a task writing
 * `factorial(9)/factorial(6)` would parse — and `exactValue` has no case for a
 * function call, so it would return null and drop the task to a worker this
 * subject must not need. The first clause below is the one with teeth: it checks
 * the givens contain no function call at all, which is what keeps the property
 * rather than checking that nobody wrote the word.
 */
t('no given calls a function, so none of the nine can fall through to a worker',
  CA_TASKS.every(x => /^[-+*/^()0-9a-z .]+$/.test(x.given))
  && CA_TASKS.every(x => !/[a-z]{2,}\s*\(/.test(x.given))
  && !CA_TASKS.some(x => /factorial/.test(x.given)),
  CA_TASKS.map(x => x.given).join(' | '))
/*
 * ONE EXPRESSION ACROSS TWO POINTS AT TWO SUBSTITUTIONS, which is the device the
 * fifteenth subject used and the reason the shared variable list has one name.
 *
 * `a*b*c` is the product rule. At (9, 9, 8) the pool holds still at nine, because
 * only the first digit was barred from being zero; at (9, 8, 7) it shrinks,
 * because a person cannot hold two offices. Same rule, two pools, two answers, so
 * the pair cannot read as one task duplicated — and whether the pool shrinks is
 * read off the problem rather than assumed from the words "all different".
 */
const CA_PRODUCTS = CA_TASKS.filter(x => x.given === 'a*b*c')
t('one product expression answers two different questions in two different points',
  CA_PRODUCTS.length === 2
  && new Set(CA_PRODUCTS.map(x => x.knowledgePointId)).size === 2
  && CA_PRODUCTS.map(x => x.reference).slice().sort().join(',') === '504,648',
  CA_PRODUCTS.map(x => `${x.reference}@${x.at.a}*${x.at.b}*${x.at.c}`).join(' | '))
t('and the one whose pool holds still is the digits, which is why the middle factor is 9',
  (() => {
    const digits = CA_PRODUCTS.find(x => x.reference === '648')
    const offices = CA_PRODUCTS.find(x => x.reference === '504')
    return !!digits && !!offices
      && digits.at.a === '9' && digits.at.b === '9' && digits.at.c === '8'
      && offices.at.a === '9' && offices.at.b === '8' && offices.at.c === '7'
      && digits.knowledgePointId === CA_POINTS[0].id
      && offices.knowledgePointId === CA_POINTS[1].id
      && 9 * 9 * 8 === 648 && 9 * 8 * 7 === 504
  })(),
  CA_PRODUCTS.map(x => `${x.at.a}${x.at.b}${x.at.c}=${x.reference}`).join(' | '))
/*
 * TWO TASKS WITH ONE REFERENCE, WHICH IS NORMALLY A DUPLICATE AND HERE IS THE
 * POINT — the assertion this block exists for.
 *
 * 84 twice: once down a three-factor product over 3! and once down a six-factor
 * product over 6!, because choosing the 3 who are in and the 6 who are out are
 * one act. The agreement IS the content, so it has to be produced rather than
 * asserted, and the two arities have to differ or there would be no saving to
 * notice. Asserted as same reference, different givens, different point-free
 * lengths — and the arithmetic of both recomputed.
 */
t('the symmetry is two tasks reaching one answer down products of different lengths',
  (() => {
    const three = CA_TASKS.find(x => x.given === '(a*b*c)/d')
    const six = CA_TASKS.find(x => x.given === '(a*b*c*d*e*f)/g')
    return !!three && !!six
      && three.reference === '84' && six.reference === '84'
      && three.given.length < six.given.length
      && three.knowledgePointId === six.knowledgePointId
      && (9 * 8 * 7) / 6 === 84
      && (9 * 8 * 7 * 6 * 5 * 4) / 720 === 84
  })(),
  `${CA_TASKS.find(x => x.given === '(a*b*c)/d')?.reference} and `
  + `${CA_TASKS.find(x => x.given === '(a*b*c*d*e*f)/g')?.reference}`)
t('and the prompts say why one answer twice is the lesson rather than a repeat',
  (() => {
    const six = CA_TASKS.find(x => x.given === '(a*b*c*d*e*f)/g')
    return !!six && /left OUT|left out/.test(six.prompt)
      && /symmetry/i.test(six.prompt)
      && /C\(9, 3\) = C\(9, 6\)/.test(six.prompt)
  })(),
  CA_TASKS.find(x => x.given === '(a*b*c*d*e*f)/g')?.prompt.slice(-220))
/*
 * THE lcm CAVEAT IS IN A PROMPT BECAUSE THE INSTANCE CANNOT TEACH IT, which is a
 * shape worth asserting rather than noting: every pair among 2, 3 and 5 is
 * coprime, so lcm and product agree on all three pairwise terms and a learner
 * could leave with "multiply the two divisors" intact. The rule that actually
 * holds costs one clause, and 4 and 6 — product 24, lcm 12 — is where the wrong
 * reading breaks.
 */
t('the overlap task names the lcm rule its own numbers cannot distinguish',
  (() => {
    const m = CA_TASKS.find(x => x.given === 'n/d')
    return !!m && /least common multiple|lcm/i.test(m.prompt)
      && /coprime/i.test(m.prompt)
      && m.at.n === '60' && m.at.d === '6' && m.reference === '10'
      && [[2, 3], [2, 5], [3, 5]].every(([p, q]) => p * q === (p * q) / 1)
  })(),
  CA_TASKS.find(x => x.given === 'n/d')?.prompt.slice(-200))
/*
 * THE CEILING, ASSERTED AS THE SHAPE OF THE MATERIAL RATHER THAN AS A NUMBER.
 *
 * The engine grades an expression, so no task can ask for a LIST of arrangements
 * and every one asks for a count. The consequence is the same one the fifteenth
 * subject named about sets and is the reason the worked examples are long: a
 * learner can be asked how many committees there are and not which, so no task
 * can catch somebody right by the wrong route. What a test can insist on is that
 * the examples write out what the tasks cannot ask for, and that every subgoal is
 * phrased as a question. The three examples hold 17 subgoals and every one is
 * authored.
 */
t('no task asks for an argument or for a list, both kinds being unrulable here',
  CA_TASKS.every(x => x.kind !== 'justify' && x.kind !== 'state')
  && !isVerifiableKind('justify'),
  CA_TASKS.map(x => x.kind).join(' '))
t('and the worked examples name the objects no task can ask for',
  CA_POINTS[1].workedExample.subgoals.some(s => /Ann, Bob and Cleo/.test(s.detail))
  && /\{0,1,2,3,4,5,6,8,9\}/
    .test(CA_POINTS[0].workedExample.subgoals.map(s => s.detail).join(' '))
  && /1, 7, 11, 13, 17, 19, 23, 29/
    .test(CA_POINTS[2].workedExample.subgoals.map(s => s.detail).join(' ')
      + CA_POINTS[2].workedExample.answer),
  CA_POINTS.map(p => p.position).join(' '))
t('so every subgoal of every example is authored as a question, since they carry the argument',
  CA_POINTS.flatMap(p => p.workedExample.subgoals).length === 17
  && CA_POINTS.every(p => p.workedExample.subgoals.every(s =>
    typeof s.socratic === 'string' && s.socratic.trim().endsWith('?'))),
  CA_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => typeof s.socratic !== 'string' || !s.socratic.trim().endsWith('?'))
    .map(s => s.label).join(' | '))
t('and no question is an imperative with a question mark, which contains its own answer',
  CA_POINTS.flatMap(p => p.workedExample.subgoals).every(s =>
    !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  CA_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  CA_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  CA_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * The SEVENTEENTH subject, from the forty-fifth promotion: chance.
 *
 * `sample-spaces` was a node of `probability` and is the whole of
 * `chance-and-events`. The structural half of the promotion is asserted in
 * tests/atlas.mjs — the node being gone, the two `links` entries carrying its
 * stranded edges, the two dependents it made ready, the armature claim. What is
 * asserted here is the MATERIAL, and four things about it that no count would
 * catch.
 *
 * FIRST, THAT IT IS NOT A SECOND PASS AT COUNTING. This is the failure mode
 * specific to this concept, in the way "a second pass at the binomial theorem"
 * was specific to the one above it. A probability over equally likely outcomes IS
 * a ratio of counts, so a careless version of this would be `counting-principles`
 * with a denominator — and it would pass every count in this file. The defence is
 * structural rather than editorial and so is assertable: the space has EIGHT
 * outcomes and they are WRITTEN OUT, every event is read off that list, and there
 * is exactly ONE multiplication in the whole subject. Both halves are checked.
 *
 * SECOND, THAT THE DIVISION IS PRESENTED WITH ITS HYPOTHESIS. P(E) = |E| / |S|
 * needs the outcomes to be equally likely, which is a property of the SPACE, and
 * it is the condition a learner can be taught to skip because the formula does not
 * show it. The material's defence is to carry a second, coarser sample space for
 * the same experiment all the way through — legal, and with outcomes that are not
 * equally likely — and to have the same division give a different answer in it.
 * The version of this concept that stated the formula without the hypothesis is
 * the likeliest wrong one, so the disagreement is checked in the material and the
 * two numbers are recomputed here rather than trusted.
 *
 * THIRD, THAT THE OVERLAP CORRECTION IS DERIVED AND NOT RECALLED. The same claim
 * the subject above makes about inclusion–exclusion, one set fewer and one layer
 * up: the repair comes out of following a single outcome through three terms and
 * counting how many times it ends up counted. The arithmetic of that audit is
 * recomputed here.
 *
 * FOURTH, THAT THE UNCORRECTED SUM REFUTES ITSELF. The two events in the third
 * point were chosen so that adding their probabilities gives exactly 1 while three
 * of the eight outcomes are in neither — a fault that contradicts the list rather
 * than merely disagreeing with it by a little. That is an editorial choice about
 * which instance to use, it is the difference between a lesson and an erratum, and
 * it is arithmetic, so it is asserted.
 */
const CE = getOntology('chance-and-events')

group('chance-and-events, a likelihood read off a list of everything that could happen')
/*
 * TWELFTH in the registry, and the first position in that array NOT fixed by what
 * its prerequisites allow.
 *
 * Every insertion before this took the earliest slot after the subject holding
 * its latest prerequisite, and the only judgement was which index a test reads by
 * name. Here the two diverge. The later prerequisite is `sets` in
 * `sets-and-membership` at 8, so index 9 was allowed — and 9 and 10 are read by
 * name by the two groups above, so this subject sits at 11 instead. Every slot
 * from 9 up makes the same curriculum claim, so nothing was given up.
 *
 * ASSERTED AS THE CONJUNCTION OF THE FLOOR AND THE GAP, which is the only form
 * that says what happened. A literal alone would report the position; the floor
 * alone would be satisfied at 9. Together they record that the floor was 9, that
 * this is above it, and that the two indices in between are the ones other groups
 * pin — so a future reordering that frees index 9 would leave this line correct
 * for a reason it no longer gives, and the clause naming those two occupants is
 * what would then go red.
 */
t('it is registered, and TWELFTH — above the floor its prerequisites set, not at it',
  ONTOLOGIES[11] === CE && CE?.subject.id === 'chance-and-events'
  && ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership') === 8
  && ONTOLOGIES[9] === getOntology('rational-expressions')
  && ONTOLOGIES[10] === getOntology('counting-and-arrangements'),
  `chance at ${ONTOLOGIES.findIndex(o => o.subject.id === 'chance-and-events')}, `
  + `floor ${ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership') + 1}`)
t('and it is behind BOTH subjects owning its prerequisites, which is the real claim',
  ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'chance-and-events')
  && ONTOLOGIES.findIndex(o => o.subject.id === 'arithmetic-foundations')
    < ONTOLOGIES.findIndex(o => o.subject.id === 'chance-and-events')
  && !!conceptById(getOntology('sets-and-membership'), 'sets')
  && !!conceptById(getOntology('arithmetic-foundations'), 'fraction-arithmetic'),
  `sets at ${ONTOLOGIES.findIndex(o => o.subject.id === 'sets-and-membership')}, `
  + `arithmetic at ${ONTOLOGIES.findIndex(o => o.subject.id === 'arithmetic-foundations')}, `
  + `chance at ${ONTOLOGIES.findIndex(o => o.subject.id === 'chance-and-events')}`)
t('and it displaced none of the eleven positions anything reads by index',
  ONTOLOGIES[0] === ARITHMETIC_FOUNDATIONS
  && ONTOLOGIES[1] === EXPRESSIONS_AND_EQUATIONS
  && ONTOLOGIES[2] === getOntology('plane-geometry')
  && ONTOLOGIES[3] === getOntology('triangle-trigonometry')
  && ONTOLOGIES[4] === getOntology('solid-measure')
  && ONTOLOGIES[5] === getOntology('statements-and-connectives')
  && ONTOLOGIES[6] === getOntology('predicates-and-quantifiers')
  && ONTOLOGIES[7] === getOntology('methods-of-proof')
  && ONTOLOGIES[8] === getOntology('sets-and-membership')
  && ONTOLOGIES[9] === getOntology('rational-expressions')
  && ONTOLOGIES[10] === getOntology('counting-and-arrangements'))
t('it has no internal faults', ontologyProblems(CE).length === 0, ontologyProblems(CE).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(CE).length === 0)
/*
 * THE SUBJECT TOTALS MOVED TO THE FORTY-SIXTH PROMOTION'S GROUP, which added the
 * second concept; what is asserted here is this promotion's own concept, whose
 * three points have not moved and cannot. A `CE.concepts.length === 1` would have
 * gone red on a correct addition, which is the shape this file dissects
 * elsewhere, and the first thing the subject ever did was predict its own second
 * concept by name.
 */
t('its concept has three knowledge points, numbered within itself',
  conceptById(CE, 'sample-spaces')?.knowledgePoints.length === 3,
  `${conceptById(CE, 'sample-spaces')?.knowledgePoints.length} points`)
t('the concept is teachable AND practisable — a syllabus, not a map entry',
  isTeachable(CE, 'sample-spaces') && isPractisable(CE, 'sample-spaces'))
t('its points number from 1, which is per concept and not per subject',
  CE.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  CE.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('every knowledge point has a task, so no chain is left unable to become evidence',
  allKnowledgePoints(CE).every(p => tasksForPoint(p.id).length > 0),
  allKnowledgePoints(CE).filter(p => tasksForPoint(p.id).length === 0).map(p => p.id).join(', '))
const CE_KINDS = new Set(allKnowledgePoints(CE).flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('every objective names a task kind, and every kind it names really ships a task here',
  CE.concepts.every(c => c.objectives.length > 0
    && c.objectives.every(o => o.taskKinds.length > 0 && o.taskKinds.every(k => CE_KINDS.has(k)))),
  CE.concepts.flatMap(c => c.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`)).join(' ')
  + ` against ${[...CE_KINDS].join('+')}`)
t('and the set it ships is exactly {evaluate}, so none of the four refusals is named',
  [...CE_KINDS].slice().sort().join(',') === 'evaluate'
  && CE.concepts.every(c => c.objectives.every(o =>
    !o.taskKinds.includes('justify') && !o.taskKinds.includes('counterexample')
    && !o.taskKinds.includes('transform_to_form') && !o.taskKinds.includes('state'))),
  [...CE_KINDS].join(','))
/*
 * THE EMPTY EDGE LIST, and containment bites twice again — the second promotion
 * running for which it does. One concept, so no internal pair, and BOTH
 * prerequisites are authored in other subjects.
 *
 * THE TWO CANDIDATE HOSTS DECLINED FOR DIFFERENT REASONS, and the difference is
 * sharper here than it was for the subject above. `sets-and-membership` holds the
 * nearer prerequisite and could have taken this concept for less than a new
 * subject costs — and unlike counting and relations, which it declines by NAME in
 * its own `covers`, it says nothing whatever about probability. So there is no
 * string to assert against and the refusal is this promotion's own, resting on a
 * probability being a function from subsets to numbers rather than a fact about
 * membership. `arithmetic-foundations` holds `fraction-arithmetic` and never
 * mentioned chance either.
 *
 * What a test can do about two judgements with no shipped sentence behind them is
 * assert the SHAPE each would have had: the prerequisite is there, the concept is
 * not, and the concept is somewhere else. That is weaker than the assertion the
 * sixteenth subject's group could make, and it is weaker for a reason worth
 * recording rather than papering over — those hosts had written their boundary
 * down in advance and these two had not.
 */
/*
 * IT DECLARED NO EDGES AND NOW DECLARES TWO, so what is asserted here is the half
 * that was never about the count: NEITHER of this concept's own prerequisites can
 * be named in this ontology, so neither of its edges is in that array however
 * long the array gets. The forty-sixth promotion's group below owns the length.
 *
 * `sample-spaces` is still the subject's root, and that is asserted for a reason
 * the empty-array version could not give: it is rooted because the ontology holds
 * nothing it depends on, which stays true as concepts are added above it and goes
 * red only if something it needs is ever filed here.
 */
t('neither of its own edges is in the ontology, and it is still the subject root',
  !CE.edges.some(e => [e.from, e.to].includes('sets')
    || [e.from, e.to].includes('fraction-arithmetic'))
  && !CE.edges.some(e => e.kind === 'prerequisite' && e.to === 'sample-spaces')
  && roots(CE).length === 1 && roots(CE)[0] === 'sample-spaces',
  `${CE.edges.length} edges, roots {${roots(CE).join(', ')}}`)
t('BOTH prerequisites are authored elsewhere, so both edges had to leave the ontology',
  isTeachable(getOntology('sets-and-membership'), 'sets')
  && isTeachable(getOntology('arithmetic-foundations'), 'fraction-arithmetic')
  && !CE.concepts.some(c => c.id === 'sets' || c.id === 'fraction-arithmetic'),
  `sets@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === 'sets'))?.subject.id}, `
  + `fractions@${ONTOLOGIES.find(o => o.concepts.some(c => c.id === 'fraction-arithmetic'))
    ?.subject.id}`)
t('and neither host took it, though the nearer one had written no boundary to stop it',
  !getOntology('sets-and-membership').concepts.some(c => c.id === 'sample-spaces')
  && !getOntology('arithmetic-foundations').concepts.some(c => c.id === 'sample-spaces')
  && !/probabilit/i.test(getOntology('sets-and-membership').subject.covers)
  && !/probabilit/i.test(getOntology('arithmetic-foundations').subject.covers)
  && conceptById(CE, 'sample-spaces')?.subjectId === 'chance-and-events',
  `sets mentions probability: ${/probabilit/i.test(getOntology('sets-and-membership')
    .subject.covers)}`)
/*
 * NO FIGURE AND NO SPEED TARGET, both refused rather than omitted.
 *
 * A figure would genuinely help — a tree of the three tosses branching to eight
 * leaves is the single most useful picture in elementary probability — and none
 * exists, so claiming one would be the placeholder types.ts warns about. That is
 * the same weaker position the subject above recorded, and it is recorded again
 * rather than cited because the figure this one wants is more obvious: a reader
 * who notices the absence should find the refusal, not conclude nobody thought of
 * it.
 *
 * The speed target is refused for the shape of reason the fourteenth subject
 * onward have each given. Dividing 3 by 8 would time beautifully; the skill is
 * deciding whether the division is licensed at all, and a speed reward trains the
 * arithmetic a learner already has.
 */
t('no knowledge point claims a figure, since none exists to claim',
  allKnowledgePoints(CE).every(p => p.visualRef === undefined),
  allKnowledgePoints(CE).filter(p => p.visualRef !== undefined).map(p => p.id).join(', '))
t('and no point claims a speed target, since speed would reward the division',
  allKnowledgePoints(CE).every(p => p.automaticityTarget === undefined),
  allKnowledgePoints(CE).filter(p => p.automaticityTarget !== undefined).map(p => p.id).join(', '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done. Asserted against the literal, the node being GONE and
 * there being nothing left to compare with.
 *
 * AND THE SHORTFALL IS ASSERTED AS RECALL RATHER THAN PRECISION, which is the
 * opposite of the subject above and is the better direction. Every title that
 * matches is this concept, so nothing is overclaimed. What is MISSED is asserted
 * by name — "Outcome (probability)", "Complementary event" and the bare
 * "Probability" page are all at least partly this material and none of them
 * matches — because a recall gap is invisible by construction: nothing goes red
 * when a page finds no concept. The negative clause is also what would catch the
 * obvious wrong widening, since `/\bprobability\b/` would take all three of those
 * and fifteen unwritten nodes with them.
 *
 * ONE OF THE THREE TITLES THE PATTERN SPELLS IS UNREACHABLE, found by testing it
 * rather than reading it, and asserted as dead so that repairing it reports
 * itself. The alternation is wrapped in `\b(...)\b` and the third alternative ends
 * in a literal `)`; a `\b` after a non-word character needs a word character next,
 * and "Event (probability theory)" has nothing next. So the author's third target
 * is the one title in this group that does NOT match.
 *
 * It is the same trap the `hypothesis-testing` node carries a comment about one
 * file away — "no trailing \b after 'test'" — reached from the other side, and the
 * reason it is asserted here rather than repaired is the verbatim rule: the
 * pattern moves in its own commit, not in the one that adds material. This
 * assertion is what tells that commit it has landed.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(CE.concepts[0].scope.match)
    === String(/\b(sample space|probability axioms|event \(probability theory\))\b/i)
  && CE.concepts[0].fidelity === 'checked',
  String(CE.concepts[0].scope.match))
t('it reaches two of the three titles it spells, and both really are this concept',
  CE.concepts[0].scope.match.test('Sample space')
  && CE.concepts[0].scope.match.test('Probability axioms'),
  `sample space: ${CE.concepts[0].scope.match.test('Sample space')}, `
  + `axioms: ${CE.concepts[0].scope.match.test('Probability axioms')}`)
t('and the third is DEAD, the trailing \\b after a close bracket never matching',
  !CE.concepts[0].scope.match.test('Event (probability theory)')
  && /\\b\(/.test(CE.concepts[0].scope.match.source)
  && /\\\)\)\\b/.test(CE.concepts[0].scope.match.source)
  && CE.concepts[0].scope.match.source.includes('event \\(probability theory\\)'),
  `matches: ${CE.concepts[0].scope.match.test('Event (probability theory)')}, `
  + `source tail: ${CE.concepts[0].scope.match.source.slice(-28)}`)
t('and it underclaims rather than overclaiming, which is the direction to prefer',
  !CE.concepts[0].scope.match.test('Outcome (probability)')
  && !CE.concepts[0].scope.match.test('Complementary event')
  && !CE.concepts[0].scope.match.test('Probability')
  && !CE.concepts[0].scope.match.test('Conditional probability'),
  ['Outcome (probability)', 'Complementary event', 'Probability', 'Conditional probability']
    .filter(s => CE.concepts[0].scope.match.test(s)).join(', ') || 'none claimed')

group('the seventeenth subject carries a second sample space to show the hypothesis')
/*
 * SCOPED TO THE CONCEPT AND NOT TO THE SUBJECT, which it was until the
 * forty-sixth promotion, and the reason is worth a paragraph because every
 * assertion below depended on the two being the same thing.
 *
 * While `chance-and-events` held one concept, "every task in this subject" and
 * "every task in this concept" picked out the same nine rows, so the subject-wide
 * filter was a proxy for a concept-wide claim and nothing distinguished them. The
 * claims themselves were always about the concept: eight outcomes written out, a
 * second coarser space, exactly ONE multiplication. That last one is the sharp
 * case — it is this concept's boundary against `counting-probability`, the node it
 * named as where combinatorics meets chance, and the forty-sixth promotion filed
 * that very node into this subject. Four of its nine tasks multiply. So a
 * subject-wide reading would have the boundary claim contradicted by the concept
 * it was drawn against, while the fact it defends is untouched: this concept still
 * multiplies once.
 *
 * The lesson is narrower than "scope everything to the concept". It is that a
 * filter which happens to be equivalent to the claim should be written as the
 * CLAIM — a one-concept subject makes the two indistinguishable, and the subject
 * growing is the event that tells them apart.
 */
const CE_POINTS = conceptById(CE, 'sample-spaces').knowledgePoints
const CE_TASKS = CE_POINTS.flatMap(p => tasksForPoint(p.id))
/*
 * THE SPACE IS WRITTEN OUT, WHICH IS WHAT KEEPS THIS OUT OF COUNTING'S TERRITORY.
 *
 * All eight sequences appear in the first point's worked example and in the first
 * task's prompt, so every event in all three points is READ off a list rather
 * than counted. That is a boundary, not an economy: `counting-probability`
 * directly above is where combinatorics meets chance, and this concept must not
 * become it. The one multiplication in THIS CONCEPT is asserted as exactly one —
 * it used to be asserted over the subject, which was the same set of tasks until
 * the forty-sixth promotion filed that very concept here and brought four
 * multiplying tasks with it. See the scope note at the top of this group.
 */
t('all eight outcomes of the space are written out, not described',
  ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'].every(s =>
    CE_POINTS[0].workedExample.subgoals.some(g => g.detail.includes(s))
    || CE_POINTS[0].workedExample.answer.includes(s)),
  ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'].filter(s =>
    !CE_POINTS[0].workedExample.subgoals.some(g => g.detail.includes(s))
    && !CE_POINTS[0].workedExample.answer.includes(s)).join(' ') || 'all present')
t('and exactly one task of THIS concept multiplies, so the counting stays outside it',
  CE_TASKS.filter(x => x.given.includes('*')).length === 1
  && CE_TASKS.find(x => x.given.includes('*')).given === 'a*b*c'
  && CE_TASKS.find(x => x.given.includes('*')).reference === '8'
  // And the node this boundary was drawn against is now a concept of the same
  // subject, four of whose tasks multiply — which is what makes the scope of the
  // filter above load-bearing rather than incidental.
  && !!conceptById(CE, 'counting-probability'),
  CE_TASKS.filter(x => x.given.includes('*')).map(x => x.given).join(' '))
/*
 * THE SECOND SAMPLE SPACE IS THE CONCEPT'S CENTRAL DEVICE AND IS CHECKED IN ALL
 * THREE OF ITS PARTS: that it is presented as LEGAL, that the same division gives
 * a DIFFERENT answer in it, and that the material says which answer is wrong and
 * why. A version carrying only the first would be a curiosity; one carrying only
 * the second and third would be a warning with no object.
 *
 * The two numbers are recomputed here rather than matched as strings. 3/8 against
 * 1/4 is the whole argument, and the thing that makes them incomparable at a
 * glance is that they are over different denominators — so the test does the
 * comparison the material asks the learner to do.
 */
t('the coarser space is presented as a LEGAL sample space before it is criticised',
  /legal sample space|IS a sample space/i.test(
    CE_POINTS[0].workedExample.subgoals.map(g => `${g.label} ${g.detail}`).join(' '))
  && /\{0, 1, 2, 3\}/.test(CE_POINTS[0].workedExample.answer),
  CE_POINTS[0].workedExample.subgoals.map(g => g.label).join(' | '))
t('and the same division really does give a different answer there, computed not quoted',
  3 / 8 !== 1 / 4 && 1 * 8 !== 4 * 3
  && /1\/4/.test(CE_POINTS[1].workedExample.answer)
  && /3\/8/.test(CE_POINTS[1].workedExample.answer),
  CE_POINTS[1].workedExample.answer.slice(-220))
t('and the material settles WHICH is wrong, rather than leaving two numbers standing',
  /1\/4 is wrong|wrong.*1\/4/i.test(CE_POINTS[1].workedExample.answer)
  && /equally likely/i.test(CE_POINTS[1].workedExample.answer)
  && /1, 3, 3 and 1/.test(CE_POINTS[1].workedExample.answer),
  CE_POINTS[1].workedExample.answer.slice(-320))
/*
 * THE PARTITION AUDIT, AND WHY TWO TASKS SHARING AN ANSWER IS THE CONTENT.
 *
 * 1 + 3 + 3 + 1 = 8 is the same space counted a second way, so the second task's
 * answer is the first task's answer or the four groups were never a partition.
 * Two tasks with one reference would normally be a duplicate; here the agreement
 * is the claim, which is the device ontology-sets.ts introduced and
 * ontology-counting.ts repeated with 84.
 *
 * AND THE INEQUALITY OF THE ADDENDS IS ASSERTED SEPARATELY, because it is what
 * the second point's argument runs on and it is not implied by the sum. Four
 * equal groups would also add to 8.
 */
t('two tasks reach 8, one sizing the space and one auditing the partition against it',
  (() => {
    const prod = CE_TASKS.find(x => x.given === 'a*b*c')
    const part = CE_TASKS.find(x => x.given === 'p + q + r + s')
    return !!prod && !!part && prod.reference === part.reference
      && prod.knowledgePointId === part.knowledgePointId
      && 2 * 2 * 2 === Number(prod.reference)
      && Number(part.at.p) + Number(part.at.q) + Number(part.at.r) + Number(part.at.s)
        === Number(part.reference)
  })(),
  CE_TASKS.filter(x => x.reference === '8').map(x => x.given).join(' | '))
t('and the four group sizes are NOT equal, which is what the second point needs',
  (() => {
    const part = CE_TASKS.find(x => x.given === 'p + q + r + s')
    const sizes = ['p', 'q', 'r', 's'].map(k => Number(part.at[k]))
    return new Set(sizes).size > 1 && sizes.join(',') === '1,3,3,1'
  })(),
  ['p', 'q', 'r', 's'].map(k => CE_TASKS.find(x => x.given === 'p + q + r + s').at[k]).join(','))
/*
 * THE UNCORRECTED SUM REFUTES ITSELF, which is an editorial choice of instance
 * and is arithmetic, so it is asserted rather than described.
 *
 * A = "first toss is heads" and B = "at least two heads" each hold four of the
 * eight outcomes, so adding gives exactly 1 — a claim of certainty — while THT,
 * TTH and TTT are in neither. Any pair of events would have shown the correction
 * working; this pair shows the fault contradicting the list, which is the
 * difference between a lesson and an erratum.
 */
t('adding the two probabilities alone comes to exactly 1, which the list refutes',
  (() => {
    const u = CE_TASKS.find(x => x.given === 'a/n + b/n - c/n')
    const a = Number(u.at.a); const b = Number(u.at.b)
    const c = Number(u.at.c); const n = Number(u.at.n)
    return a / n + b / n === 1 && a + b - c === 5 && n - 5 === 3
  })(),
  (() => {
    const u = CE_TASKS.find(x => x.given === 'a/n + b/n - c/n')
    return `${u.at.a}/${u.at.n} + ${u.at.b}/${u.at.n} = ${Number(u.at.a) / Number(u.at.n)
      + Number(u.at.b) / Number(u.at.n)}`
  })())
t('and the three outcomes in neither event are named in the material',
  ['THT', 'TTH', 'TTT'].every(s =>
    CE_POINTS[2].workedExample.subgoals.some(g => g.detail.includes(s))),
  ['THT', 'TTH', 'TTT'].filter(s =>
    !CE_POINTS[2].workedExample.subgoals.some(g => g.detail.includes(s))).join(' ') || 'all named')
/*
 * THE MULTIPLICITY TASK ANSWERS THE QUESTION A `justify` WOULD HAVE ASKED, which
 * is the role the three-set multiplicity plays in the subject above and the
 * nearest thing this build has to an unrulable kind being covered.
 *
 * Asked at (1, 1, 1) — an outcome in both events — and the answer 1 is the reason
 * one subtraction is the whole repair. The arithmetic is recomputed, and so is the
 * fact that `justify` is unrulable, because the task only stands in for something
 * if that something really cannot be asked.
 */
t('and the multiplicity task answers the question a justify would have asked',
  (() => {
    const m = CE_TASKS.find(x => x.given === 'p + q - r')
    return !!m && m.at.p === '1' && m.at.q === '1' && m.at.r === '1'
      && m.reference === '1' && !isVerifiableKind('justify')
      && m.knowledgePointId === CE_POINTS[2].id
      && 1 + 1 - 1 === Number(m.reference)
  })(),
  CE_TASKS.find(x => x.given === 'p + q - r')?.id ?? 'none')

group('the seventeenth subject grades every task with no worker at all')
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE is asserted rather than the
 * total — a ratio over a total would be satisfied by nine tasks distributed any
 * way at all.
 *
 * THE REFERENCE CHECK IS DIFFERENT FROM THE SUBJECT ABOVE'S AND TIGHTER. That one
 * could assert every reference is a whole number, because every one of them counts
 * something. FIVE of these are probabilities and so are rational — but a
 * probability lies in [0, 1], which the integer check cannot express and which a
 * wrong expression is very likely to break. So both are asserted: every answer is
 * exactly reproducible with no worker, and every probability is in range while the
 * FOUR that are not probabilities are exactly the size of the space, a subset
 * size, the partition total and the multiplicity.
 */
t('nine tasks, three on each of the three points',
  CE_TASKS.length === 9
  && CE_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  CE_POINTS.map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, so nothing here needs the worker even for equivalence',
  CE_TASKS.every(x => x.kind === 'evaluate')
  && CE_TASKS.every(x => x.form === undefined)
  && CE_TASKS.every(x => x.domainConditions === undefined)
  && CE_TASKS.every(x => x.acceptsUnevaluated === undefined),
  CE_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
t('every reference is exactly reproducible from the given — no worker consulted',
  CE_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  CE_TASKS.map(x => x.id).join(', '))
t('no given calls a function, so none of the nine can fall through to a worker',
  CE_TASKS.every(x => !/[a-z]+\s*\(/i.test(x.given)),
  CE_TASKS.filter(x => /[a-z]+\s*\(/i.test(x.given)).map(x => x.given).join(' '))
t('every reference that is a probability lies in [0, 1], which an integer check could not say',
  (() => {
    const probs = CE_TASKS.filter(x => x.reference.includes('/'))
    const counts = CE_TASKS.filter(x => !x.reference.includes('/'))
    // In [0, 1] AND a count of outcomes over the size of the space, which is the
    // stronger claim: 1/2 is written reduced and is 4/8, so the test converts
    // rather than matching the denominator as a string.
    const inRange = probs.every(x => {
      const [num, den] = x.reference.split('/').map(Number)
      const outcomes = (num * 8) / den
      return num >= 0 && num <= den && Number.isInteger(outcomes) && outcomes <= 8
    })
    return probs.length === 5 && counts.length === 4 && inRange
      && counts.map(x => x.reference).slice().sort().join(',') === '1,4,8,8'
  })(),
  CE_TASKS.map(x => x.reference).join(' '))
const ceRulings = await Promise.all(CE_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  ceRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  ceRulings.map((r, i) => `${CE_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(' '))
/*
 * ONE EXPRESSION AT TWO SUBSTITUTIONS INSIDE ONE POINT, which is the device the
 * two subjects above used across a point boundary and which is used here within
 * one because the two substitutions ARE the derivation: a one-outcome event, then
 * a three-outcome one. The pair cannot read as a duplicate because the references
 * differ, and both halves are asserted.
 */
const CE_RATIOS = CE_TASKS.filter(x => x.given === 'e/n')
t('one ratio expression answers two questions in one point, and they differ',
  CE_RATIOS.length === 2
  && new Set(CE_RATIOS.map(x => x.knowledgePointId)).size === 1
  && CE_RATIOS[0].reference !== CE_RATIOS[1].reference
  && CE_RATIOS.map(x => x.reference).slice().sort().join(',') === '1/8,3/8'
  && CE_RATIOS.every(x => x.at.n === '8'),
  CE_RATIOS.map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * NO TASK ASKS FOR AN ARGUMENT, AND THE WORKED EXAMPLES CARRY WHAT NO TASK CAN
 * ASK — so every subgoal is authored as a question, which is where the
 * unrulable half of this concept lives.
 *
 * The three refusals are asserted as absences and the questions as presences.
 * `isInterrogative` is the same check `questionCoverage` uses, so a label ending
 * in a period would score zero there and go red here.
 */
t('no task asks for an argument or for a list, both kinds being unrulable here',
  !CE_TASKS.some(x => x.kind === 'justify' || x.kind === 'state'
    || x.kind === 'counterexample' || x.kind === 'transform_to_form'),
  CE_TASKS.map(x => x.kind).join(' '))
/*
 * DELIBERATELY SUBJECT-WIDE, unlike everything else in this group, and that is
 * the one place the forty-sixth promotion did NOT narrow a scope. "Every subgoal
 * of every worked example in this subject is written as a question" is a stronger
 * claim than the per-concept version and is the one worth holding, because a
 * second concept arriving with unwritten questions is exactly the regression it
 * should catch. `allKnowledgePoints` rather than `CE_POINTS` for that reason.
 */
t('so every subgoal of every example is authored as a question, since they carry the argument',
  allKnowledgePoints(CE).every(p => p.workedExample.subgoals.every(s =>
    typeof s.socratic === 'string' && s.socratic.trim().endsWith('?')
    && isInterrogative(s.socratic))),
  allKnowledgePoints(CE).flatMap(p => p.workedExample.subgoals)
    .filter(s => typeof s.socratic !== 'string' || !s.socratic.trim().endsWith('?'))
    .map(s => s.label).join(' | '))
t('and no question is an imperative with a question mark, which contains its own answer',
  CE_POINTS.flatMap(p => p.workedExample.subgoals).every(s =>
    !/^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim())),
  CE_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => /^(should|do|does|can|is|are|will) you\b/i.test(s.socratic.trim()))
    .map(s => s.label).join(' | '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  CE_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  CE_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * The forty-sixth promotion: a counted probability, into the subject that
 * predicted it.
 *
 * `counting-probability` was a node of `probability` and is the SECOND concept of
 * `chance-and-events` — the first growth either of the two one-concept subjects
 * created by the forty-fourth and forty-fifth promotions has seen, and the first
 * time an ontology's own `EDGES` note has named the concept that would fill it
 * and then been taken up on it. tests/atlas.mjs owns the structural half: the
 * node being gone, the third `links` entry, the credit edge this promotion
 * destroyed, the root set, the anchor it made ready. What is asserted here is the
 * MATERIAL, and five things about it that no count would catch.
 *
 * FIRST, THAT THE SPACE IS NOT WRITTEN OUT — which is the exact inverse of its
 * own prerequisite's defence and is what makes the two concepts different rather
 * than nested. `sample-spaces` asserts that all eight of its outcomes appear in
 * the material, because an event READ off a list is that concept's whole method.
 * This concept's 220 committees cannot be listed, so its defence has to be that
 * no attempt is made to: the space is sized by one expression, nothing enumerates
 * it, and every event below is counted. Both claims are checked, and the pair of
 * them is the boundary.
 *
 * SECOND, THAT THE CONVENTION CLAIM IS PRODUCED AND NOT ASSERTED. The first
 * knowledge point says the ordered and unordered routes give the same
 * probability. A version that said so and showed one route would be a claim; the
 * material computes both and the two tasks agree, so the arithmetic is recomputed
 * here rather than trusted — 60/1320 against 10/220, which are incomparable at a
 * glance and are the same number.
 *
 * THIRD, THAT THE MIXED CONVENTION IS SHOWN FAILING TWICE, once producing an
 * ordinary-looking probability and once producing one greater than 1. That is an
 * editorial choice of instance and it is the whole reason the second point's
 * numbers were chosen as they were: the first point's 3/11 does not announce
 * itself, and 63/22 does. A version carrying only the self-refuting case would
 * teach that the error is detectable.
 *
 * FOURTH, THAT THE PARTITION AUDIT CLOSES. 35 + 105 + 70 + 10 = 220 is the only
 * check available on a favourable count that cannot be listed, and it is
 * arithmetic, so it is asserted rather than described.
 *
 * FIFTH, THAT THE FIDELITY IS `guided` WITH A REASON, not `checked` with an
 * invented pattern. The map node carried no `match`, so there was nothing to
 * carry across verbatim, and the words a pattern would have to use are the ones
 * atlas.ts names as the failure mode. The absence of a pattern and the presence
 * of a caveat are both asserted, and so is the recognition figure not having
 * moved.
 */
const CP = conceptById(CE, 'counting-probability')
const CP_POINTS = CP.knowledgePoints
const CP_TASKS = CP_POINTS.flatMap(p => tasksForPoint(p.id))

group('counting-probability, where the sample space stops being a list')
/*
 * THE SUBJECT TOTALS HAVE MOVED ON AGAIN, to the forty-seventh promotion's
 * group, which is the third group to hold them. This group took them from the
 * forty-fifth's and had them for exactly one promotion, which is the rule
 * working rather than churn: a count belongs to whoever last moved it, and the
 * subject has grown in three consecutive runs.
 *
 * What stays here is this promotion's own concept and the ORDER it arrived in.
 * `counting-probability` is second in the array, behind its own prerequisite,
 * and that is asserted positively rather than as a length — the concepts are in
 * prerequisite order, which `teachingOrder` does not require but which makes the
 * file readable, and a third concept inserted between them would go red here
 * while a third appended does not.
 */
t('its concept is second in the array, behind the prerequisite it declared',
  CE.concepts.findIndex(c => c.id === 'counting-probability') === 1
  && CE.concepts.findIndex(c => c.id === 'sample-spaces') === 0
  && conceptById(CE, 'counting-probability')?.knowledgePoints.length === 3,
  CE.concepts.map(c => c.id).join(','))
t('and every concept numbers its points from 1, which is per concept and not per subject',
  CE.concepts.every(c => c.knowledgePoints.map(p => p.position).join(',') === '1,2,3'),
  CE.concepts.map(c => `${c.id}:${c.knowledgePoints.map(p => p.position).join('')}`).join(' '))
t('the concept is teachable AND practisable, and the subject has no internal faults',
  isTeachable(CE, 'counting-probability') && isPractisable(CE, 'counting-probability')
  && ontologyProblems(CE).length === 0 && fidelityMismatches(CE).length === 0,
  ontologyProblems(CE).join('; '))
/*
 * THE TWO EDGES THIS PROMOTION DECLARED, asserted by MEMBERSHIP rather than as
 * the array's length — which is the correction the forty-seventh promotion
 * forced, since it added a third and the length clause went red on a correct
 * addition. The length now lives in that promotion's group.
 *
 * The prerequisite is the one the file's `EDGES` note predicted; the
 * `encompasses` is the credit claim that replaced NOTHING, since the one this
 * promotion lost pointed at `counting-principles` and is inexpressible —
 * tests/atlas.mjs asserts that loss.
 *
 * Asserted as the conjunction of both kinds and the containment rule, because an
 * ontology may only name concepts it holds and that is the whole reason the first
 * concept's own two edges are `links` entries instead. The containment clause is
 * over EVERY edge in the array deliberately: it is an invariant of the ontology
 * rather than a fact about these two, so it should go red for an edge any later
 * promotion adds badly.
 */
t('the two edges it declared are both there, one of each kind, both ends held here',
  CE.edges.some(e => e.from === 'sample-spaces' && e.kind === 'prerequisite'
    && e.to === 'counting-probability')
  && CE.edges.some(e => e.from === 'counting-probability' && e.kind === 'encompasses'
    && e.to === 'sample-spaces')
  && CE.edges.every(e => CE.concepts.some(c => c.id === e.from)
    && CE.concepts.some(c => c.id === e.to))
  && CE.edges.every(e => !!e.promotedBy),
  CE.edges.map(e => `${e.from}:${e.kind}:${e.to}`).join(' '))
t('and the credit edge is pointed DOWN the subject, which is the direction that pays',
  (() => {
    const credit = CE.edges.find(e => e.kind === 'encompasses')
    // `from` exercises `to`, so the advanced concept must be the `from` — a
    // reversed edge would credit the counted probability every time somebody
    // listed eight coin tosses, which is the opposite of what was argued.
    return credit.from === 'counting-probability' && credit.to === 'sample-spaces'
      && !!credit.rationale
      && CE.edges.some(e => e.kind === 'prerequisite'
        && e.from === credit.to && e.to === credit.from)
  })(),
  CE.edges.filter(e => e.kind === 'encompasses')
    .map(e => `${e.from}=>${e.to}`).join(' '))
/*
 * FIDELITY IS `guided` AND THE PATTERN IS ABSENT ON PURPOSE, which is the
 * assertion that distinguishes this from an oversight.
 *
 * Two of the three clauses are the structural requirement — `fidelityMismatches`
 * fails a guided concept with no caveat and a checked one with no pattern — and
 * the third is the editorial claim: the caveat NAMES what is unchecked rather
 * than apologising, which is the difference types.ts draws between an honest
 * absence and a placeholder. The only other promotion to author a patternless
 * node, `nonlinear-systems`, has the same shape and its group makes the same
 * check.
 *
 * AND RECOGNITION DID NOT MOVE, asserted because it is the figure a new pattern
 * would have shifted in the same edit as the material: the composed list holds
 * one entry for this id either way — a node before, a concept now — so the
 * denominator is untouched, and with no pattern at either end the numerator is
 * too.
 */
t('it is guided, with no pattern and a caveat that says what is unchecked',
  CP.fidelity === 'guided'
  && CP.scope.match === undefined
  && typeof CP.caveat === 'string'
  && /no pattern/i.test(CP.caveat)
  && /RECOGNITION that is unchecked/i.test(CP.caveat),
  `${CP.fidelity}, match ${CP.scope.match}, caveat ${CP.caveat.length} chars`)
t('and what the node DID carry came across verbatim, which is the half there was to carry',
  CP.scope.id === CP.id
  && CP.scope.label === CP.name
  && CP.scope.hint === 'equally likely favourable outcomes combinatorial probability'
  && CE.concepts.filter(c => c.id === 'counting-probability').length === 1,
  `${CP.scope.id} / ${CP.scope.label} / ${CP.scope.hint}`)
/*
 * THE SPACE IS NOT WRITTEN OUT, WHICH IS THE INVERSE OF THE CONCEPT BELOW'S
 * DEFENCE AND IS WHAT SEPARATES THE TWO.
 *
 * `sample-spaces` asserts that all eight of its outcomes appear in its material,
 * because reading an event off a printed list is its method. 220 committees
 * cannot be printed, so the claim here has to be that nothing tries: the space is
 * produced by ONE expression, and no worked example enumerates outcomes. The
 * negative is checked by looking for the shape an enumeration would take — a
 * braced set of members — and the positive by the single sizing task.
 *
 * The one concrete membership the material does name is {Ann, Bob, Cleo}, and it
 * is there to say what ONE outcome is rather than to list the space. That is
 * asserted as present, so the negative clause cannot be satisfied by a version
 * that never says what an outcome is at all.
 */
t('the space is sized by one expression and nowhere enumerated',
  CP_TASKS.filter(x => x.reference === '220' && x.given === '(a*b*c)/d').length === 1
  && CP_POINTS[0].workedExample.subgoals.some(s => /\{Ann, Bob, Cleo\}/.test(s.detail))
  && !CP_POINTS.some(p => /\{[^}]*,[^}]*,[^}]*,[^}]*\}/.test(
    p.workedExample.subgoals.map(s => s.detail).join(' ') + p.workedExample.answer)),
  CP_TASKS.filter(x => x.reference === '220').map(x => x.given).join(' | '))
/*
 * THE CONVENTION CLAIM IS PRODUCED, NOT ASSERTED — two tasks, two routes, one
 * answer, and the arithmetic recomputed here rather than matched as a string.
 *
 * 10/220 and 60/1320 are incomparable at a glance, which is the point: the test
 * does the cross-multiplication the material asks the learner to see, and then
 * checks that the second route's six factors really are the first route's four
 * with the divisor removed from both sides.
 */
t('both routes to the first probability are asked, and they really are the same number',
  (() => {
    const unordered = CP_TASKS.find(x => x.given === 'e/n' && x.at.e === '10')
    const ordered = CP_TASKS.find(x => x.given === '(a*b*c)/(d*e*f)')
    if (!unordered || !ordered) return false
    const u = [Number(unordered.at.e), Number(unordered.at.n)]
    const o = [Number(ordered.at.a) * Number(ordered.at.b) * Number(ordered.at.c),
      Number(ordered.at.d) * Number(ordered.at.e) * Number(ordered.at.f)]
    return u[0] * o[1] === u[1] * o[0]
      && o[0] === u[0] * 6 && o[1] === u[1] * 6
      && unordered.reference === ordered.reference
      && unordered.knowledgePointId === ordered.knowledgePointId
  })(),
  CP_TASKS.filter(x => x.reference === '1/22')
    .map(x => `${x.given}=${x.reference}`).join(' | '))
t('and the factor that cancels is 3! for the reason the material gives, not by luck',
  (() => {
    const space = CP_TASKS.find(x => x.given === '(a*b*c)/d')
    // The divisor is the orderings of ONE selection, so it must be 3! for a
    // committee of three — and the same divisor appears in the event's count in
    // the worked example, which is what makes it cancel rather than merely
    // divide.
    return Number(space.at.d) === 3 * 2 * 1
      && /3! = 6/.test(CP_POINTS[0].workedExample.subgoals
        .map(s => s.detail).join(' ') + CP_POINTS[0].workedExample.answer)
  })(),
  `divisor ${CP_TASKS.find(x => x.given === '(a*b*c)/d').at.d}`)
/*
 * THE MIXED CONVENTION FAILS TWICE AND THE TWO FAILURES ARE DIFFERENT IN KIND,
 * which is the editorial choice this material turns on and is arithmetic, so it
 * is asserted.
 *
 * In the first point the mixed answer is 60/220 = 3/11, which is a perfectly
 * ordinary probability — nothing in it says two spaces were crossed. In the
 * second it is 630/220 = 63/22, which exceeds 1 and so refutes itself. Both are
 * recomputed here, and both are checked to be exactly 3! times the right answer,
 * because "wrong by the factor that failed to cancel" is the claim and "wrong"
 * is not.
 *
 * A version with only the self-refuting case would teach that the error announces
 * itself, which is the opposite of true and is the more dangerous lesson of the
 * two — so the ordinary-looking one is asserted first.
 */
t('the mixed convention is shown failing twice, once undetectably and once past 1',
  (() => {
    const first = CP_POINTS[0].workedExample
    const second = CP_POINTS[1].workedExample
    const shown = `${first.subgoals.map(s => s.detail).join(' ')} ${first.answer} `
      + `${second.subgoals.map(s => s.detail).join(' ')} ${second.answer}`
    // 60/220 is 6 × 1/22 and lies in [0, 1]; 630/220 is 6 × 21/44 and does not.
    return 60 * 22 === 220 * 6 * 1 && 60 / 220 <= 1
      && 630 * 44 === 220 * 6 * 21 && 630 / 220 > 1
      && /3\/11/.test(shown) && /63\/22/.test(shown)
  })(),
  `3/11 = ${60 / 220}, 63/22 = ${(630 / 220).toFixed(3)}`)
/*
 * THE PARTITION AUDIT CLOSES, and it is the only check available on a favourable
 * count that cannot be listed — so the four case counts are added here rather
 * than taken on trust, and their total is checked against the SPACE task's
 * reference rather than against the literal 220.
 *
 * Two tasks sharing a reference would normally be a duplicate; here one is the
 * size of the space and the other is the same space counted by how many new
 * members a committee holds, so the agreement is the claim. What stops the pair
 * reading as one task twice is the SHAPE of the two expressions rather than their
 * arity, which both drafts of this line got wrong: `(a*b*c)/d` and
 * `a + b + c + d` have four letters each, and the difference is that one divides
 * a product by the orderings of a selection and the other only adds.
 */
t('the four case counts add back to the size of the space, computed not quoted',
  (() => {
    const space = CP_TASKS.find(x => x.given === '(a*b*c)/d')
    const audit = CP_TASKS.find(x => x.given === 'a + b + c + d')
    const cases = ['a', 'b', 'c', 'd'].map(k => Number(audit.at[k]))
    return cases.reduce((s, x) => s + x, 0) === Number(space.reference)
      && audit.reference === space.reference
      && cases.join(',') === '35,105,70,10'
      && space.given.includes('/') && !audit.given.includes('/')
      && space.given !== audit.given
  })(),
  CP_TASKS.filter(x => x.reference === '220').map(x => x.given).join(' | '))
t('and the favourable count the audit checks is one of those four cases',
  (() => {
    const product = CP_TASKS.find(x => x.given === 'a*((b*c)/d)')
    const audit = CP_TASKS.find(x => x.given === 'a + b + c + d')
    // 5 × 21 = 105 is the `b` of the audit, so a wrong factor in the product
    // breaks the total — which is the whole reason the audit is worth asking.
    return Number(product.reference) === Number(audit.at.b)
      && Number(product.at.a) * (Number(product.at.b) * Number(product.at.c)
        / Number(product.at.d)) === Number(product.reference)
  })(),
  `product ${CP_TASKS.find(x => x.given === 'a*((b*c)/d)').reference}, `
  + `case b ${CP_TASKS.find(x => x.given === 'a + b + c + d').at.b}`)
/*
 * THE UNION IS REACHED TWICE AND THE SECOND ROUTE HANDLES NO OVERLAP, which is
 * what makes it a check rather than a rearrangement of the same three terms.
 *
 * Both are recomputed. The inclusion–exclusion route is 55 + 55 − 10 over 220;
 * the complement route is 220 − 120 over 220. They agree at 5/11, and the second
 * never adds two counts and never subtracts an overlap, so a wrong overlap could
 * not have survived into it.
 *
 * AND THE UNCORRECTED SUM IS ASSERTED TO BE WRONG BUT NOT ABSURD, which is the
 * contrast with `sample-spaces` worth pinning: there the uncorrected sum is
 * exactly 1 and the list refutes it, and here 110/220 = 1/2 is an ordinary
 * number. So this concept cannot borrow that lesson and does not try to — its
 * self-refuting instance is the mixed convention in the second point instead.
 */
t('the union is reached by two routes and they agree, the second handling no overlap',
  (() => {
    const repair = CP_TASKS.find(x => x.given === '(a + b - c)/n')
    const complement = CP_TASKS.find(x => x.given === '(n - c)/n')
    const a = Number(repair.at.a); const b = Number(repair.at.b)
    const c = Number(repair.at.c); const n = Number(repair.at.n)
    return a + b - c === n - Number(complement.at.c)
      && repair.reference === complement.reference
      && repair.knowledgePointId === complement.knowledgePointId
      && Number(complement.at.n) === n
  })(),
  CP_TASKS.filter(x => x.reference === '5/11').map(x => x.given).join(' | '))
t('and the uncorrected sum here is merely wrong, where the concept below\'s was impossible',
  (() => {
    const repair = CP_TASKS.find(x => x.given === '(a + b - c)/n')
    const uncorrected = (Number(repair.at.a) + Number(repair.at.b)) / Number(repair.at.n)
    // 110/220 = 1/2: wrong, in range, and nothing about it announces the fault.
    // `sample-spaces`' corresponding sum is exactly 1, which the list refutes.
    return uncorrected === 0.5 && uncorrected <= 1
      && Number(repair.at.a) / Number(repair.at.n) === 0.25
  })(),
  `uncorrected ${(Number(CP_TASKS.find(x => x.given === '(a + b - c)/n').at.a)
    + Number(CP_TASKS.find(x => x.given === '(a + b - c)/n').at.b))}/220`)
/*
 * THE COMPLEMENT IS TAKEN ON BOTH SIDES OF THE DIVISION, which is a fact about
 * the rule and not two presentations of one task — so the pair is asserted as a
 * pair, with the references DIFFERING because the two complements are different
 * events.
 *
 * `1 - c/n` is also `sample-spaces`' expression, re-asked at a different
 * substitution, and that is asserted across the two concepts: the rule really is
 * unchanged and the only thing that moved is that `c` had to be counted. A test
 * that let the two be different expressions would have missed the point of
 * re-asking it.
 */
t('the complement is taken both after dividing and before, by two different events',
  (() => {
    const after = CP_TASKS.find(x => x.given === '1 - c/n')
    const before = CP_TASKS.find(x => x.given === '(n - c)/n')
    return after.reference !== before.reference
      && after.at.n === '220' && before.at.n === '220'
      && Number(after.at.c) !== Number(before.at.c)
      && after.knowledgePointId === before.knowledgePointId
  })(),
  `after ${CP_TASKS.find(x => x.given === '1 - c/n').reference}, `
  + `before ${CP_TASKS.find(x => x.given === '(n - c)/n').reference}`)
t('and that expression is the concept below\'s, re-asked rather than re-invented',
  (() => {
    const mine = CP_TASKS.find(x => x.given === '1 - c/n')
    const theirs = CE_TASKS.find(x => x.given === '1 - c/n')
    return !!mine && !!theirs && mine.id !== theirs.id
      && mine.given === theirs.given
      && theirs.at.n === '8' && mine.at.n === '220'
      && theirs.at.c === '1' && mine.at.c === '35'
  })(),
  `${CE_TASKS.find(x => x.given === '1 - c/n')?.at.c}/`
  + `${CE_TASKS.find(x => x.given === '1 - c/n')?.at.n} then `
  + `${CP_TASKS.find(x => x.given === '1 - c/n')?.at.c}/`
  + `${CP_TASKS.find(x => x.given === '1 - c/n')?.at.n}`)
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE asserted rather than the total —
 * a ratio over a total would be satisfied by nine tasks distributed any way.
 *
 * THE REFERENCE CHECK IS THE CONCEPT BELOW'S WITH A DIFFERENT DENOMINATOR. There
 * five of nine are k/8 with k whole; here SIX of nine are probabilities and every
 * one is k/220 with k whole and in [0, 220], because every probability is a count
 * of favourable committees over the committees there are. The THREE that are not
 * probabilities are the size of the space, one favourable count and the partition
 * total — which is also this concept's boundary against the counting subject, so
 * a fourth count-only task would mean a count was being asked for its own sake.
 */
t('nine tasks, three on each of the three points',
  CP_TASKS.length === 9
  && CP_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  CP_POINTS.map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, so nothing here needs the worker even for equivalence',
  CP_TASKS.every(x => x.kind === 'evaluate')
  && CP_TASKS.every(x => x.form === undefined)
  && CP_TASKS.every(x => x.domainConditions === undefined)
  && CP_TASKS.every(x => x.acceptsUnevaluated === undefined),
  CP_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
t('no given calls a function, so none of the nine can fall through to a worker',
  CP_TASKS.every(x => !/[a-z]+\s*\(/i.test(x.given)),
  CP_TASKS.filter(x => /[a-z]+\s*\(/i.test(x.given)).map(x => x.given).join(' '))
t('every reference is exactly reproducible from the given — no worker consulted',
  CP_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  CP_TASKS.map(x => x.id).join(', '))
t('six references are probabilities, every one of them a count over the 220 committees',
  (() => {
    const probs = CP_TASKS.filter(x => x.reference.includes('/'))
    const counts = CP_TASKS.filter(x => !x.reference.includes('/'))
    // In [0, 1] AND a count of committees over the size of the space, which is
    // the stronger claim: every reference ships reduced, so the test converts
    // rather than matching 220 as a string.
    const inRange = probs.every(x => {
      const [num, den] = x.reference.split('/').map(Number)
      const favourable = (num * 220) / den
      return num >= 0 && num <= den && Number.isInteger(favourable) && favourable <= 220
    })
    return probs.length === 6 && counts.length === 3 && inRange
      && counts.map(x => x.reference).slice().sort().join(',') === '105,220,220'
  })(),
  CP_TASKS.map(x => x.reference).join(' '))
const cpRulings = await Promise.all(CP_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  cpRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  cpRulings.map((r, i) => `${CP_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(' '))
/*
 * ONE EXPRESSION AT TWO SUBSTITUTIONS ACROSS A POINT BOUNDARY, which is the
 * device the counting subject uses for `a*b*c`. `e/n` is asked at (10, 220) in
 * the first point and (105, 220) in the second: the numerator is one selection
 * count there and a product of two here, and `n` is identical because the space
 * is the same space counted once. The references differ, so the pair cannot read
 * as one task twice.
 */
const CP_RATIOS = CP_TASKS.filter(x => x.given === 'e/n')
t('one ratio expression answers two questions across a point boundary, and they differ',
  CP_RATIOS.length === 2
  && new Set(CP_RATIOS.map(x => x.knowledgePointId)).size === 2
  && CP_RATIOS[0].reference !== CP_RATIOS[1].reference
  && CP_RATIOS.map(x => x.reference).slice().sort().join(',') === '1/22,21/44'
  && CP_RATIOS.every(x => x.at.n === '220'),
  CP_RATIOS.map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * NO TASK ASKS FOR AN ARGUMENT, so every subgoal carries one and every subgoal is
 * authored as a question. The subject-wide version of that assertion is in the
 * group above and covers this concept too; what is asserted here is the half
 * specific to it — that the objectives name `evaluate` and nothing else, so none
 * of the four refusals is promised.
 */
t('every objective names evaluate and nothing else, so no refused kind is promised',
  CP.objectives.length === 3
  && CP.objectives.every(o => o.taskKinds.join(',') === 'evaluate'),
  CP.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))
t('no figure and no speed target is claimed, neither of them existing to claim',
  CP_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  CP_POINTS.filter(p => p.visualRef !== undefined
    || p.automaticityTarget !== undefined).map(p => p.id).join(', '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  CP_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  CP_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * The forty-seventh promotion: conditioning, into the subject that has now taken
 * three consecutive nodes off one chain.
 *
 * `conditional-probability` was a node of `probability` and is the THIRD concept
 * of `chance-and-events`. tests/atlas.mjs owns the structural half — the node
 * being gone, the `links` list NOT growing, the root set tripling, the anchor
 * slot that emptied and was refilled. What is asserted here is the MATERIAL, and
 * six things about it that no count would catch.
 *
 * FIRST, THAT NOT ONE OF THE NINE TASKS ANSWERS WITH A COUNT, which is the
 * assertable form of this concept's boundary and is the exact inverse of the
 * concept below it. There SIX of nine references were counts of committees over
 * the 220 there are and THREE were bare counts. Here all nine lie in [0, 1] and
 * none is a count at all, because every count this concept uses is supplied in
 * the prompt as the concept below's work: the only move it owns is choosing a
 * denominator. A tenth task answering with a count would mean a count was being
 * asked for its own sake.
 *
 * SECOND, THAT THE DENOMINATOR STOPPED BEING THE SPACE, asserted as the split
 * four-against-five on whether `220 x reference` is a whole number. The four
 * that are whole are the questions still asked inside the committee space; the
 * five that are not are asked in a space that is not the committee draw at all —
 * an ordered run of three, a pair, a draw with replacement, and two products of
 * probabilities that are not event counts over anything. In the concept below
 * that figure was nine out of nine. One number says "conditioning replaces the
 * space" about the answers rather than about the prose.
 *
 * THIRD, THAT THE ASYMMETRY IS PRODUCED RATHER THAN WARNED ABOUT. P(A|B) and
 * P(B|A) are asked as the SAME expression with the SAME numerator and only the
 * denominator moved — 6/55 and 6/10 — so a learner computes the difference
 * instead of being told the notation is misleading. Both are recomputed here,
 * and so is the independent route to 3/5, which is three of the five new members
 * being on an all-new committee.
 *
 * FOURTH, THAT THE CHAIN AGREES WITH THE SIMULTANEOUS DRAW, and the agreement is
 * recomputed rather than matched as a string. (5/12) x (4/11) x (3/10) against
 * 10/220 are incomparable at a glance and are the same number, which is the one
 * task in this concept whose answer is a count of committees over the space and
 * which got there with no committees in it.
 *
 * FIFTH, THAT THE INDEPENDENCE TEST IS SHOWN FAILING TWICE AND THE TWO FAILURES
 * DIFFER IN KIND. 1/22 against a product of 1/16 is close and wrong; 0 against a
 * product of 7/968 is wrong for a structural reason that holds for every pair of
 * disjoint events. That is the same editorial shape the concept below used for
 * the mixed convention, and a version with only the disjoint case would teach
 * that a failed test is always obvious.
 *
 * SIXTH, THAT THE FIDELITY IS `checked` WITH THE PATTERN CARRIED VERBATIM — and
 * that the pattern is worse than the concept below's in BOTH directions, which
 * is a first for this file and is asserted rather than described. Its second
 * alternative is DEAD for the same bracket reason as `sample-spaces`' third, and
 * what it does reach includes a title this concept does not teach.
 */
const CO = conceptById(CE, 'conditional-probability')
const CO_POINTS = CO.knowledgePoints
const CO_TASKS = CO_POINTS.flatMap(p => tasksForPoint(p.id))
const CO_SHOWN = CO_POINTS.map(p =>
  `${p.workedExample.subgoals.map(s => s.detail).join(' ')} ${p.workedExample.answer}`).join(' ')
const asRational = ref => {
  const [num, den] = ref.split('/')
  return { n: Number(num), d: den === undefined ? 1 : Number(den) }
}

group('conditional-probability, where the sample space stops being fixed')
/*
 * THE SUBJECT TOTALS HAVE MOVED ON TO THE FORTY-EIGHTH PROMOTION'S GROUP, which
 * is the fourth group to hold them and the fourth consecutive promotion into
 * this subject. What is left here is the half that was never a count: this
 * concept sits THIRD and was APPENDED rather than inserted, which is a claim
 * about the array's order that stays true as concepts are added above it.
 *
 * The totals had to go because they were a count, and a count in the group of
 * the promotion that last moved it goes red on the next correct promotion — the
 * shape this file dissects elsewhere and which the forty-seventh had to repair
 * in four earlier groups. Asserted as an INDEX plus the two ids below it rather
 * than as a length: `concepts[2]` being this concept says it is third, and
 * naming the two beneath it says the array is still in prerequisite order,
 * which a bare index would not.
 */
t('it is the THIRD concept and was appended, which is the claim a total was hiding',
  CE.concepts[2]?.id === 'conditional-probability'
  && CE.concepts.slice(0, 3).map(c => c.id).join(',')
    === 'sample-spaces,counting-probability,conditional-probability'
  && CO_POINTS.length === 3,
  `${CE.concepts.map(c => c.id).join(',')} | ${CO_POINTS.length} points`)
t('the concept is teachable AND practisable, and the subject has no internal faults',
  isTeachable(CE, 'conditional-probability') && isPractisable(CE, 'conditional-probability')
  && ontologyProblems(CE).length === 0 && fidelityMismatches(CE).length === 0,
  ontologyProblems(CE).join('; '))
/*
 * ONE EDGE WAS THE WHOLE STRUCTURAL COST OF THIS PROMOTION — asserted together
 * with the absence of a credit edge, which is the half that was a decision.
 *
 * THE EDGE COUNT USED TO BE HERE AND WAS WRONG TO BE. This line asserted
 * `CE.edges.length === 3` and an exact string of all three, and the
 * forty-eighth promotion took the array to six by correctly declaring three
 * edges at once — so a group that had nothing to do with that change went red.
 * That is the third time in this file a length has done it, after the
 * forty-sixth's two-edge check and the forty-fifth's root-set size, and the
 * repair is the same one every time: assert the edge this promotion OWNS by
 * membership, and assert the containment rule over whatever the array holds.
 * The "only one prerequisite points at this concept" clause is what a bare
 * membership test would miss, since a second one appearing would mean somebody
 * had given this concept a prerequisite it never declared.
 *
 * The node declared one `need` and that concept was already in this subject, so
 * the edge is an ordinary internal one and nothing stranded into
 * `PROBABILITY.links`; tests/atlas.mjs asserts that absence on the area.
 *
 * A credit edge WAS available and is declined on the merits, which no promotion
 * in this file has done before — the forty-sixth lost one it wanted, and this
 * one refuses one it could have had. `conditional-probability => counting-
 * probability` would have been sayable, both ends being here, and the reason it
 * is not said is that this concept supplies every count it uses and never
 * chooses a counting convention, so the concept below's FIRST knowledge point is
 * untouched by doing it. Asserted as the conjunction of the absence and the
 * sayability, because the absence alone would read as an oversight and the file
 * header's argument is that it is not one.
 */
t('its one edge is an ordinary prerequisite, asserted by membership and not by a length',
  CE.edges.some(e => e.from === 'counting-probability'
    && e.to === 'conditional-probability' && e.kind === 'prerequisite' && !!e.promotedBy)
  && CE.edges.filter(e => e.to === 'conditional-probability'
    && e.kind === 'prerequisite').length === 1
  && CE.edges.every(e => CE.concepts.some(c => c.id === e.from)
    && CE.concepts.some(c => c.id === e.to))
  && CE.edges.every(e => !!e.promotedBy),
  CE.edges.map(e => `${e.from}:${e.kind}:${e.to}`).join(' '))
t('and the credit edge it COULD have declared is absent by decision, not by containment',
  !CE.edges.some(e => e.kind === 'encompasses' && e.from === 'conditional-probability')
  && CE.concepts.some(c => c.id === 'counting-probability')
  && CE.concepts.some(c => c.id === 'conditional-probability')
  // Not vacuous: this subject DOES declare credit edges, and every one of them
  // carries a rationale. A bare "none from this id" would also be satisfied by
  // an ontology that had given up on `encompasses` altogether.
  && CE.edges.some(e => e.kind === 'encompasses')
  && CE.edges.filter(e => e.kind === 'encompasses').every(e => !!e.rationale),
  CE.edges.filter(e => e.kind === 'encompasses')
    .map(e => `${e.from}=>${e.to}`).join(' '))
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done, and the node already declared `checked` — `expandNode`
 * sets fidelity from the presence of a `match` — so recognition did not move
 * with the material. Asserted against the literal, the node being GONE and there
 * being nothing left to compare with.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(CO.scope.match)
    === String(/\b(conditional probability|independence \(probability\))\b/i)
  && CO.fidelity === 'checked'
  && CO.caveat === undefined
  && CO.scope.id === CO.id
  && CO.scope.label === CO.name
  && CO.scope.hint === 'conditional probability independence multiplication rule',
  `${CO.fidelity}, ${String(CO.scope.match)}`)
/*
 * THE SECOND DEAD ALTERNATIVE IN THIS FILE'S THREE PATTERNS, found the same way
 * as the first — by testing the pattern rather than reading it.
 *
 * `independence \(probability\)` can never match, because the alternation is
 * wrapped in `\b(...)\b` and the alternative ends in a literal `)`: a `\b` after
 * a non-word character needs a word character next, and there is nothing next.
 * That is exactly the hole `sample-spaces`' `event \(probability theory\)` has,
 * one concept down in the same file, and finding a second one in the next node up
 * the same chain is what turns "a mistake" into "a shape worth sweeping for".
 *
 * IT WOULD HAVE MISSED EVEN WITHOUT THE BRACKET BUG, which is the extra fact
 * this instance adds and is asserted: the article is "Independence (probability
 * theory)", so the alternative is wrong about the title as well as unreachable.
 * The first instance was a working pattern for a real title defeated by one `\b`;
 * this one is defeated twice over, so repairing the `\b` alone would not revive
 * it — which the assertion says, so that the commit that repairs patterns is told
 * which of the two cases it is looking at.
 *
 * NOT FIXED HERE, and for the reason the concept below gives rather than
 * timidity: the pattern moves in its own commit, so that its effect on the
 * recognition figure can be read on its own.
 */
t('the second alternative is DEAD, the trailing \\b after a close bracket never matching',
  !CO.scope.match.test('Independence (probability)')
  && /\\b\(/.test(CO.scope.match.source)
  && /\\\)\)\\b/.test(CO.scope.match.source)
  && CO.scope.match.source.includes('independence \\(probability\\)'),
  `matches: ${CO.scope.match.test('Independence (probability)')}, `
  + `source tail: ${CO.scope.match.source.slice(-30)}`)
t('and it is dead twice over, since the real article is titled differently again',
  !CO.scope.match.test('Independence (probability theory)')
  && !/probability theory/.test(CO.scope.match.source)
  && /\bindependence \(probability\)\b/i.test('Independence (probability)') === false,
  `theory title: ${CO.scope.match.test('Independence (probability theory)')}`)
/*
 * AND THE SHORTFALL IS IN BOTH DIRECTIONS, WHICH IS A FIRST FOR THIS FILE.
 *
 * `sample-spaces` records that its pattern UNDERCLAIMS — every title it reaches
 * is that concept — and calls that the direction to prefer. This one reaches
 * "Conditional probability", which is exactly right, and also "Conditional
 * probability distribution", which is a page about a FUNCTION of a random
 * variable: `random-variables` is a node of `probability` and unwritten, so a
 * learner on that page is offered this concept, which is its prerequisite rather
 * than its subject. That is an overclaim and it is asserted as one, because the
 * alternative — narrowing the pattern — would move the recognition figure in the
 * same edit as the material.
 *
 * What it MISSES is asserted by name too, since a recall gap is invisible by
 * construction: "Independence (probability theory)", "Conditional independence"
 * and "Law of total probability" are all at least partly this material and none
 * matches. The negative clauses are also what would catch the obvious wrong
 * widening, since `/\bindependence\b/` would claim the algebra and set-theory
 * senses of the word and `/\bconditional\b/` would claim conditional
 * expectation, conditional convergence and conditional statements in logic —
 * three authored subjects away.
 */
t('it reaches the title it is for, and overclaims one this concept does not teach',
  CO.scope.match.test('Conditional probability')
  && CO.scope.match.test('Conditional probability distribution')
  // `random-variables` is still a map node — no authored ontology holds it — so
  // the page the pattern overclaims leads to a concept that is its prerequisite
  // rather than to the one it is about.
  && !ONTOLOGIES.some(o => o.concepts.some(c => c.id === 'random-variables')),
  ['Conditional probability', 'Conditional probability distribution']
    .map(s => `${s}:${CO.scope.match.test(s)}`).join(' '))
t('and it misses three titles that are partly this material, which is the invisible half',
  !CO.scope.match.test('Independence (probability theory)')
  && !CO.scope.match.test('Conditional independence')
  && !CO.scope.match.test('Law of total probability')
  && !CO.scope.match.test('Conditional expectation')
  && !CO.scope.match.test('Bayes\' theorem'),
  ['Independence (probability theory)', 'Conditional independence',
    'Law of total probability', 'Conditional expectation', 'Bayes\' theorem']
    .filter(s => CO.scope.match.test(s)).join(', ') || 'none claimed')
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE asserted rather than the total.
 */
t('nine tasks, three on each of the three points',
  CO_TASKS.length === 9
  && CO_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  CO_POINTS.map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, so nothing here needs the worker even for equivalence',
  CO_TASKS.every(x => x.kind === 'evaluate')
  && CO_TASKS.every(x => x.form === undefined)
  && CO_TASKS.every(x => x.domainConditions === undefined)
  && CO_TASKS.every(x => x.acceptsUnevaluated === undefined),
  CO_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
t('no given calls a function, so none of the nine can fall through to a worker',
  CO_TASKS.every(x => !/[a-z]+\s*\(/i.test(x.given)),
  CO_TASKS.filter(x => /[a-z]+\s*\(/i.test(x.given)).map(x => x.given).join(' '))
t('every reference is exactly reproducible from the given — no worker consulted',
  CO_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  CO_TASKS.map(x => x.id).join(', '))
/*
 * NOT ONE OF THE NINE ANSWERS WITH A COUNT, which is the inverse of the concept
 * below and is this concept's boundary against it made arithmetic.
 *
 * There exactly three references were bare counts — the size of the space, a
 * favourable count and a partition total — and that was asserted as the boundary
 * against the COUNTING subject. Here the boundary is against the concept
 * immediately below: every count is supplied in a prompt as its work, and the
 * only move this concept owns is choosing a denominator. So the claim is that
 * all nine are probabilities, asserted in BOTH halves — nine in [0, 1] and zero
 * outside it — and the concept below's three are counted in the same line so the
 * contrast is the assertion rather than a remark.
 */
t('not one of the nine answers with a count, where the concept below has exactly three',
  (() => {
    const mine = CO_TASKS.map(x => asRational(x.reference))
    const theirs = CP_TASKS.map(x => asRational(x.reference))
    return mine.length === 9
      && mine.every(r => r.n >= 0 && r.n <= r.d)
      && mine.filter(r => r.d === 1).length === 0
      && theirs.filter(r => r.d === 1).length === 3
  })(),
  `mine ${CO_TASKS.map(x => x.reference).join(' ')} | theirs `
  + `${CP_TASKS.filter(x => !x.reference.includes('/')).map(x => x.reference).join(' ')}`)
/*
 * AND THE DENOMINATOR STOPPED BEING THE SPACE, which is the sharper half and is
 * one number rather than a description.
 *
 * In the concept below every one of the nine answers was a count of committees or
 * such a count over the 220 there are, so `220 x reference` was a whole number
 * NINE times out of nine. Here it is whole FOUR times and not whole five, and
 * the split is the content: the four are the questions still asked inside the
 * committee space — the two conditionals at 6/55, the reversed one at 3/5, and
 * the 1/22 the chain reproduces — and the five are asked in a space that is not
 * the committee draw at all. Both counts are asserted, and the concept below's
 * nine-of-nine is recomputed in the same line so that the comparison cannot
 * drift.
 */
t('four of the nine are still committee probabilities and five are not, where below it was nine',
  (() => {
    const whole = refs => refs.filter(x => {
      const r = asRational(x.reference)
      return (220 * r.n) % r.d === 0
    }).length
    return whole(CO_TASKS) === 4 && CO_TASKS.length - whole(CO_TASKS) === 5
      && whole(CP_TASKS) === 9
  })(),
  CO_TASKS.map(x => {
    const r = asRational(x.reference)
    return `${x.reference}:${(220 * r.n) % r.d === 0 ? 'committee' : 'elsewhere'}`
  }).join(' '))
const coRulings = await Promise.all(CO_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  coRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  coRulings.map((r, i) => `${CO_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(' '))
/*
 * THREE EXPRESSIONS EACH ASKED AT TWO SUBSTITUTIONS, AND IN EVERY CASE THE TWO
 * ANSWERS DIFFER — which inverts the device the concept below used three times.
 *
 * There three PAIRS OF THE SAME SHAPE agreed on purpose and the agreement was
 * the content: two routes, one number, and the number was the lesson. Here the
 * lesson is that moving one number changes the answer, so a shared reference
 * between two substitutions of one expression would be the error rather than the
 * point. `k/m` goes 6/55 then 3/5, the chain goes 1/22 then 7/66, and the
 * product test goes 1/16 then 7/968.
 *
 * AND EXACTLY ONE PAIR IN THE CONCEPT DOES AGREE, BETWEEN TWO DIFFERENT
 * EXPRESSIONS, which is the one place the concept below's device still applies
 * and is asserted as the single exception rather than left to chance. `k/m` at
 * (6, 55) and `(k/n)/(m/n)` at (6, 55, 220) are 6/55 both times, because
 * |A and B| / |B| and P(A and B) / P(B) are ONE definition with the old space
 * divided out. Two shapes, one answer, where every same-shape pair gives two —
 * so the agreements and the disagreements both carry a claim, and the line above
 * would have been satisfied by nine distinct references which is exactly what
 * this concept must NOT have.
 */
t('each expression asked twice gives two answers, and the only agreement is across shapes',
  (() => {
    const byGiven = {}
    for (const task of CO_TASKS) {
      byGiven[task.given] = (byGiven[task.given] ?? []).concat(task.reference)
    }
    const twice = Object.entries(byGiven).filter(([, refs]) => refs.length === 2)
    const agreeing = CO_TASKS.filter(x =>
      CO_TASKS.some(y => y.id !== x.id && y.reference === x.reference))
    return twice.length === 3
      && twice.every(([, refs]) => refs[0] !== refs[1])
      && twice.map(([g]) => g).slice().sort().join(' | ')
        === '(a/n)*(b/n) | (a/p)*(b/q)*(c/r) | k/m'
      && agreeing.length === 2
      && new Set(agreeing.map(x => x.given)).size === 2
      && new Set(agreeing.map(x => x.reference)).size === 1
      && new Set(CO_TASKS.map(x => x.reference)).size === 8
  })(),
  CO_TASKS.map(x => `${x.given}=${x.reference}`).join(' | '))
/*
 * THE ASYMMETRY OF CONDITIONING IS PRODUCED, NOT WARNED ABOUT — the same
 * expression, the SAME NUMERATOR, and only the denominator moved.
 *
 * Asserted as the conjunction, because each clause alone would be satisfied by
 * the wrong thing: two tasks with different references could be any two tasks,
 * and the same numerator with the same denominator would be a duplicate. The
 * reversed answer is also checked by the route the material gives instead of the
 * formula — three of the five new members are on an all-new committee, so 3/5 —
 * which is a check on the 6 and the 10 rather than a restatement of them.
 */
t('P(A|B) and P(B|A) are one expression with the numerator held and the denominator moved',
  (() => {
    const pair = CO_TASKS.filter(x => x.given === 'k/m')
    if (pair.length !== 2) return false
    const [forward, reversed] = pair[0].at.m === '55' ? pair : [pair[1], pair[0]]
    const f = asRational(forward.reference); const r = asRational(reversed.reference)
    return forward.at.k === reversed.at.k
      && forward.at.m !== reversed.at.m
      && forward.reference !== reversed.reference
      && f.n * 55 === f.d * 6 && r.n * 10 === r.d * 6
      // 3 of the 5 new members sit on an all-new committee of three, which is
      // the reversed conditional reached without the formula.
      && r.n * 5 === r.d * 3
      && forward.knowledgePointId === reversed.knowledgePointId
  })(),
  CO_TASKS.filter(x => x.given === 'k/m')
    .map(x => `${x.at.k}/${x.at.m}=${x.reference}`).join(' | '))
t('and the ratio-of-probabilities route gives the same conditional, the old space cancelling',
  (() => {
    const counts = CO_TASKS.find(x => x.given === 'k/m' && x.at.m === '55')
    const ratio = CO_TASKS.find(x => x.given === '(k/n)/(m/n)')
    if (!counts || !ratio) return false
    return ratio.reference === counts.reference
      && ratio.at.k === counts.at.k && ratio.at.m === counts.at.m
      && ratio.at.n === '220'
      // The only pair in this concept that SHOULD agree, and it agrees because
      // the two forms of the definition are one statement rather than two rules.
      && ratio.knowledgePointId === counts.knowledgePointId
      && ratio.id !== counts.id
  })(),
  `${CO_TASKS.find(x => x.given === '(k/n)/(m/n)')?.reference} vs `
  + `${CO_TASKS.find(x => x.given === 'k/m' && x.at.m === '55')?.reference}`)
/*
 * THE CHAIN AGREES WITH THE SIMULTANEOUS DRAW, recomputed rather than quoted,
 * and it is the ONE task in this concept whose answer is a count of committees
 * over the space — reached with no committees in it.
 *
 * The second clause is what makes the first worth asserting: the two tasks are
 * in different concepts, the chain multiplies three conditional probabilities
 * and the other divides one count by another, and a disagreement would mean a
 * conditional factor was wrong. Also checked: the chain's factors really do
 * descend 12, 11, 10 and 5, 4, 3, so the agreement is not an accident of some
 * other six numbers.
 */
t('the chain of three conditionals reproduces the concept below\'s 1/22, computed not quoted',
  (() => {
    const chain = CO_TASKS.find(x => x.given === '(a/p)*(b/q)*(c/r)' && x.at.c === '3')
    const simultaneous = CP_TASKS.find(x => x.given === 'e/n' && x.at.e === '10')
    if (!chain || !simultaneous) return false
    const num = Number(chain.at.a) * Number(chain.at.b) * Number(chain.at.c)
    const den = Number(chain.at.p) * Number(chain.at.q) * Number(chain.at.r)
    const s = asRational(simultaneous.reference)
    return num * s.d === den * s.n
      && chain.reference === simultaneous.reference
      && [chain.at.p, chain.at.q, chain.at.r].join(',') === '12,11,10'
      && [chain.at.a, chain.at.b, chain.at.c].join(',') === '5,4,3'
  })(),
  `${CO_TASKS.find(x => x.given === '(a/p)*(b/q)*(c/r)' && x.at.c === '3')?.reference} vs `
  + `${CP_TASKS.find(x => x.given === 'e/n' && x.at.e === '10')?.reference}`)
t('and the second chain moves one number, the numerator, which is what conditioning tracks',
  (() => {
    const pair = CO_TASKS.filter(x => x.given === '(a/p)*(b/q)*(c/r)')
    if (pair.length !== 2) return false
    const [allNew, mixed] = pair[0].at.c === '3' ? pair : [pair[1], pair[0]]
    return ['a', 'p', 'b', 'q', 'r'].every(k => allNew.at[k] === mixed.at[k])
      && allNew.at.c !== mixed.at.c
      && allNew.reference !== mixed.reference
      // 3 new left of 10 against 7 not-new of the same 10: the pool is the same
      // and the type counted is not, which is the whole distinction.
      && Number(allNew.at.c) + Number(mixed.at.c) === Number(allNew.at.r)
  })(),
  CO_TASKS.filter(x => x.given === '(a/p)*(b/q)*(c/r)')
    .map(x => `c=${x.at.c}:${x.reference}`).join(' | '))
/*
 * THE TWO PATHS OF THE TREE ARE EQUAL AS A FACT ABOUT THE SHAPE, not a
 * coincidence of these numbers, and that is recomputed — each path is the same
 * two factors multiplied in the other order, which is visible in the `at` rather
 * than hidden inside two equal values.
 *
 * Also asserted: the tree's answer agrees with the SIMULTANEOUS count of the
 * same event, 5 x 7 = 35 mixed pairs out of (12 x 11)/2 = 66. That check is in
 * the material and is arithmetic, so it is checked here rather than trusted — and
 * it is the second time in this concept that a chain of conditionals lands on an
 * answer the counting route would have given.
 */
t('the tree\'s two paths are the same product in the other order, and it adds across them',
  (() => {
    const tree = CO_TASKS.find(x => x.given.includes('+'))
    if (!tree) return false
    const a = Number(tree.at.a); const b = Number(tree.at.b)
    const c = Number(tree.at.c); const d = Number(tree.at.d)
    const p = Number(tree.at.p); const q = Number(tree.at.q)
    const r = asRational(tree.reference)
    return a * b === c * d && a === d && b === c
      && (a * b + c * d) * r.d === p * q * r.n
      // The same event counted simultaneously: 5 × 7 mixed pairs out of C(12, 2).
      && 5 * 7 * r.d === ((12 * 11) / 2) * r.n
  })(),
  `${CO_TASKS.find(x => x.given.includes('+'))?.reference}`)
/*
 * THE INDEPENDENCE TEST FAILS TWICE AND THE TWO FAILURES DIFFER IN KIND, which
 * is the editorial choice this point turns on and is arithmetic, so it is
 * asserted.
 *
 * At (55, 55) the product is 1/16 and the overlap is 1/22 — close, and wrong, so
 * nothing about the numbers announces the dependence. At (10, 35) the overlap is
 * exactly ZERO and the product is not, which fails for a reason that holds of
 * every pair of disjoint events with positive probabilities rather than of these
 * two. A version with only the second would teach that a failed test is obvious,
 * which is the more dangerous lesson — the same shape as the concept below's
 * mixed convention, where one instance looks ordinary and the other exceeds 1.
 */
t('the independence test is shown failing twice, once narrowly and once structurally',
  (() => {
    const pair = CO_TASKS.filter(x => x.given === '(a/n)*(b/n)')
    if (pair.length !== 2) return false
    const [near, disjoint] = pair[0].at.a === '55' ? pair : [pair[1], pair[0]]
    const nearProduct = asRational(near.reference)
    const disjointProduct = asRational(disjoint.reference)
    // The near miss: 10/220 = 1/22 against 1/16, both ordinary probabilities.
    const overlap = { n: 10, d: 220 }
    return nearProduct.n * 16 === nearProduct.d
      && overlap.n * nearProduct.d !== overlap.d * nearProduct.n
      && nearProduct.n / nearProduct.d < 0.07 && overlap.n / overlap.d < 0.07
      // The structural one: the overlap is 0 and the product is not.
      && disjointProduct.n > 0
      && Number(disjoint.at.a) + Number(disjoint.at.b) < 220
      && disjoint.knowledgePointId === near.knowledgePointId
  })(),
  CO_TASKS.filter(x => x.given === '(a/n)*(b/n)')
    .map(x => `(${x.at.a},${x.at.b})=${x.reference}`).join(' | '))
t('and the direction of the near failure is derived in the material, not just asserted',
  // P(Ann | Bob) = 10/55 = 2/11, and independently: Bob takes one of the three
  // places, so Ann competes for 2 among the other 11. Both routes in the text.
  10 * 11 === 55 * 2 && (3 - 1) * 11 === (12 - 1) * 2
  && /2\/11/.test(CO_SHOWN) && /10\/55/.test(CO_SHOWN),
  `2/11 present: ${/2\/11/.test(CO_SHOWN)}, 10/55 present: ${/10\/55/.test(CO_SHOWN)}`)
/*
 * INDEPENDENCE IS WRITTEN AS A REPEATED SYMBOL AND DEPENDENCE AS A FRESH PAIR
 * PER DRAW, which is the one place in these three subjects where the COUNT of
 * declared symbols carries the claim.
 *
 * Two draws either way. The with-replacement task declares two symbols and uses
 * one of them twice; the chain declares six and uses each once. So "the second
 * factor is a copy of the first" and "the space moved" are the two expressions
 * rather than two sentences about them, and a version that wrote `(a/p)*(b/q)`
 * at (5, 12, 5, 12) would have lost it entirely while giving the same answer.
 */
t('independence is a repeated symbol where the dependent chain needed a fresh pair per draw',
  (() => {
    const replaced = CO_TASKS.find(x => x.given === '(a/p)*(a/p)')
    const chain = CO_TASKS.find(x => x.given === '(a/p)*(b/q)*(c/r)')
    if (!replaced || !chain) return false
    return replaced.variables.length === 2
      && Object.keys(replaced.at).length === 2
      && chain.variables.length === 6
      && replaced.at.a === chain.at.a && replaced.at.p === chain.at.p
      && asRational(replaced.reference).d === 144
  })(),
  `${CO_TASKS.find(x => x.given === '(a/p)*(a/p)')?.reference} from `
  + `${CO_TASKS.find(x => x.given === '(a/p)*(a/p)')?.variables.length} symbols`)
/*
 * THE MATERIAL CARRIES WHAT NO TASK CAN ASK, so the three refusals are asserted
 * as absences and the arithmetic of the worked examples is recomputed against
 * WHAT THE TEXT SAYS rather than against the tasks, which is the discipline the
 * arithmetic subject's group introduced.
 */
t('every objective names evaluate and nothing else, so no refused kind is promised',
  CO.objectives.length === 3
  && CO.objectives.every(o => o.taskKinds.join(',') === 'evaluate'),
  CO.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))
t('no figure and no speed target is claimed, neither of them existing to claim',
  CO_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  CO_POINTS.filter(p => p.visualRef !== undefined
    || p.automaticityTarget !== undefined).map(p => p.id).join(', '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  CO_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  CO_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))
t('the conditional comparison in the text is right, 6/55 being more than double 1/22',
  // 6/55 = 12/110 against 1/22 = 5/110, which is the comparison the material
  // makes over a common denominator rather than by eye.
  6 * 110 === 55 * 12 && 1 * 110 === 22 * 5 && 12 > 2 * 5
  && /12\/110/.test(CO_SHOWN) && /5\/110/.test(CO_SHOWN),
  `12/110 present: ${/12\/110/.test(CO_SHOWN)}, 5/110 present: ${/5\/110/.test(CO_SHOWN)}`)
t('and the unconditioned product named in the text is the with-replacement answer, not a slip',
  // (5/12)^3 = 125/1728 is what the second point says a learner who reuses the
  // first factor computes, and the third point's 25/144 is (5/12)^2 — the same
  // mechanism at two draws. Both are recomputed and both appear in the text.
  5 ** 3 === 125 && 12 ** 3 === 1728 && 5 ** 2 === 25 && 12 ** 2 === 144
  && 125 / 1728 > 1 / 22
  && /125\/1728/.test(CO_SHOWN) && /25\/144/.test(CO_SHOWN),
  `125/1728 ≈ ${(125 / 1728).toFixed(4)} against 1/22 ≈ ${(1 / 22).toFixed(4)}`)
t('and the disjoint pair really is disjoint, its two counts being cases of one partition',
  // 10 all-new and 35 with none new are two of the four case counts the concept
  // below audits to 220, so they cannot overlap — which is why P(A and B) = 0
  // there and the product 7/968 is not.
  (() => {
    const audit = CP_TASKS.find(x => x.given === 'a + b + c + d')
    const disjoint = CO_TASKS.find(x => x.given === '(a/n)*(b/n)' && x.at.a === '10')
    if (!audit || !disjoint) return false
    const cases = ['a', 'b', 'c', 'd'].map(k => audit.at[k])
    return cases.includes(disjoint.at.a) && cases.includes(disjoint.at.b)
      && disjoint.at.a !== disjoint.at.b
      && asRational(disjoint.reference).n === 7
      && asRational(disjoint.reference).d === 968
      && 22 * 44 === 968
  })(),
  `${CO_TASKS.find(x => x.given === '(a/n)*(b/n)' && x.at.a === '10')?.reference}`)

// ---------------------------------------------------------------------------

/**
 * The forty-eighth promotion: reversing a conditional, into the subject that has
 * now taken FOUR consecutive nodes off one chain.
 *
 * `bayes-theorem` was a node of `probability` and is the FOURTH concept of
 * `chance-and-events`. tests/atlas.mjs owns the structural half — the node being
 * gone, the `links` list not growing for a second promotion running, the root
 * set SHRINKING, the anchor slot that emptied a second time, and the
 * `interferes_with` edge this promotion had to rescue. What is asserted here is
 * the MATERIAL, and six things about it that no count would catch.
 *
 * FIRST, THAT THE RUNNING EXAMPLE IS GONE AND ITS ABSENCE IS THE BOUNDARY.
 * Twenty-seven tasks across the three concepts below are all twelve club
 * members and 220 committees, so that each new idea arrives on a space the
 * learner already holds. Not one of these nine mentions it. That is not a
 * change of taste: every committee question has a countable overlap, and a
 * reversal is only NEEDED when the overlap cannot be counted — so a Bayes task
 * set on the club would be a division the learner could do by counting
 * instead, which teaches that the theorem is optional. Asserted in both halves,
 * since the absence alone would read as an oversight.
 *
 * SECOND, THAT THE FIGURE WHICH SEPARATED THE TWO CONCEPTS BELOW HAS REACHED ITS
 * FLOOR. `220 x reference` was whole nine times of nine for `counting-
 * probability` and four of nine for `conditional-probability`, and that split
 * carried the claim "conditioning replaces the space". Here it is whole for
 * exactly ONE of the nine, and that one is the integer 18 — whole because it is
 * an integer, not because it is a count of committees. So the measure stops
 * discriminating, which is asserted rather than quietly dropped: a reader who
 * recomputes it should find the reason in a test and not have to guess.
 *
 * THIRD, THAT ONE REFERENCE LEAVES [0, 1] AND EXACTLY ONE. Every reference in
 * these three subjects has been a probability. 18 is an odds ratio, and odds
 * ratios are not probabilities. The count is pinned at one so the exception
 * cannot spread to a task that has no business outside the interval, which is
 * the same discipline the concept below applied to its three bare counts.
 *
 * FOURTH, THAT THREE DIFFERENT SHAPES AGREE ON 2/13, which is the most any
 * concept in these subjects has agreed and is the inverse of the concept below.
 * There three same-shape pairs DISAGREED and exactly one cross-shape pair
 * agreed. Here the definition with its denominator supplied, the definition with
 * its denominator built, and the odds form all give 2/13 — because they are
 * three forms of ONE statement, which is what distinguishes a theorem from a
 * method. Nine distinct references would have been this concept's fault.
 *
 * FIFTH, THAT THE BASE RATE IS SHOWN DECIDING THE ANSWER BY ITSELF. One
 * expression is asked at two substitutions that differ only in `a` and `n`, with
 * both test figures byte-identical, and the answers are 2/13 and 18/19 — the
 * widest SAME-EXPRESSION pair in the subject, which is a superlative with its
 * comparison class named because it is false without one: unrelated pairs of
 * references sit further apart than this. The assertion recomputes that the test
 * figures really are unchanged, because the claim "a test has no accuracy on its
 * own" is false if anything else moved, and it recomputes the ranking against
 * every other repeated expression rather than asserting the word "widest".
 *
 * SIXTH, THAT THE FIDELITY IS `checked` WITH THE PATTERN CARRIED VERBATIM — and
 * that this is the FIRST of this file's four patterns with neither a dead
 * alternative nor an overclaim. The sweep that found the other two was run
 * again rather than assumed, and what this one misses is asserted by name,
 * because a recall gap is invisible by construction.
 */
const BA = conceptById(CE, 'bayes-theorem')
const BA_POINTS = BA.knowledgePoints
const BA_TASKS = BA_POINTS.flatMap(p => tasksForPoint(p.id))
const BA_SHOWN = BA_POINTS.map(p =>
  `${p.workedExample.problem} ${p.workedExample.subgoals.map(s => s.detail).join(' ')} `
  + `${p.workedExample.answer}`).join(' ')

group('bayes-theorem, where the overlap stops being countable')
/*
 * THE SUBJECT TOTALS, WHICH THIS PROMOTION MOVED and which the forty-seventh
 * promotion's group above no longer counts — the fourth group to hold them, for
 * the fourth consecutive promotion into this subject. Four concepts, twelve
 * points, and the array in prerequisite order with the new one appended.
 */
t('four concepts and twelve knowledge points, the figure having moved to this group',
  CE.concepts.length === 4 && allKnowledgePoints(CE).length === 12
  && CE.concepts.map(c => c.id).join(',')
    === 'sample-spaces,counting-probability,conditional-probability,bayes-theorem',
  `${CE.concepts.length} concepts, ${allKnowledgePoints(CE).length} points: `
  + CE.concepts.map(c => c.id).join(','))
t('the concept is teachable AND practisable, and the subject has no internal faults',
  isTeachable(CE, 'bayes-theorem') && isPractisable(CE, 'bayes-theorem')
  && ontologyProblems(CE).length === 0 && fidelityMismatches(CE).length === 0,
  ontologyProblems(CE).join('; '))
/*
 * SIX EDGES NOW, AND THREE OF THEM ARE THIS PROMOTION'S — the most any promotion
 * into this file has declared, and the reason `bayes-theorem` was the candidate
 * to take rather than merely the cheapest.
 *
 * THE PREREQUISITE IS THE WHOLE OF WHAT IT COST. The node declared one `need`
 * and that concept was already here, so nothing stranded into
 * `PROBABILITY.links` for a second promotion running; tests/atlas.mjs asserts
 * that absence on the area.
 *
 * THE CREDIT EDGE IS DECLARED, WHICH IS THE OPPOSITE OF WHAT THE PROMOTION
 * BEFORE DID, and the pair of decisions is why both are asserted with their
 * reasons rather than as bare presences. The forty-seventh could have said
 * `conditional-probability => counting-probability` and refused, because that
 * concept supplies every count it uses and never chooses a counting convention.
 * This one says `bayes-theorem => conditional-probability` because every task
 * here BUILDS an overlap as a rate times a base rate — the lower concept's
 * second point, used — and then divides by the probability of the condition,
 * which is its first point in the form that point insists on writing. Two of
 * three points exercised, which is the standard
 * `counting-probability => sample-spaces` was held to.
 *
 * AND THE INTERFERENCE EDGE IS THE ONE THIS PROMOTION HAD TO RESCUE. The node
 * declared `confusedWith: conditional-probability`, `expandEdges` was turning
 * that into an `interferes_with`, and deleting the node deleted it with nothing
 * going red — interference constrains SELECTION rather than gating. It is
 * re-declared here with the node's own `because` as its `rationale`. Asserted
 * together with the containment that made the rescue possible: both ends are
 * concepts of THIS ontology, and had the far end been authored anywhere else the
 * edge would have been inexpressible rather than merely unwritten, since `links`
 * hard-codes `prerequisite` and carries no kind.
 */
t('it declares three edges, one of each kind the build has, and all six ends are held here',
  CE.edges.length === 6
  && CE.edges.filter(e => [e.from, e.to].includes('bayes-theorem'))
    .map(e => `${e.from}:${e.kind}:${e.to}`).join(' ')
    === 'conditional-probability:prerequisite:bayes-theorem '
    + 'bayes-theorem:encompasses:conditional-probability '
    + 'bayes-theorem:interferes_with:conditional-probability'
  && CE.edges.every(e => CE.concepts.some(c => c.id === e.from)
    && CE.concepts.some(c => c.id === e.to))
  && CE.edges.every(e => !!e.promotedBy),
  CE.edges.map(e => `${e.from}:${e.kind}:${e.to}`).join(' '))
t('the credit edge is DECLARED where the promotion before refused one, and both are reasoned',
  (() => {
    const mine = CE.edges.find(e => e.kind === 'encompasses' && e.from === 'bayes-theorem')
    if (!mine || !mine.rationale) return false
    return mine.to === 'conditional-probability'
      // The refusal one promotion down is still a refusal, so the contrast is
      // asserted rather than described — and both ends of the edge it declined
      // are still here, which is what made it a decision.
      && !CE.edges.some(e => e.kind === 'encompasses' && e.from === 'conditional-probability')
      && CE.concepts.some(c => c.id === 'counting-probability')
      && CE.edges.filter(e => e.kind === 'encompasses').every(e => !!e.rationale)
      // It credits two of the lower concept's three points and the rationale
      // names the one it does not. Checked from the other side too: no task in
      // this concept ever multiplies two unconditional probabilities to compare
      // with an overlap, which is what exercising independence would look like.
      && /independence/i.test(mine.rationale)
      && BA_TASKS.every(x => !/independen/i.test(x.prompt))
  })(),
  CE.edges.filter(e => e.kind === 'encompasses')
    .map(e => `${e.from}=>${e.to}`).join(' '))
t('and the interference edge is rescued, with a rationale and both ends in this ontology',
  (() => {
    const edge = CE.edges.find(e => e.kind === 'interferes_with')
    if (!edge) return false
    return edge.from === 'bayes-theorem' && edge.to === 'conditional-probability'
      && !!edge.rationale
      && /prosecutor/i.test(edge.rationale)
      && CE.concepts.some(c => c.id === edge.from)
      && CE.concepts.some(c => c.id === edge.to)
      && CE.edges.filter(e => e.kind === 'interferes_with').length === 1
      // The two concepts it separates are also prerequisite-ordered, which is
      // not a contradiction: meet conditioning, master it, and only then meet
      // the thing most easily mistaken for it.
      && CE.edges.some(e => e.kind === 'prerequisite'
        && e.from === 'conditional-probability' && e.to === 'bayes-theorem')
      && interferesWith(CE, 'bayes-theorem').includes('conditional-probability')
      && interferesWith(CE, 'conditional-probability').includes('bayes-theorem')
  })(),
  CE.edges.filter(e => e.kind === 'interferes_with')
    .map(e => `${e.from}~${e.to}`).join(' ') || 'NONE — the edge was lost')
/*
 * THE PATTERN IS CARRIED VERBATIM OFF THE MAP NODE, which every promotion since
 * the fourth has done, and the node already declared `checked` — `expandNode`
 * sets fidelity from the presence of a `match` — so recognition did not move
 * with the material. Asserted against the literal, the node being GONE and
 * there being nothing left to compare with.
 */
t('its pattern is the map node\'s unchanged, so recognition did not move with the material',
  String(BA.scope.match) === String(/\bbayes('|’)?[- ]?(theorem|rule|law)\b/i)
  && BA.fidelity === 'checked'
  && BA.caveat === undefined
  && BA.scope.id === BA.id
  && BA.scope.label === BA.name
  && BA.scope.hint === 'bayes theorem prior posterior base rate false positive',
  `${BA.fidelity}, ${String(BA.scope.match)}`)
/*
 * THE FIRST OF THIS FILE'S FOUR PATTERNS WITH NO DEAD ALTERNATIVE, and the sweep
 * was run rather than the absence assumed.
 *
 * `sample-spaces` has `event \(probability theory\)` and `conditional-
 * probability` has `independence \(probability\)`, and both are unreachable for
 * the same reason: the alternation is wrapped in `\b(...)\b` and an alternative
 * ending in a literal `)` cannot be followed by a word boundary. Finding two in
 * three patterns up one chain is what turned it from a mistake into a shape
 * worth sweeping for, so this pattern is swept: no alternative ends in a
 * non-word character, and every branch is shown reaching a real title.
 *
 * Asserted as the conjunction of the structural check and the three live
 * branches, because the structural clause alone would be satisfied by a pattern
 * with one branch and the branch clauses alone would not say that a fourth
 * branch could not be dead.
 */
t('no alternative in this pattern is dead, which is swept rather than assumed',
  (() => {
    const src = BA.scope.match.source
    // The dead-alternative shape is specific: a group whose alternatives end in
    // punctuation, sitting immediately before the trailing `\b`. So the sweep
    // reads the group the `\b` actually follows and requires every one of its
    // alternatives to end in a word character — which is the condition the two
    // dead ones in this file fail and the only condition that matters.
    const tail = src.match(/\(([^()]*)\)\\b$/)
    if (!tail) return false
    const branches = tail[1].split('|')
    return branches.join(',') === 'theorem,rule,law'
      && branches.every(b => /\w$/.test(b))
      && branches.every(b => BA.scope.match.test(`Bayes' ${b}`))
      // And the shape itself is absent: no escaped close-bracket ends a group
      // before the boundary, which is what `event \(probability theory\)` and
      // `independence \(probability\)` both do.
      && !/\\\)\)\\b/.test(src)
  })(),
  ['Bayes\' theorem', 'Bayes\' rule', 'Bayes\' law']
    .map(s => `${s}:${BA.scope.match.test(s)}`).join(' '))
t('and it reaches the curly apostrophe an encyclopaedia actually uses',
  BA.scope.match.test('Bayes’ theorem')
  && BA.scope.match.test('Bayes\' theorem')
  && BA.scope.match.test('Bayes theorem')
  && BA.scope.match.source.includes('’'),
  ['Bayes’ theorem', 'Bayes\' theorem', 'Bayes theorem']
    .map(s => `${s}:${BA.scope.match.test(s)}`).join(' '))
/*
 * AND THE SHORTFALL IS RECALL ONLY, which is the direction `sample-spaces` calls
 * the one to prefer and which the concept below could not manage — its pattern
 * overclaims "Conditional probability distribution". This one claims nothing it
 * does not teach: the four near-miss titles that would be the obvious overclaims
 * are checked as misses, including two that are machine learning rather than
 * probability.
 *
 * WHAT IT MISSES IS ASSERTED BY NAME, since a recall gap is invisible by
 * construction — nothing goes red when a page finds no concept. "Bayes factor"
 * is the sharpest, because it is the likelihood ratio and so is this concept's
 * THIRD knowledge point by another name. The negative clauses are also what
 * would catch the obvious wrong widening: `/\bbayes/i` alone would claim the
 * naive Bayes classifier and Bayesian networks, which are a different subject.
 */
t('it claims nothing it does not teach, the four obvious overclaims all missing',
  !BA.scope.match.test('Bayesian inference')
  && !BA.scope.match.test('Bayesian network')
  && !BA.scope.match.test('Naive Bayes classifier')
  && !BA.scope.match.test('Bayes estimator'),
  ['Bayesian inference', 'Bayesian network', 'Naive Bayes classifier', 'Bayes estimator']
    .filter(s => BA.scope.match.test(s)).join(', ') || 'none claimed')
t('and it misses four titles that are partly this material, the likelihood ratio among them',
  !BA.scope.match.test('Bayes factor')
  && !BA.scope.match.test('Prior probability')
  && !BA.scope.match.test('Base rate fallacy')
  && !BA.scope.match.test('Law of total probability')
  // The first of those is this concept's third knowledge point under another
  // name, and the last is its second.
  && /likelihood ratio/i.test(BA_POINTS[2].statement)
  && /law of total probability/i.test(BA_POINTS[1].statement),
  ['Bayes factor', 'Prior probability', 'Base rate fallacy', 'Law of total probability']
    .filter(s => BA.scope.match.test(s)).join(', ') || 'none reached')
/*
 * NINE TASKS, THREE ON EACH POINT, and the SHAPE asserted rather than the total.
 */
t('nine tasks, three on each of the three points',
  BA_TASKS.length === 9
  && BA_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,3',
  BA_POINTS.map(p => `${p.position}:${tasksForPoint(p.id).length}`).join(' '))
t('all nine are evaluate, so nothing here needs the worker even for equivalence',
  BA_TASKS.every(x => x.kind === 'evaluate')
  && BA_TASKS.every(x => x.form === undefined)
  && BA_TASKS.every(x => x.domainConditions === undefined)
  && BA_TASKS.every(x => x.acceptsUnevaluated === undefined),
  BA_TASKS.map(x => `${x.kind}${x.form ? `:${x.form}` : ''}`).join(' '))
t('no given calls a function, so none of the nine can fall through to a worker',
  BA_TASKS.every(x => !/[a-z]+\s*\(/i.test(x.given)),
  BA_TASKS.filter(x => /[a-z]+\s*\(/i.test(x.given)).map(x => x.given).join(' '))
t('every reference is exactly reproducible from the given — no worker consulted',
  BA_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  BA_TASKS.map(x => x.id).join(', '))
const baRulings = await Promise.all(BA_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  baRulings.every(r => r.status === 'ruled' && r.verdict.ruling === 'correct'),
  baRulings.map((r, i) => `${BA_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(' '))
/*
 * THE SUBTRACTION IS THE FIRST ONE INSIDE A DENOMINATOR IN THESE SUBJECTS, so
 * the check that it cannot vanish is made per task rather than argued once.
 *
 * `(n-a)` is the complement of the base rate, written in terms of it rather than
 * handed over as its own pair of letters — which is what stops a substitution
 * describing two groups that fail to make up the population. It appears inside a
 * denominator in two expressions, and `a < n` at every substitution used, so
 * nothing is ever divided by zero. A base rate of exactly 1 WOULD make the
 * second term of the sum vanish, legitimately and with the answer 1, which is
 * why the check is `a < n` on the tasks rather than a domain condition on the
 * expression.
 */
t('no substitution can make a denominator vanish, which is checked per task',
  BA_TASKS.filter(x => x.given.includes('n-a')).every(x =>
    Number(x.at.a) < Number(x.at.n) && Number(x.at.a) > 0)
  && BA_TASKS.filter(x => x.given.includes('n-a')).length === 5
  && BA_TASKS.every(x => x.domainConditions === undefined),
  BA_TASKS.filter(x => x.given.includes('n-a'))
    .map(x => `a=${x.at.a}<n=${x.at.n}`).join(' '))
/*
 * THE CLUB IS GONE AND THAT IS THE BOUNDARY, asserted in both halves because the
 * absence alone would read as an oversight.
 *
 * The three concepts below set every one of their twenty-seven tasks on twelve
 * members and 220 committees. Not one of these nine mentions either number, and
 * the reason is that a committee question always has a countable overlap while a
 * reversal is only needed when the overlap cannot be counted. The positive half
 * names what replaced it: two rates and a base rate, which is the data a
 * screening test actually supplies.
 */
t('not one of the nine is set on the club, where all eighteen below it are',
  (() => {
    const mine = BA_TASKS.map(x => `${x.prompt} ${x.given}`).join(' ')
    const club = CE.concepts.slice(1, 3)
      .flatMap(c => c.knowledgePoints).flatMap(p => tasksForPoint(p.id))
    const coin = CE.concepts[0].knowledgePoints.flatMap(p => tasksForPoint(p.id))
    return club.length === 18
      && club.every(x => /\b(member|committee)/i.test(x.prompt))
      // A THIRD setting, not a reversion to the first: the subject's own first
      // concept is a coin tossed three times, and these nine are neither.
      && coin.filter(x => /\b(coin|heads|tails|toss)/i.test(x.prompt)).length === 8
      && !/\b(member|committee)/i.test(mine)
      && !/\b(coin|heads|tails|toss)/i.test(mine)
      // What replaced them: two rates and a base rate, which is the data a
      // screening test actually supplies.
      && /1 in 100|1 person in 100/.test(mine)
      && /9 in 10/.test(mine)
      && /1 in 20/.test(mine)
  })(),
  `${BA_TASKS.filter(x => /member|committee|coin/i.test(x.prompt)).length} of nine `
  + 'mention the club or the coin')
/*
 * THE `220 x reference` MEASURE HAS REACHED ITS FLOOR, which is said here rather
 * than quietly dropped.
 *
 * Nine of nine for `counting-probability`, four of nine for
 * `conditional-probability`, and ONE of nine here — and that one is the integer
 * 18, whole because it is an integer rather than because it is a count of
 * committees over the 220 there are. Both earlier figures are recomputed in the
 * same line so the series cannot drift, and the surviving one is identified by
 * its denominator being 1 so that nobody reads it as a committee probability.
 */
t('the committee measure is whole for one of nine, and that one is an integer not a count',
  (() => {
    const whole = tasks => tasks.filter(x => {
      const r = asRational(x.reference)
      return (220 * r.n) % r.d === 0
    })
    const mine = whole(BA_TASKS)
    const below = CE.concepts.slice(0, 3)
      .flatMap(c => c.knowledgePoints).flatMap(p => tasksForPoint(p.id))
    return mine.length === 1
      && asRational(mine[0].reference).d === 1
      && whole(CO_TASKS).length === 4
      && whole(CP_TASKS).length === 9
      && below.length === 27
  })(),
  BA_TASKS.map(x => {
    const r = asRational(x.reference)
    return `${x.reference}:${(220 * r.n) % r.d === 0 ? 'whole' : 'not'}`
  }).join(' '))
/*
 * EXACTLY ONE REFERENCE LEAVES [0, 1], AND IT IS THE ODDS RATIO.
 *
 * Every reference in these three subjects is a probability or a count, and the
 * concept below asserted that all nine of its own lie in the interval. 18 is an
 * odds ratio and does not: odds are not probabilities, which is the fact the
 * third point is partly about. The count is pinned at ONE so the exception
 * cannot spread to a task with no business outside the interval, and the other
 * eight are asserted inside it in the same line. Zero bare counts, which is the
 * one property this concept shares with the concept below.
 */
t('eight of nine are probabilities and the ninth is an odds ratio, which is not one',
  (() => {
    const rs = BA_TASKS.map(x => asRational(x.reference))
    const outside = rs.filter(r => r.n > r.d)
    const counts = rs.filter(r => r.d === 1 && r.n <= r.d)
    return rs.length === 9
      && outside.length === 1
      && outside[0].n === 18 && outside[0].d === 1
      && rs.filter(r => r.n >= 0 && r.n <= r.d).length === 8
      && counts.length === 0
      && BA_TASKS.find(x => x.reference === '18').given === '(s/t)/(f/g)'
  })(),
  BA_TASKS.map(x => x.reference).join(' '))
/*
 * THREE DIFFERENT SHAPES AGREE ON 2/13, which is the most any concept in these
 * subjects has agreed and is the inverse of the concept below's device.
 *
 * There three same-shape pairs DISAGREED on purpose, and exactly one cross-shape
 * pair agreed, asserted as the single exception. Here three expressions of
 * entirely different shapes — the definition with its denominator supplied, the
 * definition with its denominator built, and prior odds times a likelihood
 * ratio — all give 2/13. That is not a repetition: it is the claim that a
 * theorem has forms where a method has steps, and nine distinct references would
 * have been this concept's fault more sharply than it was that one's.
 *
 * Asserted as the conjunction of the shared reference and the three DISTINCT
 * givens, since either alone would be satisfied by the wrong thing: three equal
 * references could be one task written out three times, and three distinct
 * givens could be any three tasks.
 */
t('three different shapes give 2/13, which is a theorem having forms rather than steps',
  (() => {
    const agreeing = BA_TASKS.filter(x => x.reference === '2/13')
    return agreeing.length === 3
      && new Set(agreeing.map(x => x.given)).size === 3
      && new Set(agreeing.map(x => x.knowledgePointId)).size === 3
      // One per knowledge point, so the agreement spans the concept rather than
      // sitting inside one point as a restatement.
      && agreeing.some(x => x.given === '((s/t)*(a/n))/(p/q)')
      && agreeing.some(x =>
        x.given === '((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n))')
      && agreeing.some(x => x.given === '(w*a)/(w*a + (n-a))')
      && new Set(BA_TASKS.map(x => x.reference)).size === 7
  })(),
  BA_TASKS.map(x => `${x.given}=${x.reference}`).join(' | '))
/*
 * THE BASE RATE DECIDES THE ANSWER BY ITSELF, asserted by recomputing that
 * nothing else moved.
 *
 * One expression at two substitutions: 2/13 at a base rate of 1/100 and 18/19 at
 * 1/2, the widest pair in these three subjects. The claim "a test has no
 * accuracy on its own" is FALSE if any test figure differs between the two, so
 * the four test letters are compared for equality rather than the two `at` maps
 * being eyeballed — which is the correction the concept below's asymmetry
 * assertion had to make for the same reason.
 */
t('one expression, two base rates, and every test figure byte-identical between them',
  (() => {
    const pair = BA_TASKS.filter(x =>
      x.given === '((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n))')
    if (pair.length !== 2) return false
    const [low, high] = pair[0].at.n === '100' ? pair : [pair[1], pair[0]]
    const l = asRational(low.reference); const h = asRational(high.reference)
    return ['s', 't', 'f', 'g'].every(k => low.at[k] === high.at[k])
      && low.at.n !== high.at.n
      && l.n * 13 === l.d * 2 && h.n * 19 === h.d * 18
      && l.n / l.d < 0.2 && h.n / h.d > 0.9
      && low.knowledgePointId === high.knowledgePointId
  })(),
  BA_TASKS.filter(x => x.given.startsWith('((s/t)*(a/n))/((s/t)'))
    .map(x => `a/n=${x.at.a}/${x.at.n}:${x.reference}`).join(' | '))
/*
 * AND IT IS THE WIDEST SAME-EXPRESSION PAIR IN THE SUBJECT, with the comparison
 * class computed rather than claimed.
 *
 * The superlative is false without its class — unrelated references in this
 * subject sit as much as 0.99 apart — so what is asserted is the ranking over
 * every expression asked at more than one substitution across all four
 * concepts. There are six such expressions; this one spans about 0.79 and the
 * runner-up, `k/m` at 6/55 against 3/5, spans about 0.49. Recomputed rather
 * than restated, so that a fifth concept adding a wider pair goes red here and
 * sends somebody to the sentence in tasks.ts that says the same thing.
 */
t('it is the widest same-expression pair in the subject, the ranking being recomputed',
  (() => {
    const byGiven = {}
    for (const c of CE.concepts) {
      for (const p of c.knowledgePoints) {
        for (const x of tasksForPoint(p.id)) {
          (byGiven[x.given] = byGiven[x.given] ?? []).push(x.reference)
        }
      }
    }
    const spanOf = refs => {
      const vs = refs.map(r => {
        const q = asRational(r); return q.n / q.d
      })
      return Math.max(...vs) - Math.min(...vs)
    }
    const repeated = Object.entries(byGiven).filter(([, refs]) => refs.length > 1)
    const mine = repeated.find(([g]) =>
      g === '((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n))')
    if (!mine) return false
    const others = repeated.filter(([g]) => g !== mine[0])
    return repeated.length === 6
      && others.length === 5
      && others.every(([, refs]) => spanOf(refs) < spanOf(mine[1]))
      && spanOf(mine[1]) > 0.79 && spanOf(mine[1]) < 0.8
      // The runner-up is the asymmetry of conditioning, one concept down.
      && others.sort((a, b) => spanOf(b[1]) - spanOf(a[1]))[0][0] === 'k/m'
  })(),
  Object.entries((() => {
    const b = {}
    for (const c of CE.concepts) {
      for (const p of c.knowledgePoints) {
        for (const x of tasksForPoint(p.id)) (b[x.given] = b[x.given] ?? []).push(x.reference)
      }
    }
    return b
  })()).filter(([, r]) => r.length > 1).map(([g, r]) => `${g}:${r.join('/')}`).join(' | '))
/*
 * THE TWO OVERLAPS ARE ASKED SEPARATELY AND THE SMALLER RATE WINS, which is this
 * concept's answer and is arithmetic, so it is recomputed.
 *
 * 9/1000 is 18/2000 and the other overlap is 99/2000, so the false positives
 * outnumber the true ones by more than five to one even though 1 in 20 is a far
 * smaller rate than 9 in 10 — because 99 times as many people sit behind the
 * smaller rate. Asked as two tasks rather than folded into the division,
 * because a learner who only meets 9/1000 inside a fraction never makes the
 * comparison. The two also SUM to the denominator the second point builds, which
 * is recomputed here so the three tasks are tied together by arithmetic rather
 * than by their prose.
 */
t('the two overlaps are both asked, the smaller rate wins, and they sum to the denominator',
  (() => {
    const want = BA_TASKS.find(x => x.given === '(s/t)*(a/n)')
    const other = BA_TASKS.find(x => x.given === '(f/g)*((n-a)/n)')
    const total = BA_TASKS.find(x => x.given === '(s/t)*(a/n) + (f/g)*((n-a)/n)')
    if (!want || !other || !total) return false
    const w = asRational(want.reference); const o = asRational(other.reference)
    const s = asRational(total.reference)
    // 99/2000 > 18/2000, by more than a factor of five.
    return o.n * w.d > 5 * (w.n * o.d)
      // and the two really are the terms of the sum: 9/1000 + 99/2000 = 117/2000
      && (w.n * o.d + o.n * w.d) * s.d === s.n * (w.d * o.d)
      // the rate that wins is the SMALLER one, which is the point
      && Number(other.at.f) * Number(want.at.t) < Number(want.at.s) * Number(other.at.g)
      && want.knowledgePointId === other.knowledgePointId
  })(),
  `${BA_TASKS.find(x => x.given === '(s/t)*(a/n)')?.reference} vs `
  + `${BA_TASKS.find(x => x.given === '(f/g)*((n-a)/n)')?.reference} sum `
  + `${BA_TASKS.find(x => x.given.startsWith('(s/t)*(a/n) +'))?.reference}`)
/*
 * THE NATURAL-FREQUENCY CHECK IN THE MATERIAL IS RIGHT, and it is checked
 * against what the TEXT says rather than against the tasks — the discipline the
 * arithmetic subject's group introduced.
 *
 * 10,000 people: 100 have the condition and 90 of those test positive; 9,900 do
 * not and 495 test positive; so 90 of 585 positives have it, and 90/585 = 2/13.
 * That is the first point's answer by a route with no conditional probability in
 * it, it is the form in which the result stops being surprising, and every one
 * of those five counts is recomputed here because a worked example that gets its
 * own check wrong is worse than one with no check.
 */
t('the population check in the text is arithmetic and the arithmetic is right',
  (() => {
    const n = 10000; const have = n / 100; const not = n - have
    const truePos = have * 9 / 10; const falsePos = not / 20
    const positives = truePos + falsePos
    return have === 100 && not === 9900 && truePos === 90 && falsePos === 495
      && positives === 585 && truePos * 13 === positives * 2
      && [/10,000/, /\b100\b/, /9,900/, /\b90\b/, /\b495\b/, /\b585\b/, /90\/585/]
        .every(re => re.test(BA_SHOWN))
  })(),
  `90/585 = ${(90 / 585).toFixed(4)}, 2/13 = ${(2 / 13).toFixed(4)}; `
  + `all counts present: ${[/10,000/, /9,900/, /\b495\b/, /\b585\b/, /90\/585/]
    .every(re => re.test(BA_SHOWN))}`)
/*
 * THE PARTITION CHECK IN THE SECOND POINT IS RIGHT, which is the one check in
 * this concept that would catch a badly chosen split.
 *
 * A sum over cases that do not partition looks exactly like one over cases that
 * do — both are sums of plausible products — so the material runs the same split
 * on the NEGATIVE result and requires 1883/2000, which is 1 − 117/2000. Both
 * terms are recomputed: (1/10)(1/100) = 2/2000 and (19/20)(99/100) = 1881/2000.
 */
t('the negative result splits the same way and comes to the complement, recomputed',
  (() => {
    // Over 2000ths throughout: the two positive terms are 18 and 99.
    const negWith = 2 // (1/10)(1/100) = 1/1000 = 2/2000
    const negWithout = 19 * 99 // (19/20)(99/100) = 1881/2000
    return negWith + negWithout === 1883
      && 2000 - (18 + 99) === 1883
      && /1883\/2000/.test(BA_SHOWN)
      && /1881\/2000/.test(BA_SHOWN)
  })(),
  `2/2000 + 1881/2000 = ${2 + 1881}/2000, and 2000 - 117 = ${2000 - 117}`)
/*
 * THE ODDS ROUTE REPRODUCES THE FIRST POINT'S ANSWER, and it is recomputed from
 * the likelihood ratio rather than matched as a string.
 *
 * The ratio is (9/10)/(1/20) = 18 and the prior odds are 1:99, so the posterior
 * odds are 18:99 and 18/(18+99) = 2/13. The two tasks are tied together here by
 * arithmetic: the `w` in the odds task IS the reference of the ratio task, which
 * is the one place in this concept where one task's answer is another task's
 * input and so is worth asserting rather than trusting.
 */
t('the likelihood ratio is the odds task\'s own input, and the two reach 2/13 together',
  (() => {
    const ratio = BA_TASKS.find(x => x.given === '(s/t)/(f/g)')
    const odds = BA_TASKS.find(x => x.given === '(w*a)/(w*a + (n-a))')
    if (!ratio || !odds) return false
    const r = asRational(odds.reference)
    return odds.at.w === ratio.reference
      && Number(odds.at.w) * Number(odds.at.a) === 18
      && Number(odds.at.n) - Number(odds.at.a) === 99
      && r.n * 13 === r.d * 2
      // 18 against 99 is still under 1:5, which is the point's claim that a big
      // factor on long odds is still long odds.
      && 18 * 5 < 99
  })(),
  `w=${BA_TASKS.find(x => x.given === '(w*a)/(w*a + (n-a))')?.at.w} from ratio `
  + `${BA_TASKS.find(x => x.given === '(s/t)/(f/g)')?.reference}`)
/*
 * THE PROSECUTOR'S FALLACY IS PRODUCED AS TWO NUMBERS, not warned about — which
 * is the shape the concept below used for the asymmetry of conditioning, at the
 * largest scale these subjects can reach.
 *
 * P(match | innocence) = 1/10,000 and P(innocence | match) = 2/3 come out of the
 * same data and differ by more than six thousandfold. The second is the only
 * task in the concept answering about the COMPLEMENT of the case in question,
 * which is deliberate: the number a verdict turns on is the probability of
 * innocence, and it is the one that gets replaced by the other.
 *
 * Asserted with the counting check the material gives, since the odds
 * arithmetic alone would be unfalsifiable prose: one guilty person matches and
 * about 20,000/10,000 = 2 innocents do, so a match picks out three people of
 * whom one is guilty, and 2/3 is the answer by a route with no odds in it.
 */
t('the fallacy is two computed numbers six thousandfold apart, with the count route checked',
  (() => {
    const task = BA_TASKS.find(x => x.given === 'm/(r+m)')
    if (!task) return false
    const r = asRational(task.reference)
    const matchRate = { n: 1, d: 10000 }
    // 2/3 against 1/10,000.
    return r.n * 3 === r.d * 2
      && (r.n * matchRate.d) / (r.d * matchRate.n) > 6000
      // The odds: a likelihood ratio of 10,000 on prior odds of 1:20,000.
      && Number(task.at.r) === 10000 && Number(task.at.m) === 20000
      // The count route: 1 guilty match and 20000/10000 = 2 innocent ones.
      && 20000 / 10000 === 2 && 2 * 3 === (1 + 2) * 2
      && /20,001/.test(BA_SHOWN) && /10,000/.test(BA_SHOWN)
      && task.knowledgePointId === BA_POINTS[2].id
  })(),
  `${BA_TASKS.find(x => x.given === 'm/(r+m)')?.reference} against 1/10000`)
/*
 * THE MATERIAL CARRIES WHAT NO TASK CAN ASK, so the refusals are asserted as
 * absences and every subgoal is checked for the two things types.ts requires of
 * one.
 */
t('every objective names evaluate and nothing else, so no refused kind is promised',
  BA.objectives.length === 3
  && BA.objectives.every(o => o.taskKinds.join(',') === 'evaluate'),
  BA.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))
t('no figure and no speed target is claimed, neither of them existing to claim',
  BA_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  BA_POINTS.filter(p => p.visualRef !== undefined
    || p.automaticityTarget !== undefined).map(p => p.id).join(', '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  BA_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  BA_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => s.label.length <= 20 || /^step\b/i.test(s.label)).map(s => s.label).join(' | '))
/*
 * EIGHTEEN SUBGOALS AND EIGHTEEN QUESTIONS, which is the thing this promotion
 * contributes to the figure that moves.
 *
 * The question map takes its STRUCTURE from every subgoal and its PHRASING from
 * `socratic` when it exists, so an unwritten one is answered by the tutor at ask
 * time. Every subgoal here has one, and the subject-wide assertion that each
 * ends in a question mark is what catches the failure this file names — an
 * imperative with a question mark, or a question written as an instruction with
 * a full stop. Six per point, which is this concept's shape and the concept
 * below's.
 */
t('all eighteen subgoals ship an authored question, six to a point',
  BA_POINTS.every(p => p.workedExample.subgoals.every(s => typeof s.socratic === 'string'
    && s.socratic.length > 0))
  && BA_POINTS.flatMap(p => p.workedExample.subgoals).length === 18
  && BA_POINTS.map(p => p.workedExample.subgoals.length).join(',') === '6,6,6',
  BA_POINTS.map(p => `${p.position}:${p.workedExample.subgoals
    .filter(s => s.socratic).length}/${p.workedExample.subgoals.length}`).join(' '))
t('and every one is interrogative rather than an imperative with a question mark',
  BA_POINTS.flatMap(p => p.workedExample.subgoals)
    .every(s => isInterrogative(s.socratic)),
  BA_POINTS.flatMap(p => p.workedExample.subgoals)
    .filter(s => !isInterrogative(s.socratic)).map(s => s.label).join(' | '))

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
t('the subject has no internal faults with twelve concepts in it',
  ontologyProblems(VI).length === 0, ontologyProblems(VI).join('; '))
t('its fidelity claim matches what its option can do', fidelityMismatches(VI).length === 0)
/*
 * The subject's SIZE is asserted here and moves on every promotion into it —
 * six at the eleventh, seven at the twentieth, eight at the twenty-second, nine
 * at the twenty-third, ten at the thirtieth, eleven at the forty-first, twelve
 * at the forty-second. The half of the claim that is about this promotion is
 * the second one: the dot product still carries the three knowledge points it
 * arrived with, so a later concept has not been written by growing this one.
 * That half is what makes the assertion worth keeping through seven edits of
 * the count — the twenty-third promotion rests ON the dot product, so growing
 * it instead of adding beside it was the live mistake rather than a theoretical
 * one, and the forty-first rests on the twenty-third in turn.
 */
t('twelve concepts, and the dot product still carries the three it arrived with',
  VI.concepts.length === 12
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
/*
 * `chains` is a SUBJECT figure and not this concept's, so it moves on every
 * promotion into the subject — nineteen when the dot product landed,
 * twenty-two when the axioms did, twenty-five when the dimension did,
 * twenty-eight when the inner product did, thirty-one when the rank did,
 * thirty-four when least squares did, thirty-seven since the dual did. Three
 * per promotion, which is the three-knowledge-point shape every concept in this
 * file but one has; a promotion that moved it by anything else would be worth
 * looking at, and seven runs of exactly three is now a claim about the file's
 * habits rather than a coincidence.
 *
 * The claim that belongs to this group is the zero beside it: a chain that
 * cannot become evidence is worse than an unwritten concept, because it looks
 * finished.
 */
t('the subject still has no chain that cannot become evidence',
  DP_COV.chainsWithNoRuling === 0 && DP_COV.chains === 37,
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
t('nine concepts, twenty-seven knowledge points',
  FI.concepts.length === 9 && allKnowledgePoints(FI).length === 27,
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
 *
 * And the twenty-first did it a third time with twelve more, taking the
 * subject to 48 of 72 — still 66%, which is the first promotion here where the
 * RATIO did not move. That is not a regression and it is worth saying why: a
 * concept whose every subgoal is authored cannot lower the fraction, and it
 * raises it only while the fraction is below 100%. Three fully-authored
 * concepts into a file whose first four were labels-only, the ratio is
 * converging on the unauthored remainder rather than stalling. The one-sided
 * assertion below — strictly above the pre-promotion 16/40 — is the form that
 * keeps meaning the same thing through that, which a `=== 60%` check would
 * not.
 *
 * The twenty-sixth added twelve more, 60 of 84, and the ratio moved again —
 * 66.7% to 71.4%. So the previous paragraph's explanation was right and its
 * implied prediction was not: the ratio stalled at the twenty-first because 48
 * and 72 happened to be in the same proportion as 36 and 60, not because a
 * limit had been reached. Which is the argument for the one-sided form a
 * second time. The unauthored remainder is the same 24 subgoals it has been
 * since the file's first four concepts were written, and every promotion
 * dilutes them further without touching them.
 *
 * The thirty-second added twelve more, 72 of 96 — 75%, and the remainder is
 * still those same 24. One of those twelve shipped ENDING IN A FULL STOP on
 * its first pass, which is worth recording because the only thing that caught
 * it was this figure coming out one short of the twelve that were written.
 * `isInterrogative` is a trailing `?` and nothing cleverer, so an imperative
 * subgoal with a period scores zero while looking authored in the file — and
 * the suite's own "no question contains its own answer" assertion is scoped to
 * `FI_SUBGOALS`, which is `sequences` only. Arithmetic on this ratio is the
 * whole detector for the rest of the subject.
 *
 * 75 of 96 now, and the three that moved it are the FIRST writing to come out
 * of that remainder rather than out of a promotion. Every paragraph above
 * describes a concept arriving fully authored and diluting the untouched 24;
 * this one is `domain-and-range`'s third point, authored in place, so the
 * remainder is 21 and the denominator did not move. Which is why the ratio is
 * asserted one-sided and the total is not: a pure authoring run raises the
 * numerator alone, and that is the only shape that actually shrinks the
 * remainder.
 *
 * 78 of 96 now, the second pure authoring run, and the first to open a concept
 * that had NOTHING authored at all: `function-composition`'s three points were
 * 0 of 10 between them, and the three subgoals of its first point are what
 * moved this. The remainder is 18.
 *
 * The remainder's SHAPE is the thing a later run needs and no total carries.
 * It is not spread thinly: the four early concepts stand at 10/10, 9/9, 0/10
 * and 0/11, so all 18 sit in `function-composition` (7 left) and
 * `inverse-functions` (11), and every one of the subject's other seven
 * concepts is fully authored. Two consequences. A run that picks the subject
 * by its total has exactly two places to go, and it will be crossing into a
 * concept nobody has written in — the "prefer a concept with some authored
 * points" heuristic is unsatisfiable here and was already unsatisfiable when
 * this run arrived. And when those 18 are gone the subject is at 96 of 96, so
 * the one-sided ratio assertion below stops being able to fail in either
 * direction; at that point it is the authored-FIELD count per concept, not
 * this coverage figure, that still distinguishes written from generated.
 *
 * 85 of 96 now, the fourth pure authoring run: it took
 * `the-composite-domain-can-shrink`, the last unauthored point in
 * `function-composition`, which closes that concept at 10 of 10. Both measures
 * moved by four again, all four labels having been imperative.
 *
 * So the remainder is 11 and it is now a SINGLE concept: `inverse-functions`,
 * 0 of 11 across its three points, with the subject's other eight concepts at
 * 100%. That returns this subject to the state the paragraph above describes —
 * the "prefer a concept with some authored points" heuristic is unsatisfiable
 * here again, and whoever comes next has to pay the opening cost a second
 * time. It is the same shape as the run that opened `function-composition`,
 * and the three cheap runs that followed are what it bought. Note also that
 * the subject is no longer the lowest by authored count: at 85 of 96 it sits
 * above `rational-expressions` at 82 of 92, so an ascending rank sends the
 * next authoring run there rather than here.
 *
 * 81 of 96 then, the third pure authoring run and the first one the paragraph
 * above actually predicted correctly: it went to `function-composition`, took
 * `the-order-matters` — the earliest of that concept's two unauthored points —
 * and the remainder is 15. The "prefer a concept with some authored points"
 * heuristic was unsatisfiable when the run above arrived and is satisfiable
 * now BECAUSE of it, which is the argument for opening a concept rather than
 * finishing one: the previous run paid the whole cost of crossing into
 * unwritten territory, and every run after it in this concept is cheap. The
 * remaining 15 are 4 in `function-composition` and 11 in `inverse-functions`.
 *
 * The authored-FIELD count and this coverage figure moved together here, by
 * three each, because all three labels were imperative. That agreement is a
 * coincidence of this point and not a property: a subgoal whose label already
 * ends in `?` is counted by `authoredAsQuestions` before anybody writes the
 * question, so the two measures only track each other while the labels stay
 * imperative — which the assertion above this one is what keeps them doing.
 *
 * 89 of 96 now, the fifth pure authoring run, and it PAID the opening cost the
 * paragraph four above said was waiting: it took
 * `an-inverse-undoes-the-rule`, the first of `inverse-functions`' three points,
 * so the concept is 4 of 11 rather than 0 of 11 and the remainder is 7 in two
 * points of one concept. Both measures moved by four, all four labels having
 * been imperative.
 *
 * Note the paragraphs above are NOT in run order — the 85 one was inserted
 * above the 81 one rather than after it — so read the figure at the head of
 * each rather than the position. Ascending authored-field order sent this run
 * here and not to `rational-expressions`: the prediction four paragraphs above
 * was that 85 of 96 sat above `rational-expressions` at 82 of 92 and the next
 * run would go there, and it did — `rational-expressions` is 88 of 92 now,
 * which put this subject back at the bottom. So the heuristic that run quoted
 * was correct and short-lived, and the "prefer a concept with some authored
 * points" one was unsatisfiable here for the second time, exactly as predicted.
 * The next run in this subject is the cheap kind.
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
t('the subject is at twenty-seven chains and still has none that cannot become evidence',
  FI_COV.chains === 27 && FI_COV.chainsWithNoRuling === 0
  && FI_COV.authoredAsQuestions === 89 && FI_COV.questions === 96,
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

/**
 * `functions-of-several-variables`, the twenty-first promotion, and the first
 * concept in this subject whose input is not a single number.
 *
 * WHY THIS NODE is the part that should not have to be rediscovered, so the
 * two grounds that survived are asserted rather than described. Route demand
 * had expired — all ten journeys read zero unwritten since the fourteenth —
 * and no area was near the stub floor, so what was left was:
 *
 *  - RULABILITY WITH NO WORKER, which is the filter that ran first and which
 *    eliminated the candidate with the most dependents. `graphs-of-functions`
 *    has five, more than anything else ready, and ontology-functions.ts
 *    refuses it in writing. That refusal was re-examined here against the
 *    shape-vs-move test — four refusals in this build have expired and every
 *    one described the ANSWER'S SHAPE — and it held, because reading a graph
 *    is a judgement about a drawing with no number behind it to swap to. The
 *    refusal is asserted below as still being in the file, so a future run
 *    that overturns it has to delete the claim rather than quietly contradict
 *    it.
 *  - IT WAS THE SOLE ROOT OF A TWELVE-NODE AREA, so every node of
 *    `multivariable-calculus` was gated behind one unwritten concept. The area
 *    half of that is in tests/atlas.mjs, which builds the composed map.
 *
 * WHAT IT HAD TO GET RIGHT, in the order a mistake would have been silent in:
 *
 *  - THE TWO SLICE TASKS MUST DIFFER IN DEGREE. The second knowledge point's
 *    content is that the SAME function is quadratic along one slice and linear
 *    along the other, and the only durable evidence of that is the two tasks'
 *    own `given` expressions. Asserted from them rather than from a promise in
 *    a comment, because an edit that "tidied" the pair into one shape would
 *    delete the point's whole subject while leaving every count intact.
 *  - THE ORDER TASK MUST NOT BE ZERO. f(3,1) − f(1,3) is the one number in the
 *    set that a learner who reads the pair as unordered cannot reach, and a
 *    symmetric rule would have made it 0 and settled nothing. Asserted by
 *    recomputing the difference from `given` and `at`.
 *  - ONE CREDIT EDGE AND NOT TWO, which is the `gcd-and-lcm` judgement again:
 *    all six tasks are the function concept in use, only two of six meet a
 *    domain.
 *  - EVERY SUBGOAL SHIPPED WITH ITS QUESTION, twelve of twelve.
 */
group('functions of several variables, the twenty-first promotion')

const FI_SV = conceptById(FI, 'functions-of-several-variables')
const FI_SV_POINTS = FI_SV.knowledgePoints
const FI_SV_SUBGOALS = FI_SV_POINTS.flatMap(p => p.workedExample.subgoals)
const FI_SV_TASKS = FI_SV_POINTS.flatMap(p => tasksForPoint(p.id))

t('it is a concept of this subject with material, not a seventh name in the list',
  !!FI_SV && isTeachable(FI, 'functions-of-several-variables')
  && isPractisable(FI, 'functions-of-several-variables'))
t('three knowledge points numbered from 1, the shape every concept here has',
  FI_SV_POINTS.length === 3 && FI_SV_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${FI_SV_POINTS.length} points at ${FI_SV_POINTS.map(p => p.position).join(',')}`)
t('six tasks, two on each of the three points, so no chain cannot become evidence',
  FI_SV_TASKS.length === 6
  && FI_SV_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${FI_SV_TASKS.length} tasks: `
  + FI_SV_POINTS.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
t('every one is an evaluate task, which is the only kind its three objectives name',
  FI_SV_TASKS.every(x => x.kind === 'evaluate')
  && FI_SV.objectives.length === 3
  && FI_SV.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => FI_SV_TASKS.some(x => x.kind === k))),
  FI_SV.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))

/*
 * THE TWO SLICES DIFFER IN DEGREE, from the tasks' own expressions.
 *
 * `several-variables-slice-x-1` holds y and leaves `c*x^2 + 4*c`, which is
 * quadratic in the running letter; `several-variables-slice-y-1` holds x and
 * leaves `(a^2 + 4)*b`, which is linear in it. Checked by the running symbol
 * appearing under a `^2` in one and not the other, and by both arriving at the
 * value of the same f — 87 is f(5,3) and 56 is f(2,7) for f(x,y) = x²y + 4y,
 * recomputed here rather than copied from the references.
 */
t('the two slice tasks differ in degree, which is the whole content of that point',
  (() => {
    const sx = taskById('several-variables-slice-x-1')
    const sy = taskById('several-variables-slice-y-1')
    const f = (x, y) => x * x * y + 4 * y
    return /x\^2/.test(sx.given) && !/x\^2/.test(sy.given)
      && /\(a\^2 \+ 4\)\*b/.test(sy.given) && !/b\^2/.test(sy.given)
      && f(Number(sx.at.x), Number(sx.at.c)) === Number(sx.reference)
      && f(Number(sy.at.a), Number(sy.at.b)) === Number(sy.reference)
  })(),
  `${taskById('several-variables-slice-x-1').given} vs `
  + `${taskById('several-variables-slice-y-1').given}`)
/*
 * THE ORDER TASK IS NOT ZERO, recomputed from `given` and `at`. A symmetric
 * rule — x + y, say — would make this difference 0 for every pair, and 0 is
 * precisely the answer a learner produces by believing the pair is unordered.
 * So the assertion is both that the arithmetic is right and that the example
 * chosen can distinguish anything at all.
 */
t('the ordered-pair task turns on a difference a symmetric rule could not produce',
  (() => {
    const task = taskById('several-variables-order-1')
    const a = Number(task.at.a)
    const b = Number(task.at.b)
    const f = (p, q) => p * p + 3 * q
    return f(a, b) - f(b, a) === Number(task.reference)
      && Number(task.reference) !== 0
      && f(a, b) === Number(taskById('several-variables-pair-1').reference)
  })(),
  `f(3,1) - f(1,3) = ${taskById('several-variables-order-1').reference}`)
/*
 * THE TWO DOMAIN TASKS BOTH SIT ON PAIRS THAT LOOK EXCLUDED AND ARE NOT, which
 * is what makes them tasks about the condition rather than two more
 * evaluations. Each carries the condition it survives, since
 * `Verdict.conditions` is never dropped — and each is checked against the
 * denominator actually being non-zero there, which is the thing that would
 * silently stop being true if somebody edited the pair.
 */
t('both domain tasks evaluate at a pair that only looks forbidden',
  ['several-variables-domain-1', 'several-variables-domain-2'].every(id => {
    const task = taskById(id)
    const x = Number(task.at.x)
    const y = Number(task.at.y)
    // The references are exact fractions, so they are read as a pair of
    // integers rather than parsed as arithmetic — a float comparison here
    // would pass on a reference that had been rounded.
    const [num, den] = task.reference.split('/').map(Number)
    return task.domainConditions?.includes('x^2 - y != 0')
      && x * x - y !== 0
      && num * (x * x - y) === den * (x + y)
  }),
  ['several-variables-domain-1', 'several-variables-domain-2']
    .map(id => `${id}:(${taskById(id).at.x},${taskById(id).at.y})`).join(' '))

/*
 * ONE CREDIT EDGE, AND THE ONE THAT IS ABSENT IS THE ARGUED HALF. Asserted per
 * task, since both claims are about what the tasks do rather than about taste:
 * all six substitute stated numbers into a rule, and only the two on the third
 * point carry a domain condition.
 */
t('its credit edge reaches function-concept, which all six tasks earn',
  FI.edges.some(e => e.kind === 'encompasses'
    && e.from === 'functions-of-several-variables' && e.to === 'function-concept'
    && !!e.rationale)
  && FI_SV_TASKS.every(x => Object.keys(x.at ?? {}).length >= 2),
  FI_SV_TASKS.map(x => `${x.id}:${Object.keys(x.at ?? {}).length}`).join(' '))
t('and none reaches domain-and-range, which only two of the six would exercise',
  !FI.edges.some(e => e.kind === 'encompasses'
    && e.from === 'functions-of-several-variables' && e.to === 'domain-and-range')
  && FI_SV_TASKS.filter(x => (x.domainConditions ?? []).length > 0).length === 2,
  FI_SV_TASKS.filter(x => (x.domainConditions ?? []).length > 0).map(x => x.id).join(' '))
/*
 * THE PREREQUISITE THAT COULD COME HERE, BY NAME, and the one that could not
 * is asserted in tests/atlas.mjs because it is an area `links` entry and this
 * harness cannot see one. Named rather than counted for the usual reason: an
 * edge accidentally hung off `function-concept` instead of `domain-and-range`
 * would leave the root set, the edge count and `ontologyProblems` all
 * unchanged while teaching that a pair's domain rests on nothing.
 */
t('the internal prerequisite is domain-and-range specifically, not merely some edge',
  FI.edges.some(e => e.kind === 'prerequisite'
    && e.from === 'domain-and-range' && e.to === 'functions-of-several-variables'
    && !!e.promotedBy)
  && cycles(FI).length === 0 && teachingOrder(FI) !== null,
  FI.edges.filter(e => e.to === 'functions-of-several-variables')
    .map(e => `${e.from}:${e.kind}`).join(' ') || 'MISSING')
/*
 * THE ROOT IS STILL ONE AND IT IS STILL `function-concept`, which is the claim
 * a count cannot make. This concept hangs off `domain-and-range`, so the
 * subject is now three branches on one root rather than two — and an edge
 * misfiled onto the root itself would have left `roots(FI).length === 1` true.
 */
t('the subject still has one root and this concept hangs off the domain, not the root',
  roots(FI).length === 1 && roots(FI)[0] === 'function-concept'
  && prerequisitesOf(FI, 'functions-of-several-variables').join(',') === 'domain-and-range',
  `roots ${roots(FI).join('/')}, needs `
  + `${prerequisitesOf(FI, 'functions-of-several-variables').join('/')}`)

t('all twelve subgoals ship the question written, not just the label',
  FI_SV_SUBGOALS.length === 12
  && FI_SV_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${FI_SV_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${FI_SV_SUBGOALS.length}`)
t('and none contains its own answer by being an imperative with a mark on it',
  FI_SV_SUBGOALS.every(s => isInterrogative(s.socratic)),
  FI_SV_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('the labels stay imperative, so the map still draws moves',
  FI_SV_SUBGOALS.every(s => !isInterrogative(s.label)),
  FI_SV_SUBGOALS.filter(s => isInterrogative(s.label)).map(s => s.label).join('; '))
t('every subgoal says what its move establishes',
  FI_SV_SUBGOALS.every(s => typeof s.detail === 'string' && s.detail.length > 0))
/*
 * NO FIGURE AND NO SPEED TARGET. The figure half is the load-bearing one here
 * and is the reason this concept could be written at all: the node's `is` line
 * promised level curves, and a `visualRef` naming one that does not exist is
 * the placeholder types.ts forbids. So the picture stayed on the map and the
 * algebra under it came here. No target either — all three points are
 * judgements about which letter does what, and the arithmetic in each is one
 * product or one division.
 */
t('no point claims a figure, which is why the level curves stayed on the map',
  FI_SV_POINTS.every(p => p.visualRef === undefined
    && p.automaticityTarget === undefined),
  FI_SV_POINTS.map(p => `${p.id}:${p.visualRef ?? 'no figure'}`).join(' '))
/*
 * NOTHING HERE MENTIONS A CONTOUR, which is the boundary a reader can apply —
 * the same shape as the `first term / common difference / common ratio` check
 * the sigma group uses against the two sequence nodes that stayed. A level
 * curve is `multivariable-calculus`'s to keep until somebody can draw one.
 */
t('and nothing here names a level curve, a contour or a surface',
  !/level curve|contour|surface|graph of f/i.test(
    JSON.stringify({ points: FI_SV_POINTS, tasks: FI_SV_TASKS, obj: FI_SV.objectives })),
  'the picture has leaked into the concept that deliberately left it behind')
/*
 * AND THE REFUSAL THAT ELIMINATED THE BIGGEST CANDIDATE IS STILL IN THE FILE.
 *
 * `graphs-of-functions` had five dependents at this promotion, more than
 * anything else ready, and was passed over on a written argument rather than on
 * effort. Asserting the argument's presence is what stops the next run
 * rediscovering the node, finding no trace of the reasoning, and either
 * repeating the analysis or authoring it by accident. If it is ever overturned
 * the overturning has to delete this assertion, which is the point.
 */
t('and the refusal that ruled out graphs-of-functions is still written down',
  (() => {
    const src = readFileSync(join(FRONTEND, 'lib', 'concepts', 'ontology-functions.ts'), 'utf8')
    return /graphs-of-functions/.test(src)
      && /cannot rule "the graph is increasing here"/.test(src)
      && !FI.concepts.some(c => c.id === 'graphs-of-functions')
  })(),
  'the graphs refusal has gone from ontology-functions.ts without the node being authored')

// ---------------------------------------------------------------------------

/**
 * `arithmetic-sequences`, the twenty-sixth promotion, and the first in this
 * build whose content was RESERVED FOR IT IN WRITING before it was written.
 *
 * WHY THIS NODE. Route demand has selected nothing since the fourteenth
 * promotion and no area is near the stub floor, so the live criteria are
 * rulability, whether the `needs` point inside one ontology, and dependent
 * count — in that order. This node wins the first two outright: a term, a
 * position and a total are each a plain rational, and its one `needs` is
 * `sequences`, already a concept of this subject. It loses the third outright
 * too, having no dependents anywhere, which is asserted in tests/atlas.mjs
 * over the composed map.
 *
 * What is new is a fourth ground that outranked all of them. The fifth concept
 * in this file wrote down that it was leaving "the closed form of an arithmetic
 * sequence from its first term and common difference" alone; the sixth chose a
 * non-arithmetic sum so that no worked example "would have taken
 * `arithmetic-sequences`'s only real idea"; and tasks.ts recorded an "honest
 * gap" — the inversion, "which term equals 302" — and named this concept as
 * its owner. All three debts are collected below, in that order, and a
 * promotion that collects a reservation cannot overlap what is already written
 * because the boundary was drawn from the other side first.
 *
 * WHAT IT HAD TO GET RIGHT, in the order a mistake would have been silent in:
 *
 *  - THE CHARACTERISTIC WRONG ANSWER HAS TO BE REACHABLE. Each point is about
 *    an off-by-one — steps against positions, twice — so each `given` keeps the
 *    ±1 visible and the computed count hidden. Asserted by evaluating the named
 *    misreading of each task's own `given` and checking it lands on the number
 *    the material says it does. A task that handed the learner the count would
 *    leave every count in this file intact while deleting the content.
 *  - 85 MUST BE A TERM OF THE FIRST TASK'S OWN SEQUENCE. That is the first
 *    point's fourth subgoal: the slip produces a real term at the wrong
 *    position, which is why it survives a sanity check on the size of the
 *    answer. Derived from the task rather than read out of the prose.
 *  - NO CREDIT EDGE, which is `sigma-notation`'s verdict rather than
 *    `sequences`'. One of three tasks evaluates a rule at a position.
 *  - THE INTERFERENCE MUST NOT BE RE-DECLARED HERE. atlas-analysis.ts asked
 *    for exactly that and it would have been a duplicate the composed map
 *    cannot report; the assertions for it are in tests/atlas.mjs, which has
 *    the map node at the other end.
 *  - EVERY SUBGOAL SHIPPED WITH ITS QUESTION, twelve of twelve.
 */
group('arithmetic sequences, the twenty-sixth promotion, collecting a reserved idea')

const FI_AP = conceptById(FI, 'arithmetic-sequences')
const FI_AP_POINTS = FI_AP.knowledgePoints
const FI_AP_SUBGOALS = FI_AP_POINTS.flatMap(p => p.workedExample.subgoals)
const FI_AP_TASKS = FI_AP_POINTS.flatMap(p => tasksForPoint(p.id))

t('it is a concept of this subject with material, not an eighth name in the list',
  !!FI_AP && isTeachable(FI, 'arithmetic-sequences')
  && isPractisable(FI, 'arithmetic-sequences'))
t('three knowledge points numbered from 1, the shape every concept here has',
  FI_AP_POINTS.length === 3 && FI_AP_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${FI_AP_POINTS.length} points at ${FI_AP_POINTS.map(p => p.position).join(',')}`)
t('three tasks, one per point, so no chain is left unable to become evidence',
  FI_AP_TASKS.length === 3
  && FI_AP_POINTS.every(p => tasksForPoint(p.id).length === 1),
  `${FI_AP_TASKS.length} tasks: `
  + FI_AP_POINTS.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))
t('every one is an evaluate task, which is the only kind its three objectives name',
  FI_AP_TASKS.every(x => x.kind === 'evaluate')
  && FI_AP.objectives.length === 3
  && FI_AP.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => FI_AP_TASKS.some(x => x.kind === k))),
  FI_AP.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))

/*
 * THE REACHABLE WRONG ANSWERS, computed from each task's own `given` and `at`
 * under the misreading the material names.
 *
 * This is the guard the concept most needs and the one no count could give. All
 * three points are about an off-by-one, so what makes a task teach rather than
 * merely ask is that the ±1 is still in the expression the learner evaluates
 * and the count it produces is not. A later edit that "simplified"
 * `a + (n - 1)*d` to `a + 19*d`, or handed `ap-sum-1` its 10 terms, would leave
 * every assertion above green and every task's reference correct while removing
 * the only thing being tested.
 *
 * Each row is a named misreading, spelled as an expression over the SAME
 * symbols and evaluated at the SAME inputs, so nothing here agrees with a
 * literal copied out of the prose.
 *
 * `apValue` returns a sentinel rather than throwing, and that is not defensive
 * style — it is the fix for a crash this group had and which was found by
 * injecting the fault above. `parseExpression` THROWS a `ParseError` on a
 * symbol the task does not declare, and a task that has had its off-by-one
 * precomputed away is a task that no longer declares `n`. So the one edit this
 * assertion exists to catch was the one edit that killed the run before it
 * could report anything, taking every later assertion in the file with it. The
 * third instance of that shape in this build, after `teachingOrder(...).length`
 * on a duplicate id and `isInterrogative` on a missing socratic: an assertion
 * whose subject can fail needs the failure to be a VALUE, most of all when the
 * failure is what is being reported.
 */
const apValue = (task, src) => {
  try {
    const symbols = task.variables.map(v => v.name)
    const at = {}
    for (const [name, raw] of Object.entries(task.at)) at[name] = parseExpression(raw, [])
    const value = exactValue(substitute(parseExpression(src, symbols), at))
    return value === null ? 'no rational value' : showExact(value)
  } catch (e) {
    return `unreadable: ${e.message}`
  }
}
t('each task keeps its off-by-one visible, so the named slip lands on the stated number',
  apValue(taskById('ap-term-1'), 'a + n*d') === '85'
  && apValue(taskById('ap-position-1'), '(v - a)/d') === '60'
  && apValue(taskById('ap-sum-1'), '((b - a)/d)/2 * (a + b)') === '189'
  && apValue(taskById('ap-sum-1'), '((b - a)/d + 1) * (a + b)') === '420',
  `${apValue(taskById('ap-term-1'), 'a + n*d')} / `
  + `${apValue(taskById('ap-position-1'), '(v - a)/d')} / `
  + `${apValue(taskById('ap-sum-1'), '((b - a)/d)/2 * (a + b)')} / `
  + `${apValue(taskById('ap-sum-1'), '((b - a)/d + 1) * (a + b)')}`)
/*
 * AND 85 IS A TERM OF THE SAME SEQUENCE, which is the first point's fourth
 * subgoal and the reason that slip is worth four lines of worked example. The
 * position is recomputed from the task's own `a` and `d` rather than asserted
 * as 21: the claim is that the wrong multiplication lands on the NEXT position,
 * and that is a fact about the formula, not about these three numbers.
 */
t('and the first slip lands on the next position rather than on a wrong number',
  (() => {
    const slip = apValue(taskById('ap-term-1'), 'a + n*d')
    const next = apValue(taskById('ap-term-1'), 'a + ((n + 1) - 1)*d')
    /*
     * BOTH SIDES HAVE TO BE NUMBERS, not merely equal to each other — which is
     * the vacuous form this assertion had until the fault injection reached it.
     * `apValue` reports an unparseable misreading as a sentinel STRING now, and
     * two sentinels compare equal, so an edit that broke the task would have
     * made this pass by breaking both halves of it at once. The same shape as
     * the drained-list quantifier recorded in tests/atlas.mjs.
     */
    return /^\d+$/.test(slip) && slip === next && slip !== taskById('ap-term-1').reference
  })(),
  `slip ${apValue(taskById('ap-term-1'), 'a + n*d')}, `
  + `term n+1 ${apValue(taskById('ap-term-1'), 'a + ((n + 1) - 1)*d')}`)
/*
 * THE SECOND POINT'S MEMBERSHIP HALF, from the task's own numbers. Its fourth
 * subgoal says that running the same three moves on 300 leaves 59.6 steps and
 * that a non-integer step count is the answer rather than a failed sum. Checked
 * by doing it: the division must NOT be a whole number, which is the whole
 * claim, and a value chosen carelessly would have made the subgoal false while
 * the task stayed correct.
 */
t('the value the second point rejects really is rejected by its own arithmetic',
  apValue(taskById('ap-position-1'), '(300 - a)/d') === '298/5'
  && apValue(taskById('ap-position-1'), '(v - a)/d') === '60',
  `300 gives ${apValue(taskById('ap-position-1'), '(300 - a)/d')} steps, `
  + `302 gives ${apValue(taskById('ap-position-1'), '(v - a)/d')}`)

/*
 * THE CREDIT EDGE THAT IS NOT THERE, asserted per task as the sigma group does
 * it. `sequences` earns one because all three of its tasks substitute a
 * position into a rule; here only `ap-term-1` does, since `ap-position-1`'s
 * answer is an index and `ap-sum-1` never produces a term. The per-task half is
 * the presence of an `n` — a declared POSITION — in the variable list, which is
 * the same test the sigma group applies with `k`.
 */
t('no encompasses edge, because only one of the three tasks evaluates a rule at a position',
  !FI.edges.some(e => e.kind === 'encompasses' && e.from === 'arithmetic-sequences')
  && FI_AP_TASKS.filter(x => x.variables.some(v => v.name === 'n')).length === 1,
  FI_AP_TASKS.map(x => `${x.id}:${x.variables.map(v => v.name).join('')}`).join(' '))
/*
 * THE FORK, BY NAME. `sequences` has two children now and the root is still
 * one, so neither the root set nor the edge count can say where this was
 * attached. An edge hung off `sigma-notation` would leave both unmoved.
 */
t('the subject forked above the sequence, and this hangs off the sequence itself',
  roots(FI).length === 1 && roots(FI)[0] === 'function-concept'
  && prerequisitesOf(FI, 'arithmetic-sequences').join(',') === 'sequences'
  && FI.edges.filter(e => e.kind === 'prerequisite' && e.from === 'sequences')
    .map(e => e.to).slice().sort().join(' ') === 'arithmetic-sequences sigma-notation'
  && cycles(FI).length === 0 && teachingOrder(FI) !== null,
  `roots ${roots(FI).join('/')}, needs `
  + `${prerequisitesOf(FI, 'arithmetic-sequences').join('/')}, children of sequences: `
  + FI.edges.filter(e => e.kind === 'prerequisite' && e.from === 'sequences')
    .map(e => e.to).join('/'))

t('all twelve subgoals ship the question written, not just the label',
  FI_AP_SUBGOALS.length === 12
  && FI_AP_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${FI_AP_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${FI_AP_SUBGOALS.length}`)
/*
 * The null-safe form, which matters here rather than being defensive style:
 * `isInterrogative` calls `trimEnd()`, so on a missing `socratic` it THROWS —
 * killing the run and every assertion after it — and a missing `socratic` is
 * exactly what the assertion above exists to report.
 */
t('and none contains its own answer by being an imperative with a mark on it',
  FI_AP_SUBGOALS.every(s => typeof s.socratic === 'string' && isInterrogative(s.socratic)),
  FI_AP_SUBGOALS.filter(s => typeof s.socratic !== 'string' || !isInterrogative(s.socratic))
    .map(s => s.label).join('; '))
t('the labels stay imperative, so the map still draws moves',
  FI_AP_SUBGOALS.every(s => !isInterrogative(s.label)),
  FI_AP_SUBGOALS.filter(s => isInterrogative(s.label)).map(s => s.label).join('; '))
t('every subgoal says what its move establishes',
  FI_AP_SUBGOALS.every(s => typeof s.detail === 'string' && s.detail.length > 0))
/*
 * NO FIGURE AND NO SPEED TARGET ON ANY OF THE THREE.
 *
 * The figure is the easy half — there is nothing to draw that is not the list
 * itself. The target is the argued half, and the answer is different from
 * `sequences`, which does claim one on its substitution point. Every point here
 * turns on a DECISION about what to count: steps or positions, a position or a
 * non-membership, pairs or terms. The arithmetic left once the decision is made
 * is one product or one division, so a target would measure that instead — the
 * case types.ts describes as measuring typing.
 */
t('no point claims a figure or a speed target, since the content is what to count',
  FI_AP_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  FI_AP_POINTS.map(p => `${p.id}:${p.automaticityTarget ?? 'no target'}`).join(' '))
/*
 * THE BOUNDARY WITH THE FAMILY THAT STAYED, the same shape as the sigma group's
 * check against the two nodes that were then unwritten. `geometric-sequences`
 * keeps its constant ratio, its closed form and its sum to infinity, which the
 * fifth concept's section in this file promised and which this material must
 * not quietly take — nothing structural would notice, since that node has no
 * material to be shadowed.
 */
t('and nothing here names a common ratio or a sum to infinity, which stayed on the map',
  !/common ratio|geometric|sum to infinity/i.test(
    JSON.stringify({ points: FI_AP_POINTS, tasks: FI_AP_TASKS, obj: FI_AP.objectives })),
  'the other named family has leaked into this concept')
/*
 * AND THE THREE RESERVATIONS ARE DISCHARGED, checked in the files that made
 * them rather than from this concept's own prose.
 *
 * Two of the three are promises to leave something alone, so the discharge is
 * that the promise is still kept AND the content now exists here: the earlier
 * concepts must still not name a common difference, and this one must. The
 * third is tasks.ts's "honest gap", which named the inverting task and the
 * number in it; `ap-position-1` is that task, so the check is that the number
 * survived into it.
 *
 * Asserted because the alternative is a future run re-deriving the content
 * boundary from scratch, and because a reservation nobody collects reads
 * exactly like one that was never made.
 */
t('the two earlier concepts still keep off the difference, and this one owns it',
  /common difference|constant difference/i.test(
    JSON.stringify({ points: FI_AP_POINTS, obj: FI_AP.objectives }))
  && !/common difference/i.test(JSON.stringify({
    seq: conceptById(FI, 'sequences').knowledgePoints,
    sig: conceptById(FI, 'sigma-notation').knowledgePoints,
  })),
  'the reservation has been broken from one side or the other')
t('and the honest gap tasks.ts recorded is the task it named, with its number',
  taskById('ap-position-1').at.v === '302'
  && /302/.test(taskById('ap-position-1').prompt)
  && readFileSync(join(FRONTEND, 'lib', 'concepts', 'tasks.ts'), 'utf8')
    .includes('Which term equals 302'),
  `v = ${taskById('ap-position-1').at.v}`)

// ---------------------------------------------------------------------------

/**
 * `mathematical-induction`, the thirty-second promotion, and the first concept
 * in this build whose subject is an ARGUMENT and whose tasks are not all
 * `evaluate`.
 *
 * WHY THAT IS THE HEADLINE. `geometric-proof` is the other argument-shaped
 * concept in the build and it could not do this: every chain there ends in a
 * claim about a figure, so its refutation objective had to be asked as the two
 * values it reduces to, and `counterexample` went unnamed because nothing can
 * rule a produced object against a claim. The inductive step is different in
 * kind — it IS a factorisation, so `transform_to_form` with `factored` rules
 * it as the move it is, through `checkForm` and an equivalence check with no
 * worker anywhere. That is asserted below per task, because "an argument
 * concept can ship rulable tasks" is the claim this promotion makes and the
 * one a later reader would otherwise have to take on trust.
 *
 * WHAT THE FORM CHECKER FORCED, and it is the kind of thing worth a test
 * rather than a comment. The natural reference for the step on
 * 1 + … + n = n(n + 1)/2 is `(k + 1)(k + 2)/2`, and `checkFactored` REFUSES
 * it: the division collapses `factors()` to a single factor of degree 2, so
 * the correct answer would be marked wrong. So the task asks for the DOUBLED
 * identity, which is what clearing a denominator before factoring looks like
 * on paper anyway. Asserted from the checker rather than described, since a
 * future widening of `factored` to see through a constant denominator would
 * make the workaround unnecessary and nobody would know to revisit it.
 *
 * WHAT IT MUST NOT PRE-EMPT. `arithmetic-sequences` directly above owns
 * DERIVING the total of a run by pairing the ends, and this concept's first
 * worked example proves 1 + 2 + … + n = n(n + 1)/2 — which is an arithmetic
 * sum. The two are different material and the difference is the point: pairing
 * derives the formula from nothing, induction verifies a formula it is handed.
 * So the formula arrives in the problem statement as a claim, and nothing here
 * pairs anything. Asserted both ways, because nothing structural would notice.
 */
const FI_MI = conceptById(FI, 'mathematical-induction')
const FI_MI_POINTS = FI_MI.knowledgePoints
const FI_MI_SUBGOALS = FI_MI_POINTS.flatMap(p => p.workedExample.subgoals)
const FI_MI_TASKS = FI_MI_POINTS.flatMap(p => tasksForPoint(p.id))

group('induction, promoted into the functions subject — an argument that rules')

t('it is a concept of the subject, teachable AND practisable',
  !!FI_MI && isTeachable(FI, 'mathematical-induction')
  && isPractisable(FI, 'mathematical-induction'))
t('the subject still has no internal faults and no fidelity mismatch',
  ontologyProblems(FI).length === 0 && fidelityMismatches(FI).length === 0,
  ontologyProblems(FI).concat(fidelityMismatches(FI)).join('; '))
t('three points, numbered 1,2,3, and every one has a task',
  FI_MI_POINTS.map(p => p.position).join(',') === '1,2,3'
  && FI_MI_POINTS.every(p => tasksForPoint(p.id).length > 0),
  FI_MI_POINTS.map(p => `${p.id}:${tasksForPoint(p.id).length}`).join(' '))

/*
 * THE CLAIM THIS PROMOTION EXISTS TO MAKE: an argument-shaped concept shipping
 * a kind that is not `evaluate`. Named rather than counted — `transform_to_form`
 * appearing SOMEWHERE in six tasks is what a count would say, and the claim is
 * that the two STEP points each have one, since those are the points whose
 * content is a move rather than a number.
 */
t('two of its six tasks are transform_to_form, one on each of the two step points',
  FI_MI_TASKS.length === 6
  && FI_MI_TASKS.filter(x => x.kind === 'transform_to_form')
    .map(x => x.knowledgePointId).slice().sort().join(' ')
    === 'the-step-must-land-on-the-claim-with-k-plus-one-in-it '
      + 'with-no-term-to-add-the-step-is-about-the-increment'
  && FI_MI_TASKS.every(x => x.kind === 'transform_to_form' || x.kind === 'evaluate'),
  FI_MI_TASKS.map(x => `${x.id}:${x.kind}`).join(' '))
/*
 * And `justify` is NOT named, which is the rule `solid-measure` made and the
 * four older concepts in this file still break. An objective names the kinds
 * that would EVIDENCE it, and the build ships no `justify` task — so naming it
 * here would describe a concept nothing can serve, which is the fault
 * `ontologyProblems` reports for an empty `taskKinds` and cannot see in a
 * populated-but-unreachable one.
 */
t('its objectives name only kinds that really ship a task on this concept',
  FI_MI.objectives.length === 3
  && FI_MI.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => FI_MI_TASKS.some(x => x.kind === k))),
  FI_MI.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' '))

/*
 * THE FORM CHECKER'S REFUSAL, asserted so the workaround is revisitable.
 *
 * Three claims: the halved form really is refused, the doubled reference really
 * passes, and the given really does NOT already satisfy what it asks — the
 * last being the property that stops a transform task accepting its own input.
 * If `factored` ever learns to see through a constant denominator, the first of
 * these goes red and whoever sees it can simplify the task.
 */
t('the halved step target is refused by factored, which is why the task asks for the doubled one',
  checkForm(parseExpression('(k + 1)*(k + 2)/2', ['k']), 'factored', 'k').held === false
  && checkForm(parseExpression('(k + 1)*(k + 2)', ['k']), 'factored', 'k').held === true
  && checkForm(parseExpression(taskById('induction-step-factor-1').given, ['k']),
    'factored', 'k').held === false,
  checkForm(parseExpression('(k + 1)*(k + 2)/2', ['k']), 'factored', 'k').detail)
/*
 * And the two factorisations are real identities, re-derived here from the
 * tasks' own `given` and `reference` rather than trusted. `3k(k+1)` is the
 * increment of n³ − n, which is the third point's whole argument; an edit that
 * "simplified" either given would be caught by the arithmetic rather than by a
 * reader.
 */
const miIdentity = (id, k) => {
  const x = taskById(id)
  const sub = s => showExact(exactValue(substitute(
    parseExpression(s, ['k']), { k: parseExpression(String(k), []) })))
  return sub(x.given) === sub(x.reference)
}
t('both transform references are identities, checked at two values each',
  miIdentity('induction-step-factor-1', 7) && miIdentity('induction-step-factor-1', 3)
  && miIdentity('induction-increment-factor-1', 6)
  && miIdentity('induction-increment-factor-1', 2),
  'a transform reference is not equivalent to its given')
/*
 * The three `evaluate` references, re-derived the same way. `induction-base-
 * value-1` is the one that matters most: 4 against a left-hand side of 1 is
 * the entire second knowledge point, and a reference of 1 would make the false
 * claim look true.
 */
t('the three evaluate references are what their givens actually come to',
  ['induction-next-term-1', 'induction-base-value-1', 'induction-base-later-1',
    'induction-increment-sixes-1'].every(id => {
    const x = taskById(id)
    const at = Object.fromEntries(Object.entries(x.at)
      .map(([k, v]) => [k, parseExpression(v, [])]))
    return showExact(exactValue(substitute(
      parseExpression(x.given, x.variables.map(v => v.name)), at))) === x.reference
  }),
  'an evaluate reference does not match its own given')
/*
 * THE TWO TASKS THAT SHARE A `given`, asserted as deliberate. The second
 * point's claim is that a valid step transmits an error EXACTLY, so the gap is
 * constant — and the only way to show that is the same formula at two
 * positions. A later run reading two identical `given` strings would otherwise
 * reasonably take one for a copy-paste slip and delete it.
 */
t('the two base-case tasks share a given on purpose, and differ only in where they stand',
  taskById('induction-base-value-1').given === taskById('induction-base-later-1').given
  && taskById('induction-base-value-1').at.n === '1'
  && taskById('induction-base-later-1').at.n === '4'
  && taskById('induction-base-value-1').at.c === taskById('induction-base-later-1').at.c,
  `n = ${taskById('induction-base-value-1').at.n} and `
  + `${taskById('induction-base-later-1').at.n}`)

/*
 * NO CREDIT EDGE, and this is the cleanest of the three verdicts this file has
 * recorded — zero of six tasks exercise sigma notation, where `sigma-notation`
 * itself was one of three and `arithmetic-sequences` one of three. Two tasks
 * are bare factorisations, two evaluate a CLOSED FORM (the opposite of
 * expanding a sum), one adds four numbers by hand, and one is about a cube. The
 * per-task test is the absence of any summation in the prompts.
 */
t('no encompasses edge, because not one of the six tasks expands a sum',
  !FI.edges.some(e => e.kind === 'encompasses' && e.from === 'mathematical-induction')
  && !FI_MI_TASKS.some(x => /\bsigma\b|Σ|running from/i.test(x.prompt)),
  FI_MI_TASKS.filter(x => /\bsigma\b|Σ|running from/i.test(x.prompt))
    .map(x => x.id).join(' ') || 'none expands a sum')
/*
 * THE EDGE, BY NAME AND BY WHICH END IT HANGS OFF. The subject's root is still
 * `function-concept` and the fork above `sequences` still has two children, so
 * neither the root set nor any count can say where this landed — an edge hung
 * off `sequences` would leave both unmoved while teaching that induction needs
 * no summation notation, which is false of the first two knowledge points.
 *
 * This is also the first concept in the subject whose prerequisite is itself a
 * promoted concept rather than one written here, so the branch is two deep
 * below the fork for the first time.
 */
t('it hangs off sigma-notation specifically, two deep below the fork',
  prerequisitesOf(FI, 'mathematical-induction').join(',') === 'sigma-notation'
  && FI.edges.some(e => e.kind === 'prerequisite' && e.from === 'sigma-notation'
    && e.to === 'mathematical-induction' && !!e.promotedBy)
  && roots(FI).length === 1 && roots(FI)[0] === 'function-concept'
  && prerequisitesOf(FI, 'sigma-notation').join(',') === 'sequences'
  && cycles(FI).length === 0 && teachingOrder(FI) !== null,
  `needs ${prerequisitesOf(FI, 'mathematical-induction').join('/')}, `
  + `roots ${roots(FI).join('/')}`)
/*
 * THE OTHER PREREQUISITE IS ABSENT FROM THIS ONTOLOGY, AND THAT IS THE POINT.
 * The map node declared two `needs` and only one could come here;
 * `geometric-proof` belongs to `plane-geometry`, so an edge naming it would
 * make `ontologyProblems` report an unknown endpoint, and it is an area `links`
 * entry instead. Asserted as an absence HERE, with the positive half in
 * tests/atlas.mjs, which is the harness that composes the map.
 */
t('and geometric-proof is named nowhere in this ontology, which is why it cost a links entry',
  !FI.concepts.some(c => c.id === 'geometric-proof')
  && !FI.edges.some(e => e.from === 'geometric-proof' || e.to === 'geometric-proof'),
  FI.edges.filter(e => /geometric-proof/.test(`${e.from}${e.to}`)).map(e => e.id).join(' ')
  || 'absent, as it must be')

t('all twelve subgoals ship the question written, not just the label',
  FI_MI_SUBGOALS.length === 12
  && FI_MI_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${FI_MI_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${FI_MI_SUBGOALS.length}`)
/*
 * AND EVERY ONE ENDS IN A QUESTION MARK, which is not a formality here: one of
 * these twelve shipped as an imperative ending in a full stop on the first
 * pass, and `isInterrogative` is a trailing `?` and nothing cleverer, so it
 * scored zero while reading as authored in the file. The only thing that caught
 * it was the subject's authored fraction coming out one short. This assertion
 * is what makes that loud instead of arithmetic.
 */
t('and none of them is an imperative with a mark on it',
  FI_MI_SUBGOALS.every(s => typeof s.socratic === 'string' && isInterrogative(s.socratic)),
  FI_MI_SUBGOALS.filter(s => typeof s.socratic !== 'string' || !isInterrogative(s.socratic))
    .map(s => s.label).join('; '))
t('the labels stay imperative, so the map still draws moves',
  FI_MI_SUBGOALS.every(s => !isInterrogative(s.label)),
  FI_MI_SUBGOALS.filter(s => isInterrogative(s.label)).map(s => s.label).join('; '))
t('every subgoal says what its move establishes',
  FI_MI_SUBGOALS.every(s => typeof s.detail === 'string' && s.detail.length > 0))
/*
 * NO FIGURE AND NO SPEED TARGET. The figure is honest absence — there is
 * nothing to draw. The target is argued: every point here turns on recognising
 * which obligation is which, and types.ts says a timing target on that measures
 * typing. The first point in particular is about writing the TARGET down before
 * starting, which rewarding speed would actively punish.
 */
t('no point claims a figure or a speed target, since the content is which move to make',
  FI_MI_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  FI_MI_POINTS.map(p => `${p.id}:${p.automaticityTarget ?? 'no target'}`).join(' '))
/*
 * THE BOUNDARY WITH THE CONCEPT DIRECTLY BELOW IT, both ways. This material
 * must contain the summation formula and must NOT contain its pairing
 * derivation; `arithmetic-sequences` must still own the pairing. Nothing
 * structural would notice either half slipping, since both concepts are
 * authored and neither shadows the other.
 */
t('it verifies the summation formula without deriving it, and the pairing stays below',
  /n\(n \+ 1\)\/2/.test(JSON.stringify({ p: FI_MI_POINTS, t: FI_MI_TASKS }))
  && !/pair/i.test(JSON.stringify({ p: FI_MI_POINTS, t: FI_MI_TASKS }))
  && /pairing|pair/i.test(JSON.stringify(FI_AP_POINTS)),
  'the pairing boundary has been crossed from one side or the other')
/*
 * AND STRONG INDUCTION IS ABSENT, which the node's own `terms` named and this
 * concept deliberately does not carry. Asserted because an absence a header
 * explains is exactly the thing a later run adds in passing, and the reason it
 * is out is structural rather than editorial: its natural examples need a prime
 * factorisation or a two-term recurrence, and no concept here solves either.
 */
t('and strong induction is not quietly here, having been named as left behind',
  !/strong induction/i.test(JSON.stringify({
    p: FI_MI_POINTS, t: FI_MI_TASKS, o: FI_MI.objectives, s: FI_MI.scope,
  })),
  'strong induction has leaked into the material')

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

// ---------------------------------------------------------------------------

/**
 * `vector-spaces`, the twentieth promotion — and the first chosen on a
 * structural argument rather than on demand.
 *
 * Nothing needed it. All ten journeys read zero unwritten, no area is near the
 * stub floor, and about nineteen map nodes have every prerequisite written, so
 * the question was which of nineteen rather than whether any. What decided it
 * is a fact about the MAP and is asserted in tests/atlas.mjs, where the
 * composed atlas is built: the node was the SOLE ROOT of the ten-node
 * `linear-algebra` area, so every node there reached it and the whole area was
 * gated behind one unwritten concept.
 *
 * WHAT THIS SUITE CAN SEE is the subject half, and three claims are worth
 * having here because each would fail silently:
 *
 *  - It WAS a LEAF, and is not one now. The dot product forked the chain and
 *    the three dimensions were inserted into the middle of it; nothing in this
 *    ontology rested on the axioms, so the subject gained a second end. The
 *    twenty-second promotion wrote `basis-and-dimension` into this file and it
 *    declares the axioms in its own `needs`, so they are an interior concept
 *    with one dependent. The half of the claim that keeps working is the
 *    PARENT, by NAME: hung off `vectors-and-spans` instead, which is the
 *    plausible mistake, it would gate the axioms behind span alone and leave
 *    out the one argument that does not look at what a vector is made of. The
 *    leaf half was one-sided — an assertion that nothing rests on this, which
 *    the first thing that does refutes — so it goes red on success rather than
 *    on a fault, and it is replaced below by the dependent's NAME.
 *  - It claims NO credit downward, which is the third `encompasses` refusal
 *    this subject has recorded. The precedent is next door: the thirteenth
 *    promotion's credit claim counts `n1*r1 + n2*r2 + n3*r3` and deliberately
 *    excludes `plane-membership-1`'s `2*x - y + 2*z`, and both closure tasks
 *    here are that excluded shape.
 *  - Its objectives name only `evaluate`, the rule `solid-measure` made. The
 *    sentence this concept wants — "decide whether W is a subspace" — is not an
 *    `evaluate` claim, and what `evaluate` evidences is the number the
 *    condition returns at a sum.
 */
const VS = conceptById(VI, 'vector-spaces')
const VS_POINTS = VS.knowledgePoints

group('the twentieth promotion: the axioms, written into the vectors subject')
t('it is a concept of this subject with material, not a seventh name in the list',
  !!VS && isTeachable(VI, 'vector-spaces') && isPractisable(VI, 'vector-spaces'),
  `${VS ? 'present' : 'ABSENT'}`)
t('three knowledge points numbered from 1, the shape every concept here but one has',
  VS_POINTS.length === 3
  && VS_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${VS_POINTS.length} points at ${VS_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and none claims a timing target either',
  VS_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  VS_POINTS.filter(p => p.visualRef || p.automaticityTarget).map(p => p.id).join(' '))
const VS_KINDS = new Set(VS_POINTS.flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  VS.objectives.length > 0
  && VS.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => VS_KINDS.has(k)))
  && [...VS_KINDS].join(',') === 'evaluate'
  && VS_POINTS.every(p => tasksForPoint(p.id).length > 0),
  VS.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` against ${[...VS_KINDS].join('+')}`)
/*
 * The parent, by name. `prerequisitesOf` is compared as a single string here
 * rather than as a sorted set — which this file warns against elsewhere —
 * because the claim is that there is EXACTLY ONE parent and which it is. A set
 * comparison would be the same assertion with more ceremony; what the warning
 * is about is a MULTI-parent list, where edge order is not stable.
 *
 * THE OTHER HALF USED TO BE `dependentsOf(...).length === 0` and had to be
 * rewritten by the twenty-second promotion, which is the lesson worth keeping
 * out of this edit. "Nothing rests on this" is a one-sided claim: it is refuted
 * by the first thing that does, so it goes red on SUCCESS rather than on a
 * fault, and the suite reports authoring as breakage. Phrased over the
 * dependent's NAME instead, it keeps catching the mistake that matters — the
 * dimension hung off `vectors-and-spans` or off the plane rather than off the
 * axioms — and survives the next promotion into the subject by being wrong
 * about a name rather than about a count.
 *
 * IT SURVIVED EXACTLY THAT, ONE PROMOTION LATER, AND THE REWRITE IS ONE WORD
 * DIFFERENT FROM THE ONE BEFORE IT. The twenty-third promotion made
 * `inner-product-spaces` a second dependent of the axioms, so a single-name
 * string went red on success again — one layer up from where the `length === 0`
 * did. What is different is that the fix is now durable rather than deferred: a
 * SET of names grows by having a member added, and the thing worth catching is
 * membership, not arity. Sorted, because `dependentsOf` returns edge order and
 * this file warns against comparing more than one of those as a string.
 */
t('the axioms hang off independence and off nothing else here, and two concepts off them',
  prerequisitesOf(VI, 'vector-spaces').join(' ') === 'linear-independence'
  && dependentsOf(VI, 'vector-spaces').map(c => c.id ?? c).slice().sort().join(' ')
    === 'basis-and-dimension inner-product-spaces'
  && teachingOrder(VI) !== null,
  `${prerequisitesOf(VI, 'vector-spaces').join(', ')} -> `
  + `${dependentsOf(VI, 'vector-spaces').map(c => c.id ?? c).join(', ') || 'nothing in here'}`)
t('and the subject still has one root, so nothing gained a second place to start',
  roots(VI).length === 1 && roots(VI)[0] === 'cartesian-plane', roots(VI).join(', '))
t('it claims no credit downward, which the tasks would not support',
  !edgesOfKind(VI, 'encompasses').some(e => e.from === 'vector-spaces'),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))

group('the twentieth promotion is gradable with no worker')
const VS_TASKS = VS_POINTS.flatMap(p => tasksForPoint(p.id))
t('six tasks, two on each of the three points', VS_TASKS.length === 6
  && VS_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${VS_TASKS.length}`)
t('all six are evaluate, so none of them claims a form',
  VS_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  VS_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  VS_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  VS_TASKS.map(x => x.id).join(', '))
const vsRulings = await Promise.all(VS_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  vsRulings.every(r => r.verdict.ruling === 'correct'),
  vsRulings.map((r, i) => `${VS_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * THE VERDICTS HAD TO DIFFER IN KIND, which is the constraint that shaped this
 * task set the way irrational magnitudes shaped the two before it.
 *
 * The content of a subspace test is that 0 means closed and anything else means
 * not, so a set of tasks that all return 0 would teach the arithmetic and hide
 * the decision — "answer 0" would score full marks across the concept. So the
 * two closure tasks are the SAME `given` at two different inputs with answers
 * that disagree in kind, which is the habit `geometric-proof` established for a
 * pair whose point is an asymmetry, and the third point's second task returns
 * neither 0 nor the disqualifying value.
 *
 * Asserted three ways because each failure is different: a diverging `given`
 * would make the pair two unrelated tasks, equal references would lose the
 * asymmetry, and an all-zero answer set would restore the free mark.
 */
t('the two closure tasks are one expression at two inputs, and disagree in kind',
  taskById('subspace-closed-sum-1').given
    === taskById('not-a-subspace-constant-doubles-1').given
  && taskById('subspace-closed-sum-1').reference === '0'
  && taskById('not-a-subspace-constant-doubles-1').reference === '12',
  `${taskById('subspace-closed-sum-1').reference} vs `
  + `${taskById('not-a-subspace-constant-doubles-1').reference}`)
t('and no answer in the set is reachable by answering zero to everything',
  VS_TASKS.filter(x => x.reference === '0').length === 1,
  VS_TASKS.map(x => `${x.id}:${x.reference}`).join(' '))
t('nothing here takes a square root, so the no-worker contract cost no choosing',
  VS_TASKS.every(x => !/\^\(1\/2\)/.test(x.given) && !/sqrt/.test(x.given)),
  VS_TASKS.filter(x => /\^\(1\/2\)|sqrt/.test(x.given)).map(x => x.id).join(' '))
/*
 * The one place a prompt could hand over its own answer, and the only one
 * worth asserting.
 *
 * Every prompt here states the set's defining condition, so the constants 0 and
 * 6 have to appear — a closure question with the condition withheld is not a
 * question. The number that must NOT appear is the value at the SUM: 12 is what
 * `not-a-subspace-constant-doubles-1` asks for, 6 is what the prompt tells the
 * learner the set demands, and a prompt reading "the sum gives 12" would hand
 * over the whole task. So this is checked on that one prompt rather than as a
 * property of all six, where "contains no numeral it also references" would
 * fail on every coordinate.
 */
t('the one prompt that could leak its answer states the condition and not the value',
  !/\b12\b/.test(taskById('not-a-subspace-constant-doubles-1').prompt)
  && /\b6\b/.test(taskById('not-a-subspace-constant-doubles-1').prompt)
  && taskById('not-a-subspace-constant-doubles-1').reference === '12',
  taskById('not-a-subspace-constant-doubles-1').prompt)
/*
 * EVERY SUBGOAL SHIPPED WITH ITS QUESTION WRITTEN, which the eleventh promotion
 * argued is the single most valuable property of new material here. Twelve
 * arrived and twelve are authored, so the build's authored fraction moves up
 * rather than being diluted.
 *
 * `isInterrogative` is the check that the question clause lands LAST: it tests
 * the final character, and a question with a statement after it is not one a
 * tutor can ask. The thirteenth promotion had one written the wrong way round
 * and this is where it failed before it shipped.
 */
const VS_SUBGOALS = VS_POINTS.flatMap(p => p.workedExample.subgoals)
t('all twelve of its subgoals ship the question written, not just the label',
  VS_SUBGOALS.length === 12 && VS_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${VS_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${VS_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  VS_SUBGOALS.every(s => isInterrogative(s.socratic)),
  VS_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  VS_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  VS_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * `basis-and-dimension`, the twenty-second promotion — and the first chosen on
 * RULABILITY with every other selector spent.
 *
 * The three selectors earlier promotions used are all dead. Every one of the
 * ten journeys reads zero unwritten, so no route demanded it; the smallest area
 * on the map is nine nodes against a stub floor of five, so nothing was frozen
 * or nearly so; and about nineteen map nodes have every prerequisite written,
 * so readiness narrowed the field to nineteen and no further. The node it was
 * taken ahead of is `inner-product-spaces`, which TIES it on dependents (three
 * each) and on edge cost (both of its `needs` are concepts of this ontology
 * too), so neither of those broke it either. What broke it is that a dimension
 * is a count, a coordinate is an exact quotient and an independence test is a
 * product of integers, while length and angle in a general space are a square
 * root and an inverse cosine — the two things this subject has refused to put
 * in front of a learner since the dot product.
 *
 * WHAT THIS SUITE CAN SEE is the subject half. The map half — the area dropping
 * to eight nodes, the root set going from two to three with only one member
 * surviving, and the gate tightening onto this concept in seven places — is in
 * tests/atlas.mjs, where the composed atlas is built.
 *
 * Four claims are worth having here because each would fail silently:
 *
 *  - THE PARENTS, BY NAME AND AS A SET. Two of them, so the comparison is a
 *    sorted set rather than the single string the axioms use: `prerequisitesOf`
 *    returns edge order, which is stable only by accident. The mistake it
 *    catches is the concept hung off `vectors-and-spans` — plausible, since the
 *    coordinate hunt IS a spanning question — which would gate it behind the
 *    span without the independence test the coordinates divide by.
 *  - THE CREDIT EDGE, TAKEN after three refusals in this file, and asserted
 *    against the TASKS rather than against the prose. The claim is that two of
 *    the six tasks have the cross-check as their whole arithmetic, so a
 *    learner cannot produce a coordinate without producing the independence
 *    number on the way.
 *  - THAT IT IS ONE EDGE AND NOT THREE. `encompassedClosure` is transitive, so
 *    the single edge credits `vectors-and-spans` at depth 2 and `plane-vectors`
 *    at depth 3 with nothing else declared. A second edge straight to the span
 *    would have been defensible on one task and would have added a duplicate
 *    route; asserting the DEPTHS is what records that the transitivity was
 *    checked rather than assumed.
 *  - THE SAME-SIZE THEOREM IS DEMONSTRATED AND NOT PROVED. The exchange lemma
 *    is not written, so the second point squeezes the plane's count from both
 *    sides and says in its last subgoal that the general theorem is the same
 *    squeeze. That shortfall is in the `covers` and in the concept header, and
 *    the assertion here is the narrow mechanical half of it: both bounds are
 *    tasks, so neither side of the squeeze is prose only.
 */
const BD = conceptById(VI, 'basis-and-dimension')
const BD_POINTS = BD.knowledgePoints

group('the twenty-second promotion: the dimension, written into the vectors subject')
t('it is a concept of this subject with material, not an eighth name in the list',
  !!BD && isTeachable(VI, 'basis-and-dimension') && isPractisable(VI, 'basis-and-dimension'),
  `${BD ? 'present' : 'ABSENT'}`)
t('three knowledge points numbered from 1, the shape every concept here but one has',
  BD_POINTS.length === 3 && BD_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${BD_POINTS.length} points at ${BD_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and none claims a timing target either',
  BD_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  BD_POINTS.filter(p => p.visualRef || p.automaticityTarget).map(p => p.id).join(' '))
const BD_KINDS = new Set(BD_POINTS.flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  BD.objectives.length > 0
  && BD.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => BD_KINDS.has(k)))
  && [...BD_KINDS].join(',') === 'evaluate'
  && BD_POINTS.every(p => tasksForPoint(p.id).length > 0),
  BD.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` against ${[...BD_KINDS].join('+')}`)
/*
 * The parents as a sorted SET and not as an ordered string, which is the
 * opposite choice from the axioms twenty lines up and for the stated reason:
 * there are two of them, and `prerequisitesOf` returns edge order.
 *
 * The span is asserted from BOTH sides, which is what makes the claim about the
 * plausible mistake rather than about the current edge list. It must not be a
 * DIRECT parent — hanging the coordinate hunt off `vectors-and-spans` is the
 * tempting edge, since finding weights IS a spanning question, and it would
 * gate the concept behind the span without the independence test every
 * coordinate divides by. And it must still be reached transitively, through
 * independence, or the concept would rest on nothing that forms a combination.
 * A one-sided version of this would pass on an edge list with both.
 */
t('it rests on the axioms and on independence, reaching the span only through them',
  prerequisitesOf(VI, 'basis-and-dimension').slice().sort().join(' ')
    === 'linear-independence vector-spaces'
  && !prerequisitesOf(VI, 'basis-and-dimension').includes('vectors-and-spans')
  && allPrerequisitesOf(VI, 'basis-and-dimension').includes('vectors-and-spans')
  && roots(VI).length === 1 && roots(VI)[0] === 'cartesian-plane'
  && teachingOrder(VI) !== null,
  `${prerequisitesOf(VI, 'basis-and-dimension').join(', ')} | roots ${roots(VI).join(', ')}`)
t('it claims credit back down to independence, and two of its tasks bear the claim out',
  edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'basis-and-dimension' && e.to === 'linear-independence' && !!e.rationale)
  && ['basis-coordinate-1', 'one-vector-is-not-enough-1']
    .every(id => /u1\*[vw]2 - u2\*[vw]1/.test(taskById(id).given))
  && taskById('basis-coordinate-1').given.includes(taskById('cross-check-independent-1').given),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))
/*
 * The transitivity, asserted by DEPTH. One declared edge, three concepts
 * credited — so the claim that a second edge to the span would have been a
 * duplicate route is checked rather than asserted in a comment, and a future
 * reader adding one will see the depth change.
 */
t('one edge credits three concepts, the span and the components arriving transitively',
  [...encompassedClosure(VI, 'basis-and-dimension')]
    .map(([id, depth]) => `${id}:${depth}`).sort().join(' ')
    === 'linear-independence:1 plane-vectors:3 vectors-and-spans:2'
  && edgesOfKind(VI, 'encompasses').filter(e => e.from === 'basis-and-dimension').length === 1,
  [...encompassedClosure(VI, 'basis-and-dimension')]
    .map(([id, depth]) => `${id}:${depth}`).join(' '))

group('the twenty-second promotion is gradable with no worker')
const BD_TASKS = BD_POINTS.flatMap(p => tasksForPoint(p.id))
t('six tasks, two on each of the three points', BD_TASKS.length === 6
  && BD_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${BD_TASKS.length}`)
t('all six are evaluate, so none of them claims a form',
  BD_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  BD_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  BD_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  BD_TASKS.map(x => x.id).join(', '))
const bdRulings = await Promise.all(BD_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  bdRulings.every(r => r.verdict.ruling === 'correct'),
  bdRulings.map((r, i) => `${BD_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
t('nothing here takes a square root, so the no-worker contract cost no choosing',
  BD_TASKS.every(x => !/\^\(1\/2\)/.test(x.given) && !/sqrt/.test(x.given)),
  BD_TASKS.filter(x => /\^\(1\/2\)|sqrt/.test(x.given)).map(x => x.id).join(' '))
/*
 * THE ONE NUMBER THAT HAD TO BE CHOSEN, and the assertion is what keeps the
 * choice from being undone by somebody adding a task.
 *
 * A coordinate is `(v2*w1 - v1*w2)/(u1*v2 - u2*v1)`, which is rational only
 * when the numerator is a multiple of the cross-check — 7 for this basis. So w
 * was not picked: the weights were, and w = 2u − v = (3, −5) computed from
 * them. The failure to catch is a SECOND coordinate task on a target chosen
 * first, which would divide into sevenths, rule inconclusive rather than wrong,
 * and be reported as a worker-only task somewhere else entirely. Checked as
 * "the quotient task's answer is a whole number", which is the property the
 * choice was made to secure.
 */
t('the one task that divides lands on a whole number, which is why w was derived and not picked',
  /\//.test(taskById('basis-coordinate-1').given)
  && /^-?\d+$/.test(taskById('basis-coordinate-1').reference)
  && BD_TASKS.filter(x => /\//.test(x.given)).length === 1,
  BD_TASKS.filter(x => /\//.test(x.given)).map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * And the verdict spread, which the twentieth promotion's note argues for: a
 * task set whose every answer is 0 teaches the arithmetic and hides the
 * decision. Two of these six are 0 and they mean different things — redundant
 * in one, "already in the plane those two span" in the other — so the zero
 * carries information rather than being a free mark.
 */
t('no answer in the set is reachable by answering zero to everything',
  BD_TASKS.filter(x => x.reference === '0').length === 2
  && new Set(BD_TASKS.map(x => x.reference)).size === 5,
  BD_TASKS.map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * BOTH BOUNDS OF THE SQUEEZE ARE TASKS, which is the mechanical half of "the
 * same-size theorem is demonstrated rather than proved". The theorem itself is
 * not rulable here and the concept says so; what must not happen is one side of
 * the argument existing only in prose, since then the point would look like two
 * claims and be evidenced as one.
 */
t('both bounds on the size of a basis are tasks, so neither side of the squeeze is prose only',
  tasksForPoint('every-basis-of-a-space-is-the-same-size')
    .map(x => x.id).slice().sort().join(' ')
    === 'one-vector-is-not-enough-1 three-plane-vectors-dependent-1',
  tasksForPoint('every-basis-of-a-space-is-the-same-size').map(x => x.id).join(' '))
const BD_SUBGOALS = BD_POINTS.flatMap(p => p.workedExample.subgoals)
t('all twelve of its subgoals ship the question written, not just the label',
  BD_SUBGOALS.length === 12 && BD_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${BD_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${BD_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  BD_SUBGOALS.every(s => isInterrogative(s.socratic)),
  BD_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  BD_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  BD_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * `inner-product-spaces`, the twenty-third promotion — and the first to be
 * taken by OVERTURNING the previous one's stated reason for passing it over.
 *
 * The group directly above is that reason, written down at the time: a
 * dimension is a count while "length and angle in a general space are a square
 * root and an inverse cosine — the two things this subject has refused to put
 * in front of a learner since the dot product". The two concepts tied on
 * dependents and on edge cost, so that sentence is what broke the tie, and it
 * describes the SHAPE of an answer. tests/atlas.mjs records four refusals of
 * that exact form that all turned out to be overturnable, against one
 * (`linear-inequalities`) that names a MOVE and still binds — so a shape
 * refusal is a claim to re-derive rather than a fact, and the way to re-derive
 * it is to ask what the concept IS rather than what it yields. It is a rule
 * with three properties, and the three questions following from the properties
 * alone are integer arithmetic.
 *
 * WHAT THIS SUITE CAN SEE is the subject half. The map half — the area dropping
 * to seven nodes, the root set shrinking without substituting or splitting, and
 * the gate tightening onto this concept in five places — is in tests/atlas.mjs.
 *
 * Five claims are worth having here because each would fail silently:
 *
 *  - NOT ONE TASK TAKES A ROOT. This is the overturn, reduced to something
 *    mechanical. If a later edit adds a norm task, the refusal above was right
 *    after all and this assertion is where that surfaces — which is the only
 *    honest way to leave an overturned refusal in a file.
 *  - NO TASK ASKS FOR AN ANGLE, which is the half of the refusal that is
 *    CARRIED rather than overturned, and is the subject's boundary as stated in
 *    `covers`. The dot product's own group asserts the same thing about itself;
 *    this is that boundary surviving a concept whose whole content is the
 *    generalisation of the product the boundary was written for.
 *  - THE PARENTS, BY NAME AND AS A SET, and they JOIN THE SUBJECT'S TWO
 *    BRANCHES. This is the first concept here resting on one end of each: the
 *    dot product forked off `plane-vectors` and the span line ran on to the
 *    axioms. The plausible mistake is hanging it off the product alone — the
 *    arithmetic all comes from there — which would gate a concept about what a
 *    general space can carry behind no definition of a space.
 *  - THE CREDIT EDGE, asserted against the TASKS and not the prose, and its
 *    DEPTH. One edge, two concepts credited, because the product already claims
 *    credit down to the components and `encompassedClosure` is transitive.
 *  - THE TWO VALUES THAT DISAGREE ARE ONE PAIR UNDER TWO RULES. The point's
 *    content is that a right angle belongs to a pair AND a rule, so the two
 *    tasks on it must share their inputs and differ in their `given`. Two
 *    different pairs would evidence the arithmetic and hide the claim.
 */
const IPS = conceptById(VI, 'inner-product-spaces')
const IPS_POINTS = IPS.knowledgePoints

group('the twenty-third promotion: the inner product, written into the vectors subject')
t('it is a concept of this subject with material, not a ninth name in the list',
  !!IPS && isTeachable(VI, 'inner-product-spaces') && isPractisable(VI, 'inner-product-spaces'),
  `${IPS ? 'present' : 'ABSENT'}`)
t('three knowledge points numbered from 1, the shape every concept here but one has',
  IPS_POINTS.length === 3 && IPS_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${IPS_POINTS.length} points at ${IPS_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and none claims a timing target either',
  IPS_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  IPS_POINTS.filter(p => p.visualRef || p.automaticityTarget).map(p => p.id).join(' '))
const IPS_KINDS = new Set(IPS_POINTS.flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  IPS.objectives.length > 0
  && IPS.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => IPS_KINDS.has(k)))
  && [...IPS_KINDS].join(',') === 'evaluate'
  && IPS_POINTS.every(p => tasksForPoint(p.id).length > 0),
  IPS.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` against ${[...IPS_KINDS].join('+')}`)
/*
 * The parents as a sorted SET, since there are two and `prerequisitesOf`
 * returns edge order. Both halves are asserted from both sides: the product
 * must be a DIRECT parent, because every number here is one of its, and the
 * axioms must be as well, because the content is what a rule on ANY space can
 * carry. Hung off the product alone — the tempting edge — the concept would
 * read as a longer dot product, which is exactly what its first point says it
 * is not.
 */
t('it rests on the product and on the axioms, joining the two branches of the subject',
  prerequisitesOf(VI, 'inner-product-spaces').slice().sort().join(' ')
    === 'dot-product-geometry vector-spaces'
  && roots(VI).length === 1 && roots(VI)[0] === 'cartesian-plane'
  && teachingOrder(VI) !== null,
  `${prerequisitesOf(VI, 'inner-product-spaces').join(', ')} | roots ${roots(VI).join(', ')}`)
t('it claims credit back down to the product, and two of its tasks bear the claim out',
  edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'inner-product-spaces' && e.to === 'dot-product-geometry' && !!e.rationale)
  && taskById('perpendicular-under-the-dot-rule-1').given
    === taskById('dot-product-1').given
  && taskById('projection-coefficient-1').given
    .includes(taskById('dot-product-1').given)
  && taskById('projection-coefficient-1').given
    .includes(taskById('dot-product-self-1').given),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))
/*
 * The transitivity, by DEPTH. One declared edge, two concepts credited — the
 * product at 1 and the components at 2, the second arriving through the
 * product's own `encompasses` edge. A second edge straight to `plane-vectors`
 * would have added a duplicate route and nothing else, and asserting the depth
 * is what records that it was checked rather than assumed.
 */
t('one edge credits two concepts, the components arriving through the product',
  [...encompassedClosure(VI, 'inner-product-spaces')]
    .map(([id, depth]) => `${id}:${depth}`).sort().join(' ')
    === 'dot-product-geometry:1 plane-vectors:2'
  && edgesOfKind(VI, 'encompasses')
    .filter(e => e.from === 'inner-product-spaces').length === 1,
  [...encompassedClosure(VI, 'inner-product-spaces')]
    .map(([id, depth]) => `${id}:${depth}`).join(' '))
/*
 * And no credit back to the axioms, which is the refusal this concept records.
 * Its prose generalises OVER the axioms and none of its tasks touches one — no
 * closure test, no subspace, no appeal to an axiom by name — and `encompasses`
 * is read by the scheduler as what practising exercises rather than as what the
 * material is about. Fifth refusal of its kind in this file.
 */
t('and no credit back to the axioms, which its tasks never exercise',
  !edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'inner-product-spaces' && e.to === 'vector-spaces'),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))

group('the twenty-third promotion is gradable with no worker')
const IPS_TASKS = IPS_POINTS.flatMap(p => tasksForPoint(p.id))
t('six tasks, two on each of the three points', IPS_TASKS.length === 6
  && IPS_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${IPS_TASKS.length}`)
t('all six are evaluate, so none of them claims a form',
  IPS_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  IPS_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  IPS_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  IPS_TASKS.map(x => x.id).join(', '))
const ipsRulings = await Promise.all(IPS_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  ipsRulings.every(r => r.verdict.ruling === 'correct'),
  ipsRulings.map((r, i) => `${IPS_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * THE ASSERTION THE OVERTURN RESTS ON, and the one to read first if this
 * concept ever goes red.
 *
 * The previous promotion passed this concept over because its content was "a
 * square root and an inverse cosine". The answer to that was not that the
 * refusal was careless — it was that a root and a cosine are what an inner
 * product YIELDS, while what it IS is a rule with three properties, and the
 * questions following from the properties are integers and one whole quotient.
 * So the overturn is only as good as this line: a norm task added later makes
 * the refusal retrospectively right, and this is where that would be caught
 * rather than discovered by a learner handed √50.
 */
t('nothing here takes a square root, which is the whole of the overturned refusal',
  IPS_TASKS.every(x => !/\^\(1\/2\)/.test(x.given) && !/sqrt/.test(x.given)),
  IPS_TASKS.filter(x => /\^\(1\/2\)|sqrt/.test(x.given)).map(x => x.id).join(' '))
/*
 * And the half of that refusal which is CARRIED rather than overturned. The
 * subject's `covers` has said since the dot product that the angle is absent
 * deliberately: the identity hands back cos θ as an exact quotient and that
 * quotient is the answer. Generalising the product is exactly the edit that
 * could have let a degree figure in, so the boundary is re-asserted against the
 * new tasks rather than assumed to have held.
 */
t('and no task asks for an angle, which is the subject\'s boundary and not the grader\'s',
  IPS_TASKS.every(x => !/\b(what angle|which angle|find the angle|arccos|arcsin)\b/i
    .test(`${x.prompt} ${x.given}`))
  && IPS_TASKS.every(x => !/°/.test(x.prompt)),
  IPS_TASKS.filter(x => /°|arccos|arcsin/i.test(`${x.prompt} ${x.given}`))
    .map(x => x.id).join(' '))
/*
 * THE TWO TASKS ON THE SECOND POINT SHARE THEIR INPUTS AND DIFFER IN THEIR
 * RULE, which is the point's content expressed as a constraint on the task set
 * rather than as prose. "A right angle belongs to a pair AND a rule" is
 * evidenced by one pair returning 0 under one rule and 6 under another; two
 * different pairs would evidence the arithmetic and say nothing about the
 * claim, and every suite would stay green.
 */
t('the pair that disagrees is ONE pair under two rules, which is the claim rather than the sum',
  (() => {
    const [a, b] = tasksForPoint('a-right-angle-belongs-to-a-pair-and-a-rule')
    return JSON.stringify(a.at) === JSON.stringify(b.at)
      && a.given !== b.given
      && new Set([a.reference, b.reference]).size === 2
      && [a.reference, b.reference].includes('0')
  })(),
  tasksForPoint('a-right-angle-belongs-to-a-pair-and-a-rule')
    .map(x => `${x.given} = ${x.reference}`).join(' | '))
/*
 * The verdict spread, which the twentieth promotion's note argues for: a task
 * set whose every answer is 0 teaches the arithmetic and hides the decision.
 * Two of these six are 0 and they mean different things — "perpendicular under
 * this rule" in one, "the remainder really is orthogonal, as it had to be" in
 * the other — so the zero carries information rather than being a free mark.
 */
t('no answer in the set is reachable by answering zero to everything',
  IPS_TASKS.filter(x => x.reference === '0').length === 2
  && new Set(IPS_TASKS.map(x => x.reference)).size === 5,
  IPS_TASKS.map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * The one task that asks for the coefficient must not be HANDED it. `at`
 * decides which symbols a task substitutes, so declaring `c` on the task that
 * asks for `c` would substitute the answer into the question — which is the
 * one place in this subject an unused-but-declared symbol costs something
 * rather than nothing. Asserted as the absence, since the two tasks sit beside
 * each other and the other one does declare it.
 */
t('the task that asks for the coefficient is not handed it, while the one that uses it is',
  !taskById('projection-coefficient-1').variables.some(v => v.name === 'c')
  && !('c' in taskById('projection-coefficient-1').at)
  && taskById('orthogonal-remainder-1').variables.some(v => v.name === 'c')
  && taskById('orthogonal-remainder-1').at.c === '2',
  `${Object.keys(taskById('projection-coefficient-1').at).join(',')} | `
  + `${Object.keys(taskById('orthogonal-remainder-1').at).join(',')}`)
const IPS_SUBGOALS = IPS_POINTS.flatMap(p => p.workedExample.subgoals)
t('all twelve of its subgoals ship the question written, not just the label',
  IPS_SUBGOALS.length === 12 && IPS_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${IPS_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${IPS_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  IPS_SUBGOALS.every(s => isInterrogative(s.socratic)),
  IPS_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  IPS_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  IPS_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * `rank-nullity`, the thirtieth promotion — and the first concept in this file
 * whose content is a MAP rather than a space.
 *
 * WHAT SELECTED IT, since none of the route selectors did. Every one of the ten
 * journeys has read zero unwritten since the fourteenth promotion, so route
 * demand ranks nothing; what is left is rulability, where the `needs` point,
 * and dependents. It has four — `diagonalisation`, `least-squares`, `homology`
 * and `multiple-regression`, in three different areas — which is the most of
 * any candidate that is rulable at all. `graphs-of-functions` has five and was
 * passed over again, its content being a judgement about a drawing that
 * `visualRef` must not pretend exists.
 *
 * THE RULABILITY IS THE INTERESTING HALF AND IT IS NOT THE OBVIOUS ONE. "What
 * is the rank of A" has a number for an answer, so this reads as the easy case
 * — and it is not, because `parseExpression` knows numbers, symbols and five
 * operators, so there is no way to hand a task a grid. The move is the one
 * ontology-matrices.ts made for the determinant and this file made for the
 * dimension: ask for the number that DECIDES the count. So the first point's
 * two tasks are a cross product and a triple product, the second point's are
 * one row's dot product against two candidates, and the third's are a
 * membership test and the subtraction the theorem is.
 *
 * WHY HERE RATHER THAN WITH THE MATRICES, which was the one real choice and is
 * argued in ontology-vectors.ts's header. The assertion below is the half of
 * that argument a test can hold: `matrices-and-determinants` declares in its
 * own `covers` that "entries are the unit of work throughout — the engine has
 * no matrix type, so every question asks for one number", and not one task here
 * asks for an entry. Filing it there would have shipped a matrix concept whose
 * material never asks for a matrix entry, which is the mirror image of why
 * `gaussian-elimination` went to the equations subject.
 *
 * Six claims are worth having here because each would fail silently:
 *
 *  - NO TASK IS ABOUT A MATRIX ENTRY, which is the filing argument reduced to
 *    something mechanical. If a later edit adds one, the concept belongs in the
 *    other subject after all and this is where that surfaces.
 *  - NOTHING TAKES A ROOT AND NOTHING ASKS FOR AN ANGLE, which are this
 *    subject's two standing boundaries. Neither cost anything here, and an
 *    absence that cost nothing is exactly the one a later edit breaks without
 *    noticing.
 *  - THE PARENT, BY NAME, AND THE ONE THAT IS NOT HERE. It rests on
 *    `basis-and-dimension` inside this ontology and on `gaussian-elimination`
 *    outside it — and the second edge is NOT in this subject's edge list,
 *    because an ontology may only name concepts it contains. The plausible
 *    mistake is writing it here anyway, which `ontologyProblems` reports as an
 *    unknown endpoint; the other plausible mistake is dropping it, which
 *    nothing reports. tests/atlas.mjs holds the `links` half.
 *  - THE CREDIT EDGE, asserted against the TASKS and not the prose, and its
 *    DEPTH. One edge, four concepts credited — the deepest chain in this file,
 *    and the reason no second edge was declared.
 *  - THE KERNEL PAIR IS ONE ROW AGAINST TWO CANDIDATES. The point's content is
 *    that the kernel is one particular line, which is evidenced by the SAME dot
 *    product returning 0 on one vector and 2 on another; two different rows
 *    would evidence the arithmetic and hide the claim.
 *  - THE IMAGE PAIR AND THE TRADE SHARE THEIR `given` AND THEIR NORMAL. A zero
 *    says a column is already inside the image and a one says a target is
 *    outside it, from the same expression at different inputs — which is what
 *    makes the third point's trade a consequence rather than a new formula.
 */
const RN = conceptById(VI, 'rank-nullity')
const RN_POINTS = RN.knowledgePoints

group('the thirtieth promotion: the rank and the kernel, written into the vectors subject')
t('it is a concept of this subject with material, not a tenth name in the list',
  !!RN && isTeachable(VI, 'rank-nullity') && isPractisable(VI, 'rank-nullity'),
  `${RN ? 'present' : 'ABSENT'}`)
t('three knowledge points numbered from 1, the shape every concept here but one has',
  RN_POINTS.length === 3 && RN_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${RN_POINTS.length} points at ${RN_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and none claims a timing target either',
  RN_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  RN_POINTS.filter(p => p.visualRef || p.automaticityTarget).map(p => p.id).join(' '))
const RN_KINDS = new Set(RN_POINTS.flatMap(p => tasksForPoint(p.id)).map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  RN.objectives.length > 0
  && RN.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => RN_KINDS.has(k)))
  && [...RN_KINDS].join(',') === 'evaluate'
  && RN_POINTS.every(p => tasksForPoint(p.id).length > 0),
  RN.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` against ${[...RN_KINDS].join('+')}`)
/*
 * The parent inside this ontology, and the one that is deliberately NOT here.
 * `prerequisitesOf(VI, …)` sees only this subject's own edges, so it returns
 * one id and that is correct rather than a missing half: the row-reduction edge
 * cannot live here, both of its ends being outside this subject, and it is a
 * `links` entry of `LINEAR_ALGEBRA`. Asserting the absence from THIS list is
 * what distinguishes "filed where it can live" from "forgotten", and the
 * composed-graph half — that the edge exists at all — is in tests/atlas.mjs.
 */
t('it rests on the dimension here, and on the row reduction from outside this subject',
  prerequisitesOf(VI, 'rank-nullity').join(' ') === 'basis-and-dimension'
  && !VI.edges.some(e => e.from === 'gaussian-elimination')
  && !VI.concepts.some(c => c.id === 'gaussian-elimination')
  && roots(VI).length === 1 && roots(VI)[0] === 'cartesian-plane'
  && teachingOrder(VI) !== null,
  `${prerequisitesOf(VI, 'rank-nullity').join(', ')} | roots ${roots(VI).join(', ')}`)
t('and the subject still has no internal faults, which is what an outside endpoint would break',
  ontologyProblems(VI).length === 0 && cycles(VI).length === 0,
  ontologyProblems(VI).join('; ') || 'clean')
/*
 * The credit edge, claimed on the GIVENS and not on the prose. Three of the six
 * tasks are `basis-and-dimension`'s own arithmetic written symbol for symbol,
 * which is the test the three refusals in ontology-vectors.ts were made with
 * rather than an exception to it.
 */
t('it claims credit back down to the dimension, and three of its tasks bear the claim out',
  edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'rank-nullity' && e.to === 'basis-and-dimension' && !!e.rationale)
  && taskById('image-two-columns-independent-1').given
    === taskById('plane-basis-cross-product-1').given
  && taskById('image-third-column-adds-nothing-1').given
    === taskById('third-vector-redundant-1').given
  && taskById('what-the-kernel-costs-the-image-1').given
    === taskById('third-vector-redundant-1').given,
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))
/*
 * The transitivity, by DEPTH, and this is the deepest chain in the file. One
 * declared edge, FOUR concepts credited — the dimension at 1, independence at
 * 2, span at 3 and the components at 4, each arriving through the previous
 * concept's own `encompasses` edge. A second edge straight to
 * `linear-independence` would have been defensible on the cross product and
 * would have added a duplicate route and nothing else; asserting the depth is
 * what records that the chain was checked rather than assumed.
 */
t('one edge credits four concepts, each arriving through the one below it',
  [...encompassedClosure(VI, 'rank-nullity')]
    .map(([id, depth]) => `${id}:${depth}`).sort().join(' ')
    === 'basis-and-dimension:1 linear-independence:2 plane-vectors:4 vectors-and-spans:3'
  && edgesOfKind(VI, 'encompasses')
    .filter(e => e.from === 'rank-nullity').length === 1,
  [...encompassedClosure(VI, 'rank-nullity')]
    .map(([id, depth]) => `${id}:${depth}`).join(' '))
/*
 * AND NO CREDIT TO `three-dimensional-coordinates`, THOUGH THE CROSS PRODUCT IS
 * ITS OWN TASK VERBATIM — which is the refusal that needed checking rather than
 * reasoning about, and the first draft of this group got the reason wrong.
 *
 * The wrong reason was reachability: that concept is not on this one's
 * prerequisite path, so an `encompasses` to it would credit material a learner
 * was never gated behind. It IS on the path — it gates `vectors-and-spans`,
 * which the thirteenth promotion inserted it above — and `allPrerequisitesOf`
 * says so, which is why that is asserted here in the direction that caught it.
 *
 * The real reason is the COUNT, and it follows the precedent exactly rather
 * than inventing one. `image-two-columns-independent-1` is
 * `cross-product-component-1`'s `given` symbol for symbol, and that is ONE task
 * of six — below the bar this file has used for every credit edge it has taken
 * (two of six for the inner product, two of six for the dimension, four of
 * eight for the three dimensions). `basis-and-dimension` had the identical case
 * one promotion earlier, its own `plane-basis-cross-product-1` being that same
 * expression, and declined the edge; so the assertion below checks that
 * precedent as well as this decision, because a refusal that agrees with the
 * file is worth more than one that merely sounds careful.
 */
t('and no credit to the space concept, on the count rather than on reachability',
  !edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'rank-nullity' && e.to === 'three-dimensional-coordinates')
  && !edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'basis-and-dimension' && e.to === 'three-dimensional-coordinates')
  && allPrerequisitesOf(VI, 'rank-nullity').includes('three-dimensional-coordinates')
  && taskById('image-two-columns-independent-1').given
    === taskById('cross-product-component-1').given
  && RN_POINTS.flatMap(p => tasksForPoint(p.id))
    .filter(x => x.given === taskById('cross-product-component-1').given).length === 1,
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))

group('the thirtieth promotion is gradable with no worker')
const RN_TASKS = RN_POINTS.flatMap(p => tasksForPoint(p.id))
t('six tasks, two on each of the three points', RN_TASKS.length === 6
  && RN_POINTS.every(p => tasksForPoint(p.id).length === 2),
  `${RN_TASKS.length}`)
t('all six are evaluate, so none of them claims a form',
  RN_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  RN_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  RN_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  RN_TASKS.map(x => x.id).join(', '))
const rnRulings = await Promise.all(RN_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  rnRulings.every(r => r.verdict.ruling === 'correct'),
  rnRulings.map((r, i) => `${RN_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * THE ASSERTION THE FILING RESTS ON, and the one to read first if this concept
 * is ever argued back into `matrices-and-determinants`.
 *
 * That subject's `covers` says entries are its unit of work, because the engine
 * has no matrix type and so every question there asks for one number of a grid.
 * Not one question here does: they are cross products, dot products and counts,
 * which is this subject's arithmetic. The regex looks for the entry notation
 * those tasks use — `a11`, `b12`, `(1,1)` — in both the prompt and the `given`,
 * since a task could drift into the other idiom by either.
 */
t('no task asks for a matrix entry, which is the other subject\'s unit of work and not this one\'s',
  RN_TASKS.every(x => !/\b[a-z]\d\d\b/.test(x.given))
  && RN_TASKS.every(x => !/\bentry \(\d, ?\d\)/i.test(x.prompt)),
  RN_TASKS.filter(x => /\b[a-z]\d\d\b/.test(x.given) || /\bentry \(/i.test(x.prompt))
    .map(x => x.id).join(' '))
/*
 * The two boundaries this subject has held since the dot product, re-asserted
 * against new tasks rather than assumed to have survived. Neither cost anything
 * here — a rank is a count and a kernel test is a dot product — and that is
 * precisely why they are worth checking: an absence that was free is the one a
 * later edit breaks without noticing it has.
 */
t('nothing takes a square root and no task asks for an angle',
  RN_TASKS.every(x => !/\^\(1\/2\)/.test(x.given) && !/sqrt/.test(x.given))
  && RN_TASKS.every(x => !/\b(what angle|which angle|find the angle|arccos|arcsin)\b/i
    .test(`${x.prompt} ${x.given}`))
  && RN_TASKS.every(x => !/°/.test(x.prompt)),
  RN_TASKS.filter(x => /\^\(1\/2\)|sqrt|°|arccos|arcsin/i.test(`${x.prompt} ${x.given}`))
    .map(x => x.id).join(' '))
/*
 * THE KERNEL PAIR IS ONE ROW AGAINST TWO CANDIDATES, which is the point's
 * content expressed as a constraint on the task set rather than as prose. "The
 * kernel is one particular line" is evidenced by the same dot product returning
 * 0 on (1, −2, 1) and 2 on (1, −1, 1); two different rows would evidence the
 * arithmetic and say nothing about the claim, and every suite would stay green.
 */
t('the kernel pair is ONE row against two candidates, which is the claim rather than the sum',
  (() => {
    const [a, b] = tasksForPoint('the-kernel-is-what-the-map-kills-and-the-nullity-counts-it')
    return a.given === b.given
      && ['a1', 'a2', 'a3'].every(k => a.at[k] === b.at[k])
      && JSON.stringify(a.at) !== JSON.stringify(b.at)
      && new Set([a.reference, b.reference]).size === 2
      && [a.reference, b.reference].includes('0')
  })(),
  tasksForPoint('the-kernel-is-what-the-map-kills-and-the-nullity-counts-it')
    .map(x => `${JSON.stringify(x.at)} = ${x.reference}`).join(' | '))
/*
 * AND THE TRADE IN THE THIRD POINT IS THE IMAGE TEST AT NEW INPUTS, with the
 * same normal. A zero said a column was already inside the image; a one says a
 * target is outside it. That is what makes "what is killed on the way in is
 * missed on the way out" a consequence of work already done rather than a new
 * formula to believe — and it is only visible as a constraint on the pair, since
 * either task alone is just a dot product.
 */
t('the trade reuses the image test and its normal, at a target rather than a column',
  taskById('what-the-kernel-costs-the-image-1').given
    === taskById('image-third-column-adds-nothing-1').given
  && ['n1', 'n2', 'n3'].every(k =>
    taskById('what-the-kernel-costs-the-image-1').at[k]
      === taskById('image-third-column-adds-nothing-1').at[k])
  && taskById('image-third-column-adds-nothing-1').reference === '0'
  && taskById('what-the-kernel-costs-the-image-1').reference === '1',
  `${taskById('image-third-column-adds-nothing-1').reference} vs `
  + `${taskById('what-the-kernel-costs-the-image-1').reference}`)
/*
 * The verdict spread, which the twentieth promotion's note argues for: a task
 * set whose every answer is 0 teaches the arithmetic and hides the decision. Two
 * of these six are 0 and they mean different things — "this column adds no
 * direction" in one, "this vector is killed" in the other — so the zero carries
 * information rather than being a free mark.
 */
t('no answer in the set is reachable by answering zero to everything',
  RN_TASKS.filter(x => x.reference === '0').length === 2
  && new Set(RN_TASKS.map(x => x.reference)).size === 5,
  RN_TASKS.map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * ONE MATRIX RUNS THROUGH FIVE OF THE SIX, and the sixth is the only one that
 * could not use it. The theorem's second direction needs a matrix too wide to
 * reduce by eye or the saving it buys is invisible, so `rank-from-the-nullity-1`
 * is about a different grid — and that task is also the only one declaring
 * integer counts rather than real components, which is the distinction worth
 * pinning: a rank and a nullity are counts and everything else here is a
 * coordinate.
 */
t('five of the six are about one matrix, and the sixth is the one that could not be',
  RN_TASKS.filter(x => /\[\[1, 2, 3\]|A = \[\[|of A\b|A has three columns/.test(x.prompt)
    || /Same row|first two columns of A/.test(x.prompt)).length === 5
  && taskById('rank-from-the-nullity-1').variables
    .every(v => v.assumptions?.integer === true)
  && RN_TASKS.filter(x => x.id !== 'rank-from-the-nullity-1')
    .every(x => x.variables.every(v => v.assumptions?.real === true)),
  RN_TASKS.map(x => `${x.id}:${x.variables[0].assumptions?.integer ? 'int' : 'real'}`).join(' '))
const RN_SUBGOALS = RN_POINTS.flatMap(p => p.workedExample.subgoals)
t('all twelve of its subgoals ship the question written, not just the label',
  RN_SUBGOALS.length === 12 && RN_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${RN_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${RN_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  RN_SUBGOALS.every(s => isInterrogative(s.socratic)),
  RN_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  RN_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  RN_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * `least-squares`, the forty-first promotion — and the first concept in this
 * file whose subject is a QUESTION WITH NO ANSWER.
 *
 * WHAT SELECTED IT, recomputed from the tree rather than taken from the brief,
 * which ships a 2026-11-15 snapshot wrong in every figure. Fourteen map nodes
 * were ready, none floor-blocked, seven under refusals that still bind — so
 * seven unrefused, and of those only this one and `dual-spaces` have every
 * `needs` inside ONE authored subject. The third factor then separates those
 * two by two dependents to zero. The full field is in ontology-vectors.ts's
 * header, which is where the next run should read it.
 *
 * THE BOUNDARY THAT HAD TO BE RE-READ, and it is the interesting half. This
 * subject's `covers` says "Not the NORM … the first is a square root of a
 * product that is here", and a concept about making a MISS small looks like it
 * has to measure that miss. It does not: what is minimised is ⟨r, r⟩, the SUM
 * of the squared misses, and its square root has the same minimiser because the
 * root is increasing. So the boundary is spent rather than bent, and the
 * assertion below is the mechanical form of that — no `given` takes a root.
 *
 * Seven claims are worth having here because each would fail silently:
 *
 *  - BOTH PARENTS ARE IN THIS ONTOLOGY, which is the whole of why this node was
 *    the pick. The plausible failure is an edge declared for one and dropped
 *    for the other, and nothing reports a dropped edge.
 *  - THE CREDIT EDGE IS TAKEN DOWN TO THE INNER PRODUCT AND DECLINED TO THE
 *    RANK, and both halves are asserted against the TASKS. Five of ten are the
 *    inner product's arithmetic at more components; exactly one touches the
 *    rank, and in that one the rank is handed over in the prompt.
 *  - THE ARITY CHANGE IS WHY THE CREDIT BAR IS RESTATED. Not one of the five is
 *    a prerequisite task's `given` symbol for symbol, which is this file's usual
 *    phrasing — all ten tasks work in three or four components. The precedent
 *    is `three-dimensional-coordinates=>dot-product-geometry`, taken on
 *    three-term dot products against a two-term concept, so the extension has
 *    counted here before and the assertion checks the SHAPE rather than the
 *    string.
 *  - TWO TASK PAIRS SHARE A `given` AND DISAGREE ON THE ANSWER. The normal
 *    equation returns 0 at the best coefficient and −3 at a competitor; the sum
 *    of squared misses is 14 there and 17 here, and 17 − 14 is ⟨a, a⟩ exactly.
 *    Either task of either pair alone is arithmetic; the pair is the claim.
 *  - THE SAME NUMBER ARRIVES BY TWO ROUTES, which is the debt to
 *    `descriptive-statistics` made checkable: the projection coefficient and a
 *    plain average are different `given`s with the same reference.
 *  - NOTHING TAKES A ROOT AND NOTHING ASKS FOR AN ANGLE, this subject's two
 *    standing boundaries, re-asserted against new tasks rather than assumed to
 *    have survived a concept that had a reason to break the first one.
 *  - NO TASK IS ABOUT A MATRIX ENTRY, the filing argument the thirtieth
 *    promotion reduced to something mechanical. The same check runs here
 *    because the same other subject could have claimed this concept.
 */
const LS = conceptById(VI, 'least-squares')
const LS_POINTS = LS.knowledgePoints
const LS_TASKS = LS_POINTS.flatMap(p => tasksForPoint(p.id))
/*
 * Every `given` of both prerequisites, collected so that the verbatim claim can
 * be asserted as a NEGATIVE. Built from the knowledge points rather than listed
 * by task id: a list would go stale the day either concept gains a task, and the
 * assertion it backs is "none of these appears here", which a stale list weakens
 * silently.
 */
const IPS_TASK_GIVENS = new Set(
  [...conceptById(VI, 'inner-product-spaces').knowledgePoints,
    ...conceptById(VI, 'rank-nullity').knowledgePoints]
    .flatMap(p => tasksForPoint(p.id)).map(x => x.given),
)

group('the forty-first promotion: least squares, written into the vectors subject')
t('it is a concept of this subject with material, not an eleventh name in the list',
  !!LS && isTeachable(VI, 'least-squares') && isPractisable(VI, 'least-squares'),
  `${LS ? 'present' : 'ABSENT'}`)
t('three knowledge points numbered from 1, the shape every concept here but one has',
  LS_POINTS.length === 3 && LS_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${LS_POINTS.length} points at ${LS_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and none claims a timing target either',
  LS_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  LS_POINTS.filter(p => p.visualRef || p.automaticityTarget).map(p => p.id).join(' '))
const LS_KINDS = new Set(LS_TASKS.map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  LS.objectives.length > 0
  && LS.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => LS_KINDS.has(k)))
  && [...LS_KINDS].join(',') === 'evaluate'
  && LS_POINTS.every(p => tasksForPoint(p.id).length > 0),
  LS.objectives.map(o => `${o.id}:${o.taskKinds.join('+')}`).join(' ')
  + ` against ${[...LS_KINDS].join('+')}`)
/*
 * BOTH PARENTS ARE CONCEPTS OF THIS ONTOLOGY, which is the first promotion into
 * this subject since the twenty-third where that is true of every `needs` — the
 * thirtieth had one in and one out. So `prerequisitesOf` here returns BOTH, the
 * area owes no `links` entry, and the plausible failure is declaring one edge
 * and forgetting the other: `ontologyProblems` cannot see a missing edge, only
 * an unknown endpoint. Compared as a sorted SET and never as an ordered string,
 * since `prerequisitesOf` returns edge order.
 */
t('it rests on the inner product AND the rank, both of them concepts of this subject',
  prerequisitesOf(VI, 'least-squares').slice().sort().join(' ')
    === 'inner-product-spaces rank-nullity'
  && ['inner-product-spaces', 'rank-nullity'].every(id => VI.concepts.some(c => c.id === id))
  && roots(VI).length === 1 && roots(VI)[0] === 'cartesian-plane'
  && teachingOrder(VI) !== null,
  `${prerequisitesOf(VI, 'least-squares').join(', ')} | roots ${roots(VI).join(', ')}`)
t('and the subject still has no internal faults, which is what an outside endpoint would break',
  ontologyProblems(VI).length === 0 && cycles(VI).length === 0,
  ontologyProblems(VI).join('; ') || 'clean')
/*
 * The credit edge, claimed on the GIVENS rather than on the prose — and the bar
 * stated at the shape rather than the string, which is the part this group adds
 * to the file.
 *
 * Five of the ten tasks are `inner-product-spaces` arithmetic at more
 * components: two are a quotient of two inner products (the projection
 * coefficient extended to three and four terms), two take the residual's inner
 * product with the column it was taken along, and one is the orthogonality test
 * on a pair of columns. Asserted as "a quotient of a sum of products by a sum of
 * self-products" and "a column dotted against a computed residual", because the
 * verbatim-`given` form the earlier promotions used cannot reach across an arity
 * change and would report zero here.
 */
t('it claims credit down to the inner product, and five of its tasks bear the claim out',
  edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'least-squares' && e.to === 'inner-product-spaces' && !!e.rationale)
  && ['least-squares-coefficient-1', 'the-slope-from-its-own-column-1']
    .every(id => /^\([a-z]\d\*[a-z]\d( \+ [a-z]\d\*[a-z]\d)+\) \/ \([a-z]\d\*[a-z]\d( \+ [a-z]\d\*[a-z]\d)+\)$/
      .test(taskById(id).given))
  && ['normal-equation-holds-1', 'normal-equation-rejects-and-points-1']
    .every(id => /^a1\*\(b1 - x\*a1\)/.test(taskById(id).given))
  && /^u1\*t1 \+/.test(taskById('the-two-columns-do-not-interact-1').given),
  edgesOfKind(VI, 'encompasses').map(e => `${e.from}=>${e.to}`).join(' '))
/*
 * AND NOT ONE OF THE FIVE IS A PREREQUISITE TASK'S `given` SYMBOL FOR SYMBOL,
 * which is the claim that stops the edge above from looking like the earlier
 * ones. Every task here works in three or four components and every task of
 * both prerequisites works in two or three, so the usual mechanical test
 * returns nothing and the edge rests on the extension instead. The precedent is
 * asserted beside it rather than cited, because an argument from precedent that
 * does not check the precedent is an argument from memory.
 */
t('the edge rests on an arity extension, as the three-dimensions edge already did',
  LS_TASKS.every(x => !IPS_TASK_GIVENS.has(x.given))
  && edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'three-dimensional-coordinates' && e.to === 'dot-product-geometry')
  && taskById('cross-product-component-1')
  && LS_TASKS.every(x => /[a-z](1|2|3|4)/.test(x.given) || x.id === 'how-many-ways-to-name-the-same-fit-1'),
  LS_TASKS.filter(x => IPS_TASK_GIVENS.has(x.given)).map(x => x.id).join(' ')
    || 'none verbatim, as the rationale says')
/*
 * THE DECLINED EDGE, AND THE COUNT IT FAILED ON. Exactly one task touches the
 * rank — `how-many-ways-to-name-the-same-fit-1`, which is `n - p` — and the
 * rank is handed to the learner IN THE PROMPT, so nothing in it produces a
 * count. One of ten is below every bar this file has taken an edge at, and the
 * fortieth promotion's sharper standard rules it out outright: a learner who has
 * never met a rank can answer 3 − 2.
 *
 * The prerequisite edge is asserted in the same breath, because the pair is the
 * point: the count is needed to UNDERSTAND the answer and is not exercised by
 * producing it, and those are the two different edges.
 */
t('and no credit to the rank, on the count — one task of ten, with the rank given in the prompt',
  !edgesOfKind(VI, 'encompasses').some(e =>
    e.from === 'least-squares' && e.to === 'rank-nullity')
  && edgesOfKind(VI, 'prerequisite').some(e =>
    e.from === 'rank-nullity' && e.to === 'least-squares' && !!e.rationale)
  && LS_TASKS.filter(x => /\brank\b/.test(x.prompt)).length === 1
  && /p = 2/.test(taskById('how-many-ways-to-name-the-same-fit-1').prompt),
  LS_TASKS.filter(x => /\brank\b/.test(x.prompt)).map(x => x.id).join(' '))
/*
 * The transitivity, by DEPTH. One declared edge, THREE concepts credited — the
 * inner product at 1, the dot product at 2 and the components at 3, each
 * arriving through the previous concept's own `encompasses` edge. A second edge
 * straight to `dot-product-geometry` would have been defensible on the four-term
 * products and would have added a duplicate route and nothing else; asserting
 * the depth records that the chain was checked rather than assumed.
 */
t('one edge credits three concepts, each arriving through the one below it',
  [...encompassedClosure(VI, 'least-squares')]
    .map(([id, depth]) => `${id}:${depth}`).sort().join(' ')
    === 'dot-product-geometry:2 inner-product-spaces:1 plane-vectors:3'
  && edgesOfKind(VI, 'encompasses')
    .filter(e => e.from === 'least-squares').length === 1,
  [...encompassedClosure(VI, 'least-squares')]
    .map(([id, depth]) => `${id}:${depth}`).join(' '))

group('the forty-first promotion is gradable with no worker')
t('ten tasks — three on each of the first two points and four on the third',
  LS_TASKS.length === 10
  && LS_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,3,4',
  `${LS_TASKS.length} as ${LS_POINTS.map(p => tasksForPoint(p.id).length).join(',')}`)
t('all ten are evaluate, so none of them claims a form',
  LS_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  LS_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  LS_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  LS_TASKS.map(x => x.id).join(', '))
const lsRulings = await Promise.all(LS_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  lsRulings.every(r => r.verdict.ruling === 'correct'),
  lsRulings.map((r, i) => `${LS_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * THE BOUNDARY THIS CONCEPT HAD A REASON TO BREAK, AND DID NOT. Every other
 * promotion into this subject recorded "nothing takes a root" as an absence that
 * cost nothing; here it cost something to keep and the cost was zero, which is
 * the distinction worth asserting rather than restating. A concept about
 * minimising a MISS invites a distance, and a distance is √⟨r, r⟩ — so the check
 * is that the squared form is what every task uses, not merely that no `sqrt`
 * appears.
 */
t('nothing takes a square root and no task asks for an angle',
  LS_TASKS.every(x => !/\^\(1\/2\)/.test(x.given) && !/sqrt/.test(x.given))
  && LS_TASKS.every(x => !/\b(what angle|which angle|find the angle|arccos|arcsin)\b/i
    .test(`${x.prompt} ${x.given}`))
  && LS_TASKS.every(x => !/°/.test(x.prompt)),
  LS_TASKS.filter(x => /\^\(1\/2\)|sqrt|°|arccos|arcsin/i.test(`${x.prompt} ${x.given}`))
    .map(x => x.id).join(' '))
t('and the two tasks that sum a miss really square it, which is what the name promises',
  ['least-squares-miss-at-the-best-1', 'the-penalty-for-missing-it-1', 'the-least-miss-of-any-line-1']
    .every(id => (taskById(id).given.match(/\^2/g) ?? []).length >= 3),
  ['least-squares-miss-at-the-best-1', 'the-penalty-for-missing-it-1', 'the-least-miss-of-any-line-1']
    .map(id => `${id}:${(taskById(id).given.match(/\^2/g) ?? []).length}`).join(' '))
/*
 * THE SAME ASSERTION THE FILING RESTS ON, run again because the same other
 * subject could have claimed this concept. `matrices-and-determinants` says in
 * its own `covers` that entries are its unit of work; not one question here asks
 * for one. They are inner products, quotients of inner products and a count.
 */
t('no task asks for a matrix entry, which is the other subject\'s unit of work and not this one\'s',
  LS_TASKS.every(x => !/\b[a-z]\d\d\b/.test(x.given))
  && LS_TASKS.every(x => !/\bentry \(\d, ?\d\)/i.test(x.prompt)),
  LS_TASKS.filter(x => /\b[a-z]\d\d\b/.test(x.given) || /\bentry \(/i.test(x.prompt))
    .map(x => x.id).join(' '))
/*
 * THE TWO PAIRS THAT SHARE A `given` AND DISAGREE ON THE ANSWER, which is this
 * concept's content expressed as a constraint on the task set rather than as
 * prose. "Least" is a comparison, and a set of tasks that only ever showed the
 * best coefficient would teach that the normal equation returns zero and that 14
 * is what a residual sum looks like. Each pair is one expression at one changed
 * input — the competitor x = 5 — and the second pair's two answers differ by
 * exactly ⟨a, a⟩ = 3, which is the split predicting the competitor's miss rather
 * than the competitor being measured.
 */
t('the normal equation accepts and rejects from one expression at one changed input', (() => {
  const a = taskById('normal-equation-holds-1')
  const b = taskById('normal-equation-rejects-and-points-1')
  return a.given === b.given
    && ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'].every(k => a.at[k] === b.at[k])
    && a.at.x !== b.at.x
    && a.reference === '0' && b.reference === '-3'
})(), `${taskById('normal-equation-holds-1').reference} vs `
  + `${taskById('normal-equation-rejects-and-points-1').reference}`)
t('and the two sums of squared misses differ by exactly the column\'s self-product', (() => {
  const best = taskById('least-squares-miss-at-the-best-1')
  const worse = taskById('the-penalty-for-missing-it-1')
  return best.given === worse.given
    && best.at.x === '4' && worse.at.x === '5'
    && Number(worse.reference) - Number(best.reference) === 3
})(), `${taskById('the-penalty-for-missing-it-1').reference} − `
  + `${taskById('least-squares-miss-at-the-best-1').reference}`)
/*
 * AND ONE NUMBER ARRIVES BY TWO ROUTES, which is the debt to
 * `descriptive-statistics` made checkable. The projection coefficient and a
 * plain average are different `given`s with the same reference, and the claim is
 * that the first DEGENERATES into the second when the column is all ones — so
 * the averaging task writes its denominator as a literal 3 rather than as
 * `a1 + a2 + a3`, which would be the first task again with the arithmetic
 * rearranged.
 */
t('the coefficient and the mean are two givens with one answer, and the mean names no vector',
  taskById('least-squares-coefficient-1').given
    !== taskById('the-constant-fit-is-the-mean-1').given
  && taskById('least-squares-coefficient-1').reference
    === taskById('the-constant-fit-is-the-mean-1').reference
  && !/a\d/.test(taskById('the-constant-fit-is-the-mean-1').given)
  && taskById('the-constant-fit-is-the-mean-1').at.a1 === '1'
  && taskById('the-constant-fit-is-the-mean-1').at.a3 === '1',
  `${taskById('the-constant-fit-is-the-mean-1').given} = `
  + `${taskById('the-constant-fit-is-the-mean-1').reference}`)
/*
 * The verdict spread, which the twentieth promotion's note argues for: a task
 * set whose every answer is 0 teaches the arithmetic and hides the decision.
 * Two of these ten are 0 and they mean different things — "this coefficient is
 * the best one" in the first and "these two columns do not interact" in the
 * second — and one answer is NEGATIVE, which no other task set in this subject
 * has.
 */
t('no answer in the set is reachable by answering zero to everything',
  LS_TASKS.filter(x => x.reference === '0').length === 2
  && LS_TASKS.some(x => Number(x.reference) < 0)
  && new Set(LS_TASKS.map(x => x.reference)).size === 6,
  LS_TASKS.map(x => `${x.id}:${x.reference}`).join(' '))
/*
 * THE CENTRING IS ON THE PAGE AND NOT ONLY IN THE COMMENTS. The two-column half
 * of this concept works because ⟨u, t⟩ = 0, which the times being measured from
 * the MIDDLE of the run arranges — and the general case, where it is not zero,
 * is a 2×2 system belonging to another subject. That is a real shortfall rather
 * than a boundary, so the learner has to be told: the assertion is that the
 * prompt says where the times are measured from and that the worked example
 * names what the uncentred case would cost.
 */
t('the fit tasks tell the learner why the columns are perpendicular, rather than only using it',
  /middle of the run/.test(taskById('the-two-columns-do-not-interact-1').prompt)
  && /2×2 system/.test(taskById('the-two-columns-do-not-interact-1').prompt)
  && LS_POINTS[2].workedExample.subgoals
    .some(s => /systems-of-linear-equations/.test(s.detail)),
  taskById('the-two-columns-do-not-interact-1').prompt)
const LS_SUBGOALS = LS_POINTS.flatMap(p => p.workedExample.subgoals)
t('all thirteen of its subgoals ship the question written, not just the label',
  LS_SUBGOALS.length === 13 && LS_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${LS_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${LS_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  LS_SUBGOALS.every(s => isInterrogative(s.socratic)),
  LS_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  LS_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  LS_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))

// ---------------------------------------------------------------------------

/**
 * `dual-spaces`, the forty-second promotion — and the first concept in this
 * file that is about the RULE rather than about what the rule is applied to.
 *
 * WHAT SELECTED IT, recomputed from the tree rather than taken from the brief,
 * which ships a 2026-11-15 snapshot whose candidate list is six-eighths
 * authored. Thirteen map nodes were ready, none floor-blocked, seven under
 * refusals that still bind — so six unrefused, and of those only this one has
 * every `needs` inside ONE authored subject. The full field is in
 * ontology-vectors.ts's header, which is where the next run should read it.
 *
 * THE FIRST PROMOTION WHOSE SECOND AND THIRD FACTORS DISAGREED, which is the
 * one thing about the pick worth arguing. This node costs zero `links` entries
 * and has ZERO dependents; `eigenvalues` costs two across three subjects and
 * has four, the most of anything unrefused. The documented order puts the
 * single-ontology factor above the dependent count and calls the latter a
 * tie-break, so the rule decided it — on the ground that a dropped `links`
 * entry fails SILENTLY (it gates nothing until the far node is written) while a
 * low dependent count is visible in the map the day it is taken. Nothing below
 * asserts that judgement, because a test cannot; what is asserted is the
 * consequence, which is that the zero is real and `eigenvalues` is still there.
 *
 * Six claims are worth having here because each would fail silently:
 *
 *  - IT HANGS OFF `basis-and-dimension` AND NOT OFF THE CONCEPT ABOVE IT. It is
 *    written last in the array and rests on neither `least-squares` nor
 *    `rank-nullity`. Asserted as the branch POINT, never as an ordered walk,
 *    which is the correction the twenty-third promotion made for the dot
 *    product: a string comparison written after the fact would accept this edge
 *    hung off the least squares.
 *  - THE CREDIT EDGE IS TAKEN ON A VERBATIM `given` AT LAST, which the
 *    forty-first could not do — all ten of its tasks worked at more components
 *    than its prerequisites'. Four of the eleven here are a `basis-and-dimension`
 *    task's expression symbol for symbol, and the assertion checks the STRINGS
 *    rather than a shape.
 *  - BUT ONLY ONE OF THE FOUR IS EXCLUSIVE, and the assertion says so rather
 *    than counting to four and stopping. The coordinate quotient belongs to
 *    that concept alone; the triple product is shared with two cross-product
 *    tasks, so three of the four evidence a dot product rather than a dimension
 *    count. An honest credit claim has to be able to state its own weakest
 *    part.
 *  - ONE ANSWER ARRIVES BY TWO ROUTES AND THE ROUTES ARE DIFFERENT
 *    EXPRESSIONS. f(w) = 8 comes from the address and the two values, and again
 *    from the dual-basis expansion over the denominator 7. That pair IS the
 *    second point's claim — the expansion is the functional and not a second
 *    description of it — and either task alone is arithmetic.
 *  - THREE TASKS SHARE A `given` AND ITS ANSWER MEANS THREE DIFFERENT THINGS.
 *    The row returns 0 inside the kernel, 3 outside it, and 0 again after the
 *    row is doubled. A set that only ever showed the zero would teach that the
 *    expression returns zero.
 *  - THE TWO BOUNDARIES THIS SUBJECT HAS HELD SINCE THE DOT PRODUCT SURVIVE,
 *    and for the first time in six promotions neither cost anything to keep: a
 *    functional returns a number and a dimension is a count, so there was no
 *    length to be tempted by.
 */
const DU = conceptById(VI, 'dual-spaces')
const DU_POINTS = DU.knowledgePoints
const DU_TASKS = DU_POINTS.flatMap(p => tasksForPoint(p.id))
/*
 * Every `given` of the sole prerequisite, collected so the verbatim claim is
 * built from the tree rather than from a list of task ids — a list goes stale
 * the day that concept gains a task, and here the claim is a POSITIVE ("four of
 * these appear here"), which a stale list would overstate rather than weaken.
 */
const BD_TASK_GIVENS = new Set(
  conceptById(VI, 'basis-and-dimension').knowledgePoints
    .flatMap(p => tasksForPoint(p.id)).map(x => x.given),
)

group('the forty-second promotion: the dual, written into the vectors subject')
t('it is a concept of this subject with material, not a twelfth name in the list',
  !!DU && isTeachable(VI, 'dual-spaces') && isPractisable(VI, 'dual-spaces'),
  `${DU ? 'present' : 'ABSENT'}`)
t('three knowledge points numbered from 1, the shape every concept here but one has',
  DU_POINTS.length === 3 && DU_POINTS.map(p => p.position).join(',') === '1,2,3',
  `${DU_POINTS.length} points at ${DU_POINTS.map(p => p.position).join(',')}`)
t('no point claims a figure, and none claims a timing target either',
  DU_POINTS.every(p => p.visualRef === undefined && p.automaticityTarget === undefined),
  DU_POINTS.filter(p => p.visualRef || p.automaticityTarget).map(p => p.id).join(' '))
const DU_KINDS = new Set(DU_TASKS.map(x => x.kind))
t('its objectives name only evaluate, and evaluate really ships a task on every point',
  DU.objectives.length > 0
  && DU.objectives.every(o => o.taskKinds.length > 0
    && o.taskKinds.every(k => DU_KINDS.has(k)))
  && DU.objectives.every(o => o.taskKinds.join(',') === 'evaluate')
  && DU_POINTS.every(p => tasksForPoint(p.id).length > 0),
  DU.objectives.map(o => `${o.id}:${o.taskKinds.join('/')}`).join(' '))

/*
 * THE BRANCH POINT, BY NAME. The sole prerequisite is `basis-and-dimension`,
 * which is FOUR concepts back in the array, and the three negatives are the
 * assertion: a reader checking only the positive would not notice an extra edge
 * from the concept above, which is the mistake the array order invites.
 */
t('its one prerequisite is the dimension and not either concept above it',
  VI.edges.filter(e => e.kind === 'prerequisite' && e.to === 'dual-spaces')
    .map(e => e.from).join(' ') === 'basis-and-dimension'
  && !VI.edges.some(e => e.kind === 'prerequisite'
    && e.to === 'dual-spaces' && e.from === 'least-squares')
  && !VI.edges.some(e => e.kind === 'prerequisite'
    && e.to === 'dual-spaces' && e.from === 'rank-nullity')
  && !VI.edges.some(e => e.kind === 'prerequisite'
    && e.to === 'dual-spaces' && e.from === 'inner-product-spaces'),
  VI.edges.filter(e => e.to === 'dual-spaces')
    .map(e => `${e.from}~${e.kind}`).join(' '))
/*
 * AND THE BRANCH IS A SECOND ONE OFF THAT CONCEPT, which is worth separating
 * from the claim above: `basis-and-dimension` now gates two concepts of this
 * subject where it gated one. Asserted as the membership of its dependent set,
 * so a third arrival has to come back and say so rather than passing a `>= 2`.
 */
t('the dimension now gates two concepts here, where it gated one',
  VI.edges.filter(e => e.kind === 'prerequisite' && e.from === 'basis-and-dimension')
    .map(e => e.to).sort().join(' ') === 'dual-spaces rank-nullity',
  VI.edges.filter(e => e.kind === 'prerequisite' && e.from === 'basis-and-dimension')
    .map(e => e.to).join(' '))

/*
 * THE CREDIT EDGE, AND THE FIRST ONE IN THIS FILE TAKEN ON A LITERAL STRING
 * MATCH. The forty-first promotion had to argue an ARITY EXTENSION because not
 * one of its ten tasks was a prerequisite task's `given` symbol for symbol;
 * four of these eleven are, so the usual phrasing finally applies and the check is
 * a set membership rather than a reading of a shape.
 */
const DU_VERBATIM = DU_TASKS.filter(x => BD_TASK_GIVENS.has(x.given))
t('four of the eleven tasks are the dimension\'s own given, symbol for symbol',
  DU_VERBATIM.length === 4
  && DU_VERBATIM.map(x => x.id).sort().join(' ')
    === 'and-the-row-is-not-zero-outside-it-1 doubling-the-row-keeps-the-kernel-1 '
      + 'the-address-a-functional-is-spent-on-1 the-row-returns-zero-on-its-kernel-1',
  DU_VERBATIM.map(x => `${x.id}@${x.given}`).join(' | '))
t('and the credit edge down is declared, with no second one needed',
  VI.edges.filter(e => e.kind === 'encompasses' && e.from === 'dual-spaces')
    .map(e => e.to).join(' ') === 'basis-and-dimension'
  && !!VI.edges.find(e => e.kind === 'encompasses' && e.from === 'dual-spaces')?.rationale,
  VI.edges.filter(e => e.from === 'dual-spaces')
    .map(e => `${e.kind}->${e.to}`).join(' '))
/*
 * ONLY ONE OF THE FOUR IS EXCLUSIVE TO THE PREREQUISITE, and the assertion
 * states the weakness rather than hiding behind the count. `basis-coordinate-1`
 * owns its quotient: nothing else in the build computes a coordinate by
 * dividing a crosswise difference by a cross-check. The triple product is that
 * concept's too and also `plane-constant-1`'s and
 * `cross-product-perpendicular-1`'s, so three of the four are evidence that a
 * learner dotted two vectors rather than that they counted directions.
 *
 * Computed over the whole task list, not asserted from a list of names, so a
 * fourth task elsewhere adopting the quotient would turn this red and the claim
 * would have to be rewritten rather than quietly weakened.
 */
const QUOTIENT = taskById('basis-coordinate-1').given
const TRIPLE = taskById('third-vector-redundant-1').given
t('one of the four expressions belongs to that concept alone and three are shared',
  TASKS.filter(x => x.given === QUOTIENT).length === 2
  && TASKS.filter(x => x.given === TRIPLE).length > 4
  && DU_TASKS.filter(x => x.given === QUOTIENT).length === 1
  && DU_TASKS.filter(x => x.given === TRIPLE).length === 3,
  `${TASKS.filter(x => x.given === QUOTIENT).map(x => x.id).join(' ')} share the quotient; `
  + `${TASKS.filter(x => x.given === TRIPLE).length} tasks share the triple product`)

/*
 * ONE ANSWER BY TWO ROUTES, which is the second point's whole claim and is only
 * a claim as a pair. Asserted with the `given`s required to DIFFER, because two
 * tasks reaching 8 from one expression would be the same task twice.
 */
t('f(w) comes out 8 from the address and again from the dual-basis expansion',
  taskById('functional-from-its-values-on-a-basis-1').reference === '8'
  && taskById('the-dual-expansion-collapses-to-a-row-1').reference === '8'
  && taskById('functional-from-its-values-on-a-basis-1').given
    !== taskById('the-dual-expansion-collapses-to-a-row-1').given,
  `${taskById('functional-from-its-values-on-a-basis-1').given} vs `
  + `${taskById('the-dual-expansion-collapses-to-a-row-1').given}`)
/*
 * AND THE EXPANSION REALLY COLLAPSES, which is the half of that subgoal a
 * reference value cannot show. 3f₁ − 2f₂ written over the common denominator 7
 * is x − y identically, so the task's `given` and the plain difference agree at
 * inputs the task never uses — checked at u and at v, where they must return
 * the two values f was defined by.
 */
t('and the expansion is x − y identically, which is what makes the sevenths cancel',
  [['2', '-1', '3'], ['1', '3', '-2'], ['8', '3', '5']].every(([x, y, want]) => {
    const g = parseExpression(taskById('the-dual-expansion-collapses-to-a-row-1').given, ['x', 'y'])
    const at = { x: parseExpression(x, []), y: parseExpression(y, []) }
    return showExact(exactValue(substitute(g, at))) === want
  }),
  [['2', '-1'], ['1', '3'], ['8', '3']].map(([x, y]) => {
    const g = parseExpression(taskById('the-dual-expansion-collapses-to-a-row-1').given, ['x', 'y'])
    return `${x},${y}->${showExact(exactValue(substitute(g,
      { x: parseExpression(x, []), y: parseExpression(y, []) })))}`
  }).join(' '))

/*
 * ONE `given` AND THREE MEANINGS FOR ITS ANSWER, which is the third point's
 * content as a constraint on the task set. The row returns 0 on a kernel vector,
 * 3 off it, and 0 again once the row is doubled — so the zero is a decision
 * twice and the shared expression is what makes the three one fact rather than
 * three sums. Asserted as the triple, since any two of them are half the claim.
 */
t('the row\'s one expression returns 0, 3 and 0 again, and the second zero is the point',
  ['the-row-returns-zero-on-its-kernel-1', 'and-the-row-is-not-zero-outside-it-1',
    'doubling-the-row-keeps-the-kernel-1'].every(id => taskById(id).given === TRIPLE)
  && ['the-row-returns-zero-on-its-kernel-1', 'and-the-row-is-not-zero-outside-it-1',
    'doubling-the-row-keeps-the-kernel-1'].map(id => taskById(id).reference).join(',')
    === '0,3,0'
  && taskById('doubling-the-row-keeps-the-kernel-1').at.n1 === '4'
  && taskById('the-row-returns-zero-on-its-kernel-1').at.n1 === '2',
  ['the-row-returns-zero-on-its-kernel-1', 'and-the-row-is-not-zero-outside-it-1',
    'doubling-the-row-keeps-the-kernel-1']
    .map(id => `${id}:${taskById(id).reference}`).join(' '))
/*
 * AND THE DUAL BASIS DEFINITION IS ASSERTED AS ITS OWN PAIR. f₁ returns 1 on u
 * and 0 on v, which is not two facts about one rule but the definition of it —
 * so a task set carrying only the 1 would have taught a fraction that cancels.
 */
t('the first dual basis functional returns 1 on its own vector and 0 on the other',
  taskById('the-dual-basis-functional-on-its-own-vector-1').reference === '1'
  && taskById('and-zero-on-the-other-basis-vector-1').reference === '0'
  && taskById('the-dual-basis-functional-on-its-own-vector-1').given
    === taskById('and-zero-on-the-other-basis-vector-1').given
  && taskById('the-dual-basis-reads-the-address-1').reference === '2',
  ['the-dual-basis-functional-on-its-own-vector-1', 'and-zero-on-the-other-basis-vector-1',
    'the-dual-basis-reads-the-address-1'].map(id => taskById(id).reference).join(','))

/*
 * THE FIGURES ARE THE PREREQUISITE'S OWN, which is this promotion's choice and
 * the reverse of the usual one: most promotions here re-use a pair of vectors
 * and change the question, and this one changes what KIND of object is being
 * asked about, so keeping every number identical is what leaves the change of
 * object as the only new thing on the page. Asserted against that concept's own
 * worked examples rather than against literals, so a later edit to either side
 * breaks the claim instead of silently decoupling the two.
 */
t('every vector in the material is one the dimension concept already walked',
  DU_POINTS[0].workedExample.problem.includes('(2, −1)')
  && DU_POINTS[0].workedExample.problem.includes('(1, 3)')
  && DU_POINTS[0].workedExample.problem.includes('(3, −5)')
  && conceptById(VI, 'basis-and-dimension').knowledgePoints[0].workedExample.problem
    .includes('(3, −5)')
  && DU_POINTS[2].workedExample.problem.includes('2x − y + 2z')
  && conceptById(VI, 'basis-and-dimension').knowledgePoints[2].workedExample.problem
    .includes('2x − y + 2z'),
  DU_POINTS.map(p => p.workedExample.problem.slice(0, 40)).join(' | '))

group('the forty-second promotion is gradable with no worker')
t('eleven tasks — three on the first point and four on each of the other two',
  DU_TASKS.length === 11
  && DU_POINTS.map(p => tasksForPoint(p.id).length).join(',') === '3,4,4',
  `${DU_TASKS.length} as ${DU_POINTS.map(p => tasksForPoint(p.id).length).join(',')}`)
t('all ten are evaluate, so none of them claims a form',
  DU_TASKS.every(x => x.kind === 'evaluate' && x.form === undefined),
  DU_TASKS.map(x => `${x.id}:${x.kind}`).join(', '))
t('every reference is exactly reproducible from the given — no worker consulted',
  DU_TASKS.every(x => {
    const at = {}
    for (const [name, raw] of Object.entries(x.at)) at[name] = parseExpression(raw, [])
    const truth = exactValue(substitute(parseExpression(x.given, x.variables.map(v => v.name)), at))
    const claimed = exactValue(parseExpression(x.reference, x.variables.map(v => v.name)))
    return truth !== null && claimed !== null && showExact(truth) === showExact(claimed)
  }),
  DU_TASKS.map(x => x.id).join(', '))
const duRulings = await Promise.all(DU_TASKS.map(x => ruleEvaluate(x, x.reference, NO_WORKER)))
t('a correct answer is ruled correct with no worker configured',
  duRulings.every(r => r.verdict.ruling === 'correct'),
  duRulings.map((r, i) => `${DU_TASKS[i].id}:${r.verdict?.ruling ?? r.status}`).join(', '))
/*
 * EVERY ANSWER IS A WHOLE NUMBER DESPITE FOUR OF THE TASKS DIVIDING BY 7, which
 * is not luck and is the one arithmetic choice this concept had to make. A
 * coordinate in this basis is a seventh unless the numerator is a multiple of
 * the cross-check — `basis-coordinate-1`'s own note records the trap — so the
 * second plane vector was chosen by picking its weights first, 3u + 2v = (8, 3),
 * rather than picking the vector and hoping. The check is that no reference is
 * a fraction, which is what would go wrong if somebody edited a component.
 */
t('no reference is a fraction, though four of the eleven divide by the cross-check',
  DU_TASKS.every(x => /^-?\d+$/.test(x.reference))
  && DU_TASKS.filter(x => /\/7/.test(x.given)).length === 4,
  DU_TASKS.map(x => `${x.reference}`).join(' '))
/*
 * THE TWO BOUNDARIES, AND THE FIRST PROMOTION IN SIX WHERE NEITHER COST
 * ANYTHING. The forty-first recorded that keeping the no-root boundary cost
 * something for the first time and that the cost came to zero; here there was
 * no temptation at all, a functional returning a number and a dimension being a
 * count. Asserted anyway, because this subject's standing contract is asserted
 * per promotion rather than assumed, and because the third point talks about a
 * vector missing a plane — which is exactly where a distance would appear if
 * somebody reached for one.
 */
t('nothing takes a square root and no task asks for an angle',
  DU_TASKS.every(x => !/\^\(1\/2\)/.test(x.given) && !/sqrt/.test(x.given))
  && DU_TASKS.every(x => !/\b(what angle|which angle|find the angle|arccos|arcsin)\b/i
    .test(`${x.prompt} ${x.given}`))
  && DU_TASKS.every(x => !/°/.test(x.prompt)),
  DU_TASKS.filter(x => /\^\(1\/2\)|sqrt|°|arccos|arcsin/i.test(`${x.prompt} ${x.given}`))
    .map(x => x.id).join(' '))
t('and the task whose answer invites a distance says it is not one',
  /is a distance to the plane/.test(taskById('and-the-row-is-not-zero-outside-it-1').prompt)
  && DU_POINTS[2].workedExample.subgoals
    .some(s => /rather than a distance to the plane/.test(s.detail)),
  taskById('and-the-row-is-not-zero-outside-it-1').prompt.slice(-90))
/*
 * NO TASK ASKS FOR A MATRIX ENTRY OR A TRANSPOSE, which is the filing argument
 * reduced to something mechanical — the same check the thirtieth, forty-first
 * and this promotion all run, because `matrices-and-determinants` says entries
 * are its unit of work and the transpose is the one thing in the node's `terms`
 * this material declines. A task reaching for either would be material filed in
 * the wrong subject.
 */
t('no task asks for a matrix entry or a transpose, the two things this filing excluded',
  DU_TASKS.every(x => !/\b[a-z]\d\d\b/.test(x.given))
  && DU_TASKS.every(x => !/\btranspose\b/i.test(`${x.prompt} ${x.given}`)),
  DU_TASKS.filter(x => /\b[a-z]\d\d\b/.test(x.given) || /transpose/i.test(x.prompt))
    .map(x => x.id).join(' '))
const DU_SUBGOALS = DU_POINTS.flatMap(p => p.workedExample.subgoals)
t('all twelve of its subgoals ship the question written, not just the label',
  DU_SUBGOALS.length === 12 && DU_SUBGOALS.every(s => typeof s.socratic === 'string'),
  `${DU_SUBGOALS.filter(s => !s.socratic).length} unwritten of ${DU_SUBGOALS.length}`)
t('and every one of them ends on its question rather than on a statement',
  DU_SUBGOALS.every(s => isInterrogative(s.socratic)),
  DU_SUBGOALS.filter(s => !isInterrogative(s.socratic)).map(s => s.label).join('; '))
t('every subgoal names a move rather than a step number, and no two in one example repeat',
  DU_POINTS.every(p =>
    p.workedExample.subgoals.every(s => s.label.length > 20 && !/^step\b/i.test(s.label))
    && new Set(p.workedExample.subgoals.map(s => s.label)).size
      === p.workedExample.subgoals.length),
  DU_SUBGOALS.filter(s => s.label.length <= 20 || /^step\b/i.test(s.label))
    .map(s => s.label).join(' | '))
/*
 * AND NO SUBGOAL'S QUESTION CONTAINS ITS OWN ANSWER, which is the failure mode
 * types.ts names by example — "Should you add the places separately?" is an
 * imperative with a question mark. There is no mechanical test for it, so what
 * is asserted is the nearest proxy that catches the shape: none of these
 * questions opens with a modal that invites a yes.
 */
t('none of the questions is an imperative wearing a question mark',
  DU_SUBGOALS.every(s => !/^(should|could|would|do|does|is|are|can|will)\b/i
    .test(s.socratic.trim())),
  DU_SUBGOALS.filter(s => /^(should|could|would|do|does|is|are|can|will)\b/i
    .test(s.socratic.trim())).map(s => s.label).join('; '))

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
