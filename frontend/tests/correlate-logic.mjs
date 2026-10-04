#!/usr/bin/env node
/**
 * Unit checks for the correlation-game logic.
 *
 * Covers the parts that are pure and mechanical, and therefore the parts a
 * regression would hide in: the tolerant JSON parse standing between a model
 * response and the database, the reply-plan coercion that decides whether a reply
 * is even admissible, the world merge that guarantees established facts
 * accumulate, the performability check that is the composed-medium equivalent of a
 * search miss, and the registries' internal consistency.
 *
 * What is deliberately not here: whether a connection is *good*. That is a
 * judgement, it is the interpreter's job, and a test that asserted it would only
 * be asserting a prompt.
 *
 * Nothing touches the network — no catalogues, no interpreter. The turn route is
 * covered by playing a game in the browser.
 *
 * Run: node tests/correlate-logic.mjs        (from frontend/)
 *
 * The modules under test are TypeScript, so they are transpiled to CommonJS in a
 * temp dir first using the project's own `typescript` devDependency. tsc's
 * CommonJS output keeps extensionless relative requires, which Node's CJS resolver
 * handles — no bundler and no extra dependency needed. This works only because
 * every cross-directory import in these modules is `import type`, which is erased:
 * a runtime import of `@/lib/...` would need path mapping that this harness
 * deliberately does not set up.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'correlate-logic-'))

function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  const entries = [
    join('lib', 'correlate', 'prompt.ts'),
    join('lib', 'correlate', 'games.ts'),
    join('lib', 'correlate', 'media.ts'),
    join('lib', 'correlate', 'relations.ts'),
    join('lib', 'correlate', 'graph.ts'),
    join('lib', 'correlate', 'tuning.ts'),
    join('lib', 'correlate', 'continuation.ts'),
    join('lib', 'offerings', 'composed.ts'),
    join('lib', 'offerings', 'shared.ts'),
    join('lib', 'offerings', 'knowledge.ts'),
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
    prompt:    require(join(outDir, 'correlate', 'prompt.js')),
    games:     require(join(outDir, 'correlate', 'games.js')),
    media:     require(join(outDir, 'correlate', 'media.js')),
    relations: require(join(outDir, 'correlate', 'relations.js')),
    graph:     require(join(outDir, 'correlate', 'graph.js')),
    tuning:    require(join(outDir, 'correlate', 'tuning.js')),
    carry:     require(join(outDir, 'correlate', 'continuation.js')),
    composed:  require(join(outDir, 'offerings', 'composed.js')),
    knowledge: require(join(outDir, 'offerings', 'knowledge.js')),
  }
}

const M = build()
const {
  parseJsonObject, normalizeInterpretation, applyWorldDelta, offeringLine, sessionScope,
  describeRejection, salvageQueries, buildSystemPrompt, buildUserPrompt, buildRetryPrompt,
  buildSalvageAccountPrompt,
} = M.prompt
const { GAME_LIST, GAMES, getGame, ACCENT_CLASSES, FEATURED_GAMES, FEATURED_GAME_IDS, retiredGameName } = M.games
const {
  MEDIA, MEDIUM_LIST, ALL_MEDIUM_IDS, getMedium, isComposed, isPropositional,
  availableMedia, playableMedia, resolveMedia, replyMediaFor,
} = M.media
const { KNOWLEDGE_MEDIA, isKnowledge, inScope, trimExtract, firstSentence } = M.knowledge
const { RELATIONS, RELATION_LIST, ALL_RELATION_IDS, relationPermitted, spentRelations, resolveRelations } = M.relations
const {
  buildGraph, pathTo, childrenOf, parentOf, siblingsOf, leavesOf, hasBranches, subtreeSize,
  defaultParent, offeringOnTable, offeringIdsAlong, relationsAlong, replyMediaAlong,
  mergeWorld, worldAlong, worldFor, linkableTurns, turnByIndex,
} = M.graph
const {
  TUNING_AXES, AXIS_LIST, ALL_AXIS_IDS, AXIS_STOPS, DEFAULT_WEIGHT, WEIGHT_LABELS, WEIGHT_HINTS,
  DEFAULT_TUNING, normalizeTuning, isNeutral, isUntouched, isProportioned, axisValue, mutedMedia,
  weightedReplyMedia, dueMedium, describeTuning, tuningSummary, getAxis, continuationOf,
  SHARE_MAX, DEFAULT_SHARE, MUTED_SHARE, shareOf, shareLabel, targetShares, shareStandings,
  owedMedia, allShares,
} = M.tuning
const {
  MAX_SELF_REPLIES, CONTINUATION_OFF, CONTINUATION_LABELS, CONTINUATION_HINTS,
  CONTINUATION_STOPS, SELF_REPLY_GUIDANCE, moverOf, isSelfReply, selfRepliesSince,
  selfRepliesLeft, selfReplyRefusal,
} = M.carry
const { checkPerformability, composeOffering, vocabularyFor } = M.composed

let pass = 0
const failures = []
function t(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { failures.push(name); console.log(`  ✗ ${name}${extra ? ` :: ${extra}` : ''}`) }
}
const group = name => console.log(`\n${name}`)

/** Every player-visible string a game owns, for lint-style assertions over copy. */
function gameCopy(g) {
  return [g.name, g.tagline, g.offeringIs, g.persona, g.replyRule, g.openingPrompt,
    ...Object.values(g.pieces), ...g.worldKeys.map(k => k.description)].join(' ')
}
const dialMentions = g => /\bdial\b/i.test(gameCopy(g))

const ALL_MEDIA = ALL_MEDIUM_IDS
const ALL_RELATIONS = ALL_RELATION_IDS

group('parseJsonObject — surviving what models actually return')
t('a bare object', parseJsonObject('{"a":1}')?.a === 1)
t('a fenced object', parseJsonObject('```json\n{"a":2}\n```')?.a === 2)
t('prose before the object', parseJsonObject('Sure thing!\n{"a":3}')?.a === 3)
t('prose after the object', parseJsonObject('{"a":4} hope that helps')?.a === 4)
t('nested objects', parseJsonObject('{"a":{"b":{"c":5}}}')?.a.b.c === 5)
t('braces inside a string do not end the object', parseJsonObject('{"a":"}{"}')?.a === '}{')
t('escaped quotes inside a string', parseJsonObject('{"a":"say \\"hi\\""}')?.a === 'say "hi"')
t('an escaped backslash before a quote', parseJsonObject('{"a":"back\\\\"}')?.a === 'back\\')
t('no JSON at all yields null', parseJsonObject('there is no json here') === null)
t('an unterminated object yields null', parseJsonObject('{"a":1') === null)

group('normalizeInterpretation — refusing to store junk')
const ni = (o, media = ALL_MEDIA, rel = ALL_RELATIONS, opts = undefined) =>
  normalizeInterpretation(o, media, rel, opts)
t('an empty response is rejected', ni({}) === null)
t('a non-object is rejected', ni(null) === null)
t('a reading alone is enough', ni({ reading: 'r' })?.reading === 'r')
t('facts are capped', ni({ reading: 'r', facts: ['1', '2', '3', '4', '5'] })?.facts.length === 3)
t('non-string facts are dropped', ni({ reading: 'r', facts: ['ok', 7, null] })?.facts.length === 1)
t('an array worldDelta is discarded', Object.keys(ni({ reading: 'r', worldDelta: ['no'] }).worldDelta).length === 0)
t('a verdict passes through', ni({ reading: 'r', verdict: 'illegal' })?.verdict === 'illegal')
t('an invented verdict is dropped', ni({ reading: 'r', verdict: 'maybe' })?.verdict === undefined)
t('carried and lost are captured', (() => {
  const r = ni({ reading: 'r', carried: 'the reaching', lost: 'the tempo' })
  return r.carried === 'the reaching' && r.lost === 'the tempo'
})())

group('normalizeInterpretation — a reply has to be admissible')
t('a catalogued reply needs a query', ni({ reading: 'r', reply: { medium: 'music', framing: 'f' } })?.reply === null)
t('a catalogued reply with a query survives', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'music', query: 'Nina Simone — Sinnerman', framing: 'the build' } })
  return r.reply?.medium === 'music' && r.reply.query.startsWith('Nina')
})())
t('a medium the game never enabled is not a reply', ni(
  { reading: 'r', reply: { medium: 'artwork', query: 'x — y', framing: 'f' } }, ['music'],
)?.reply === null)
t('a composed reply needs steps', ni({ reading: 'r', reply: { medium: 'gesture', composed: { title: 'x', steps: [] }, framing: 'f' } })?.reply === null)
t('a composed reply needs a title', ni({ reading: 'r', reply: { medium: 'gesture', composed: { steps: ['Raise one arm slowly'] }, framing: 'f' } })?.reply === null)
t('a composed reply with a title and steps survives', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'gesture', composed: { title: 'The reach', steps: ['Extend one arm forward'] }, framing: 'the stopping' } })
  return r.reply?.medium === 'gesture' && r.reply.composed.steps.length === 1
})())
t('composed steps are capped at five', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'gesture', composed: { title: 't', steps: ['a','b','c','d','e','f','g'] }, framing: 'f' } })
  return r.reply.composed.steps.length === 5
})())
t('intent defaults to shown, never invited by accident', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'stretch', composed: { title: 't', steps: ['Sit and hinge forward'] }, framing: 'f' } })
  return r.reply.composed.intent === 'shown'
})())
t('an explicit invited intent is kept', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'stretch', composed: { title: 't', steps: ['Sit and hinge forward'], intent: 'invited' }, framing: 'f' } })
  return r.reply.composed.intent === 'invited'
})())
t('a relation outside the game is dropped', ni(
  { reading: 'r', relation: 'embodiment' }, ALL_MEDIA, ['association'],
)?.relation === null)
t('a relation the game allows is kept', ni(
  { reading: 'r', relation: 'association' }, ALL_MEDIA, ['association'],
)?.relation === 'association')

group('reply medium aliases — a synonym must not kill a turn')
// Production, 2026-09-30: an interpreter answered a song with prose, wrote
// medium "prose" instead of "passage", and the whole reply was dropped without a
// trace. In Tag that ends the chain, because the next turn has nothing to answer.
const niReply = (medium, extra = {}, media = ALL_MEDIA) =>
  ni({ reading: 'r', reply: { medium, query: 'Someone — Something', framing: 'f', ...extra } }, media)
t('the exact id works', niReply('passage')?.reply?.medium === 'passage')
t('"prose" resolves to passage', niReply('prose')?.reply?.medium === 'passage')
t('"text" resolves to passage', niReply('text')?.reply?.medium === 'passage')
t('"painting" resolves to artwork', niReply('painting')?.reply?.medium === 'artwork')
// Composed media need composed content, so aliasing to one is only half the job —
// which is what these two assert, and what the first draft of them got wrong.
const niComposed = (medium) => ni({
  reading: 'r',
  reply: { medium, framing: 'f', composed: { title: 'The reach', steps: ['Extend one arm forward'] } },
})
t('"dance" resolves to movement', niComposed('dance')?.reply?.medium === 'movement')
t('a composed alias still needs steps', niReply('dance')?.replyRejection?.reason === 'unperformable')
t('"song" resolves to music', niReply('song')?.reply?.medium === 'music')
t('"yoga" resolves to stretch', niComposed('yoga')?.reply?.medium === 'stretch')
t('case and padding are tolerated', niReply('  Prose ')?.reply?.medium === 'passage')
t('a synonym for a medium NOT in play is still refused',
  niReply('painting', {}, ['music'])?.reply === null)
t('an alias cannot smuggle in a disabled medium',
  niReply('painting', {}, ['music'])?.replyRejection?.reason === 'unknown-medium')

group('reply rejections — recorded, never swallowed')
t('an absent reply is reported', ni({ reading: 'r' })?.replyRejection?.reason === 'absent')
t('an unknown medium is reported', niReply('interpretive mime')?.replyRejection?.reason === 'unknown-medium')
t('the unusable name is kept for the log', niReply('interpretive mime')?.replyRejection?.written === 'interpretive mime')
t('a catalogued reply with no query is reported', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'music', framing: 'f' } })
  return r.replyRejection?.reason === 'no-query'
})())
t('a composed reply with no steps is reported', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'gesture', composed: { title: 'x', steps: [] }, framing: 'f' } })
  return r.replyRejection?.reason === 'unperformable'
})())
t('a usable reply reports no rejection', niReply('music')?.replyRejection === null)
t('every rejection reason has readable copy', (() => {
  const cases = [
    { reason: 'absent' },
    { reason: 'unknown-medium', written: 'mime' },
    { reason: 'no-query', medium: 'music' },
    { reason: 'unperformable', medium: 'gesture' },
  ]
  return cases.every(c => typeof describeRejection(c) === 'string' && describeRejection(c).length > 0)
})())

group('applyWorldDelta — established facts are binding')
const w0 = { place: 'the airfield', callers: [], anomaly: 'unestablished', facts: ['f1'] }
const w1 = applyWorldDelta(w0, ni({ reading: 'r', narration: 'n', facts: ['f2'], worldDelta: { place: 'the hangar' } }))
t('a changed key is merged', w1.place === 'the hangar')
t('keys the delta omits survive', w1.anomaly === 'unestablished' && Array.isArray(w1.callers))
t('facts accumulate rather than replace', JSON.stringify(w1.facts) === JSON.stringify(['f1', 'f2']), JSON.stringify(w1.facts))
t('a repeated fact is not duplicated', JSON.stringify(applyWorldDelta(w1, ni({ reading: 'r', facts: ['f1'] })).facts) === JSON.stringify(['f1', 'f2']))
t('facts smuggled into worldDelta are folded in, not overwriting', JSON.stringify(applyWorldDelta(w1, ni({ reading: 'r', worldDelta: { facts: ['f3'] } })).facts) === JSON.stringify(['f1', 'f2', 'f3']))
t('the original world is not mutated', JSON.stringify(w0.facts) === JSON.stringify(['f1']))

group('relations — the mechanical half of the taxonomy')
t('all seven are registered', RELATION_LIST.length === 7 && new Set(ALL_RELATIONS).size === 7)
t('every entry is filed under its own id', RELATION_LIST.every(r => RELATIONS[r.id]?.id === r.id))
t('every relation has guidance and an example', RELATION_LIST.every(r => r.guidance.length > 0 && r.example.length > 0))
t('translation requires a change of medium', RELATIONS.translation.requiresMediumChange === true)
t('embodiment requires a change of medium', RELATIONS.embodiment.requiresMediumChange === true)
t('association does not', RELATIONS.association.requiresMediumChange === false)
t('exactly two relations require a medium change', RELATION_LIST.filter(r => r.requiresMediumChange).length === 2)
t('translation within one medium is refused', relationPermitted('translation', 'music', 'music') === false)
t('translation across media is permitted', relationPermitted('translation', 'music', 'artwork') === true)
t('association within one medium is permitted', relationPermitted('association', 'music', 'music') === true)
t('an unknown relation is never permitted', relationPermitted('vibes', 'music', 'artwork') === false)
t('resolveRelations expands "all"', resolveRelations('all').length === 7)
t('resolveRelations passes a list through', JSON.stringify(resolveRelations(['association'])) === '["association"]')

group('spentRelations — derived from the log, not from world state')
t('the most recent legal relation is spent', JSON.stringify(spentRelations([
  { relation: 'association', legal: true }, { relation: 'counterpoint', legal: true },
])) === '["counterpoint"]')
t('an illegal turn spends nothing', JSON.stringify(spentRelations([
  { relation: 'association', legal: true }, { relation: 'counterpoint', legal: false },
])) === '["association"]')
t('a turn with no relation spends nothing', JSON.stringify(spentRelations([
  { relation: 'association', legal: true }, { relation: null, legal: true },
])) === '["association"]')
t('an empty log spends nothing', spentRelations([]).length === 0)
t('the window is configurable', spentRelations([
  { relation: 'association', legal: true }, { relation: 'counterpoint', legal: true },
], 2).length === 2)

group('media — two classes, and the distinction is load-bearing')
t('every medium is filed under its own id', MEDIUM_LIST.every(m => MEDIA[m.id]?.id === m.id))
t('every medium declares an origin', MEDIUM_LIST.every(m => ['catalogue', 'library', 'composed'].includes(m.origin)))
t('every medium has a framing hint', MEDIUM_LIST.every(m => m.framingHint.length > 0),
  MEDIUM_LIST.filter(m => !m.framingHint).map(m => m.id).join(', '))
t('every medium names its provider', MEDIUM_LIST.every(m => m.provider.length > 0))
t('both classes are represented', MEDIUM_LIST.some(m => m.origin === 'composed') && MEDIUM_LIST.some(m => m.origin === 'catalogue'))
t('every physical medium is composed', MEDIUM_LIST.filter(m => m.physical).every(m => m.origin === 'composed'))
t('isComposed agrees with the registry', MEDIUM_LIST.every(m => isComposed(m.id) === (m.origin === 'composed')))
t('an unknown medium yields null', getMedium('interpretive-dance-about-taxes') === null)
t('exactly one medium needs a credential', MEDIUM_LIST.filter(m => m.requiresEnv).length === 1)
t('the credentialled medium is hidden without its key', !availableMedia({}).includes('scene'))
t('the credentialled medium appears with its key', availableMedia({ TMDB_API_KEY: 'x' }).includes('scene'))
t('keyless media are always available', availableMedia({}).includes('music') && availableMedia({}).includes('artwork'))
t('playableMedia narrows to what is available', JSON.stringify(playableMedia(['music', 'scene'], ['music'])) === '["music"]')
t('playableMedia never returns nothing', playableMedia(['scene'], ['music']).length > 0)
t('resolveMedia expands "all" to every medium', resolveMedia('all').length === MEDIUM_LIST.length)

group('reply pipeline inputs — what the guarantee is built on')
t('passage is the only library-dependent medium', (() => {
  const dependent = MEDIUM_LIST.filter(m => m.dependsOnUserLibrary).map(m => m.id)
  return dependent.length === 1 && dependent[0] === 'passage'
})(), MEDIUM_LIST.filter(m => m.dependsOnUserLibrary).map(m => m.id).join(', '))
// A retry must never land in a medium that can come back empty for reasons the
// interpreter cannot see or fix — that is how a "guaranteed" reply stays empty.
t('replyMediaFor drops the library-dependent medium', !replyMediaFor(ALL_MEDIA).includes('passage'))
t('replyMediaFor keeps everything else', replyMediaFor(ALL_MEDIA).length === ALL_MEDIA.length - 1)
t('replyMediaFor never returns nothing', replyMediaFor(['passage']).length > 0)
t('a composed medium survives, since it cannot fail to resolve',
  replyMediaFor(ALL_MEDIA).some(m => isComposed(m)))

group('salvageQueries — the server\'s own last resort, names before descriptions')
const sq = (interp, move) => salvageQueries(interp, move)
const mv = { medium: 'music', id: 'dz:1', title: 'Diaphanous', attribution: 'Ana Roxanne', framing: 'f',
             perceptible: { kind: 'audio', url: 'x' }, sourceUrl: null, origin: 'catalogue', meta: {} }
// The ordering claim this group exists to defend. `carried` used to seed the first
// attempt, and in a game whose readings are abstract by design that means the
// server's last resort is four abstract nouns — "principle survival requires both",
// which a catalogue answers with whatever article is nearest those words. The one
// name anywhere in an interpretation is what the interpreter tried to look up.
t('the interpreter\'s own query seeds the first attempt',
  sq({ reply: { medium: 'organism', query: 'Anglerfish' }, carried: 'both halves of survival', facts: [] }, mv)[0] === 'Anglerfish')
t('a gloss after a dash is stripped from it',
  sq({ reply: { medium: 'organism', query: 'Anglerfish — the illuminated lure' }, carried: '', facts: [] }, mv)[0] === 'Anglerfish')
t('the move title comes next', sq({ carried: '', facts: [] }, mv)[0] === 'Diaphanous')
t('the attribution after that', sq({ carried: '', facts: [] }, mv)[1] === 'Ana Roxanne')
t('the carried quality is the LAST resort, not the first',
  sq({ carried: 'the quality of something almost-visible', facts: [] }, mv).at(-1) === 'quality almost visible',
  sq({ carried: 'the quality of something almost-visible', facts: [] }, mv).join(' | '))
t('short words are dropped from the seed',
  !sq({ carried: 'the and of a quality', facts: [] }, mv).at(-1).split(' ').some(w => w.length <= 3))
// Length alone let "that", "which" and "requires" through, which is how a seed ends
// up made entirely of grammar.
t('function words are dropped even when they are long enough',
  sq({ carried: 'the principle that survival requires both fitting and signalling', facts: [] }, mv).at(-1)
    === 'principle survival fitting signalling',
  sq({ carried: 'the principle that survival requires both fitting and signalling', facts: [] }, mv).at(-1))
t('nothing usable yields no attempts rather than empty strings',
  sq({ carried: '', facts: [] }, { ...mv, title: '', attribution: null }).length === 0)
t('punctuation does not leak into a query',
  !/[—"'?!]/.test(sq({ carried: 'reaching — never "arriving"', facts: [] }, mv).at(-1)))

group('game registry — internal consistency')
t('GAME_LIST covers every game exactly once', GAME_LIST.length === Object.keys(GAMES).length && new Set(GAME_LIST.map(g => g.id)).size === GAME_LIST.length)
t('every entry is filed under its own id', GAME_LIST.every(g => GAMES[g.id]?.id === g.id))
t('every game seeds a facts array', GAME_LIST.every(g => Array.isArray(g.seedWorld.facts)))
t('every game declares world keys', GAME_LIST.every(g => g.worldKeys.length > 0))
t('every declared world key is seeded', GAME_LIST.every(g => g.worldKeys.every(k => k.key in g.seedWorld)),
  GAME_LIST.filter(g => !g.worldKeys.every(k => k.key in g.seedWorld)).map(g => g.id).join(', '))
t('every game answers all six pieces', GAME_LIST.every(g =>
  ['playerMove', 'interpreter', 'responseRule', 'worldState', 'constraint', 'goal'].every(k => typeof g.pieces[k] === 'string' && g.pieces[k].length > 0)))
t('every game has a persona and a reply rule', GAME_LIST.every(g => g.persona.length > 0 && g.replyRule.length > 0))
t('every judge is one of the two kinds', GAME_LIST.every(g => ['player', 'narrator'].includes(g.judge)))
t('both interpretation kinds are represented', new Set(GAME_LIST.map(g => g.judge)).size === 2)
t('every declaredRelation is one of the three', GAME_LIST.every(g => ['required', 'optional', 'never'].includes(g.declaredRelation)))
t('all three declaration kinds are represented', new Set(GAME_LIST.map(g => g.declaredRelation)).size === 3)
t('every accent resolves to real classes', GAME_LIST.every(g => !!ACCENT_CLASSES[g.accent]),
  GAME_LIST.filter(g => !ACCENT_CLASSES[g.accent]).map(g => g.accent).join(', '))
t('no two games share an accent', new Set(GAME_LIST.map(g => g.accent)).size === GAME_LIST.length)
t('every game references only real media', GAME_LIST.every(g => resolveMedia(g.media).every(m => !!getMedium(m))),
  GAME_LIST.filter(g => !resolveMedia(g.media).every(m => !!getMedium(m))).map(g => g.id).join(', '))
t('every game references only real relations', GAME_LIST.every(g => resolveRelations(g.relations).every(r => !!RELATIONS[r])),
  GAME_LIST.filter(g => !resolveRelations(g.relations).every(r => !!RELATIONS[r])).map(g => g.id).join(', '))
t('every game permits at least one relation', GAME_LIST.every(g => resolveRelations(g.relations).length > 0))
t('a game that enforces its constraint exists', GAME_LIST.some(g => g.enforcesConstraint === true))
t('enforcesConstraint is boolean-or-absent', GAME_LIST.every(g => g.enforcesConstraint === undefined || typeof g.enforcesConstraint === 'boolean'))
t('an unknown game id yields null', getGame('no-such-game') === null)

group('game registry — order and framing are part of the design')
t('Tag is first', GAME_LIST[0].id === 'tag', GAME_LIST[0].id)
t('Correlation Chain is second', GAME_LIST[1].id === 'chain', GAME_LIST[1].id)
t('every game is cross-medium', GAME_LIST.every(g => g.media === 'all'),
  GAME_LIST.filter(g => g.media !== 'all').map(g => g.id).join(', '))
// "the dial" was a radio operator's instrument borrowed from a deleted game and
// left standing in for the interpreter in three others. It is not a concept this
// section has any more, and a new game should not quietly reintroduce it.
t('no game mentions a dial', GAME_LIST.every(g => !dialMentions(g)),
  GAME_LIST.filter(dialMentions).map(g => g.id).join(', '))
t('no game is named after a single medium', GAME_LIST.every(g => !/radio|listen/i.test(g.name)))
t('the retired game is really gone', getGame('radio') === null)
t('the retired game is still nameable', retiredGameName('radio') === 'Night Radio')
t('a game in the registry is not also retired', GAME_LIST.every(g => retiredGameName(g.id) === null))
t('an unretired unknown id has no name', retiredGameName('no-such-game') === null)
t('every featured id is a real game', FEATURED_GAME_IDS.every(id => !!getGame(id)),
  FEATURED_GAME_IDS.filter(id => !getGame(id)).join(', '))
t('FEATURED_GAMES resolves to the same set', FEATURED_GAMES.length === FEATURED_GAME_IDS.length && FEATURED_GAMES.every(g => !!g))
t('the front page leads with Tag too', FEATURED_GAMES[0].id === 'tag')

group('game registry — a medium-change relation needs somewhere to go')
// A game that permits translation or embodiment but offers only one medium would
// make a relation the player can never legally use. That is a data error the
// registries can catch, so catch it.
t('no single-medium game offers a relation that requires a change of medium', GAME_LIST.every(g => {
  const media = resolveMedia(g.media)
  if (media.length > 1) return true
  return resolveRelations(g.relations).every(r => !RELATIONS[r].requiresMediumChange)
}), GAME_LIST.filter(g => {
  const media = resolveMedia(g.media)
  return media.length === 1 && resolveRelations(g.relations).some(r => RELATIONS[r].requiresMediumChange)
}).map(g => g.id).join(', '))

group('a change of medium is optional — the copy and the rules must agree')
// The front page and the system prompt both once said a change of medium "is
// itself the move", which asserts a requirement the rules do not impose: only
// translation and embodiment demand a crossing, and in the prompt the
// overstatement risked pushing the interpreter to change medium every turn.
t('most relations do not require a change of medium',
  RELATION_LIST.filter(r => !r.requiresMediumChange).length === 5)
t('a same-medium answer is legal for every other relation',
  RELATION_LIST.filter(r => !r.requiresMediumChange)
    .every(r => relationPermitted(r.id, 'music', 'music')))
// Translation is the deliberate exception: every relation it allows requires a
// crossing, because answering in the same medium is not a translation. That is
// legitimate — but a game that forbids a same-medium answer must *tell the player*
// in its constraint, or the restriction is a trap.
const sameMediumGames = GAME_LIST.filter(g =>
  resolveRelations(g.relations).some(r => !RELATIONS[r].requiresMediumChange))
const crossingOnlyGames = GAME_LIST.filter(g => !sameMediumGames.includes(g))
t('most games permit a same-medium answer', sameMediumGames.length === GAME_LIST.length - 1)
t('only Translation requires a crossing on every relation',
  crossingOnlyGames.length === 1 && crossingOnlyGames[0].id === 'translation',
  crossingOnlyGames.map(g => g.id).join(', '))
t('a crossing-only game says so in its constraint', crossingOnlyGames.every(g =>
  /different medium|not a translation|same medium/i.test(g.pieces.constraint)),
  crossingOnlyGames.filter(g => !/different medium|not a translation|same medium/i.test(g.pieces.constraint))
    .map(g => g.id).join(', '))
t('the system prompt does not claim a medium change is the move', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)
  return !/medium is itself (a|the) move/.test(p)
})())
t('the system prompt says a medium change is optional', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)
  return /not required/.test(p) && /stay when it is not/.test(p)
})())
t('the system prompt warns against changing medium for show', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)
  return /look inventive/.test(p)
})())

group('sessionScope — a game narrows to what the deployment can serve')
t('an all-media game narrows to the available set', JSON.stringify(sessionScope(GAMES.chain, ['music', 'artwork']).media) === '["music","artwork"]')
t('an all-media game expands to everything available', sessionScope(GAMES.tag, ALL_MEDIA).media.length === ALL_MEDIA.length)
t('a scope narrowed to nothing still yields a playable medium', sessionScope({ ...GAMES.tag, media: ['scene'] }, ['artwork']).media.length === 1)
t('relations come through unnarrowed', sessionScope(GAMES.chain, ['music']).relations.length === 7)

group('performability — the composed-medium guard')
const good = { medium: 'gesture', title: 'The interrupted reach', framing: 'The stopping.', intent: 'shown', steps: ['Extend one arm forward at chest height', 'Stop it dead two thirds of the way out'] }
t('a concrete offering passes', checkPerformability(good).length === 0, JSON.stringify(checkPerformability(good)))
t('no title is caught', checkPerformability({ ...good, title: '  ' }).includes('no-title'))
t('no steps is caught', checkPerformability({ ...good, steps: [] }).includes('no-steps'))
t('vague mush is caught', checkPerformability({ ...good, steps: ['do it'] }).includes('vague-steps'))
t('a blank-padded step list is caught as empty', checkPerformability({ ...good, steps: ['', '   '] }).includes('no-steps'))
t('more than five steps is caught', checkPerformability({ ...good, steps: Array(6).fill('Move the left arm upward slowly') }).includes('too-many-steps'))
t('no framing is caught', checkPerformability({ ...good, framing: '' }).includes('no-framing'))
t('every problem code has copy', (() => {
  const codes = ['no-title', 'no-steps', 'too-many-steps', 'vague-steps', 'no-framing']
  return codes.every(c => typeof M.composed.PROBLEM_COPY[c] === 'string' && M.composed.PROBLEM_COPY[c].length > 0)
})())

group('composeOffering — authored, but still an Offering')
const built = composeOffering(good)
t('a good input builds', built.ok === true)
t('the id is deterministic', built.ok && composeOffering(good).offering.id === built.offering.id)
t('the id names its medium', built.ok && built.offering.id.startsWith('composed:gesture:'))
t('a different title is a different id', built.ok && composeOffering({ ...good, title: 'Something else' }).offering.id !== built.offering.id)
t('origin is composed', built.ok && built.offering.origin === 'composed')
t('framing survives', built.ok && built.offering.framing === 'The stopping.')
t('steps survive in order', built.ok && built.offering.steps[0].startsWith('Extend'))
t('it is perceptible as text', built.ok && built.offering.perceptible.kind === 'text')
t('a bad input does not build', composeOffering({ ...good, steps: ['no'] }).ok === false)
t('a bad input explains itself', (() => {
  const r = composeOffering({ ...good, steps: ['no'] })
  return !r.ok && r.problems.length > 0
})())
t('an unexpected intent falls back to shown, not invited', (() => {
  const r = composeOffering({ ...good, intent: 'demanded' })
  // composeOffering trusts its typed input, so this documents the *route's*
  // coercion being the place that normalises — see normalizeReply above.
  return r.ok === true
})())

group('vocabularies — somewhere to start, and every entry already passes')
const VOCAB_MEDIA = MEDIUM_LIST.filter(m => m.origin === 'composed').map(m => m.id)
t('every composed medium has a vocabulary', VOCAB_MEDIA.every(m => vocabularyFor(m).length > 0),
  VOCAB_MEDIA.filter(m => vocabularyFor(m).length === 0).join(', '))
t('every vocabulary entry is itself performable', VOCAB_MEDIA.every(m =>
  vocabularyFor(m).every(v => checkPerformability({ medium: m, ...v, intent: 'shown' }).length === 0)),
  VOCAB_MEDIA.flatMap(m => vocabularyFor(m)
    .filter(v => checkPerformability({ medium: m, ...v, intent: 'shown' }).length > 0)
    .map(v => `${m}/${v.title}: ${checkPerformability({ medium: m, ...v, intent: 'shown' }).join('+')}`)).join('; '))
t('a catalogued medium has no vocabulary', vocabularyFor('music').length === 0)

group('offeringLine — what the interpreter is allowed to reason about')
const track = {
  medium: 'music', id: '1', title: 'Sinnerman', attribution: 'Nina Simone',
  framing: 'the build from 4:00', perceptible: { kind: 'audio', url: 'x' },
  sourceUrl: null, origin: 'catalogue',
  meta: { year: '1965', genre: 'Jazz', album: 'Pastel Blues', durationMs: 603000, popularity: 71 },
}
const line = offeringLine(track)
t('the medium is stated', line.includes('Music'))
t('identity is stated', line.includes('Sinnerman') && line.includes('Nina Simone'))
t('the framing is stated', line.includes('the build from 4:00'))
t('genre and year come through', line.includes('1965') && line.includes('Jazz'))
// The whole point of the metadata reversal: duration and popularity are facts about
// a release, not things you can hear, and feeding them in is what made "same
// decade" feel like a legal move.
t('duration is never fed to the interpreter', !line.includes('603000'))
t('popularity is never fed to the interpreter', !line.includes('71'))
t('a composed offering shows its steps', offeringLine({
  medium: 'gesture', id: 'composed:gesture:x', title: 'The reach', attribution: null,
  framing: 'the stopping', steps: ['Extend one arm', 'Stop it dead'], intent: 'shown',
  perceptible: { kind: 'text', body: '' }, sourceUrl: null, origin: 'composed', meta: {},
}).includes('Stop it dead'))
t('a passage carries its text', offeringLine({
  medium: 'passage', id: 'passage:1:0', title: 'Moby-Dick', attribution: null,
  framing: 'the first sentence', perceptible: { kind: 'text', body: 'Call me Ishmael.' },
  sourceUrl: '/books/1?page=1', origin: 'library', meta: { book: 'Moby-Dick', page: 1 },
}).includes('Call me Ishmael.'))

// ---------------------------------------------------------------------------
// The conversation graph
// ---------------------------------------------------------------------------

const off = (id, medium = 'music') => ({
  medium, id, title: id, attribution: null, framing: 'f',
  perceptible: { kind: 'none' }, sourceUrl: null, origin: 'catalogue', meta: {},
})

const mkTurn = (o = {}) => ({
  id: o.id,
  session_id: 's',
  user_id: 'u',
  turn_index: o.turn_index ?? 0,
  parent_turn_id: o.parent_turn_id ?? null,
  move_offering: o.move_offering ?? off(`${o.id}-move`, o.medium ?? 'music'),
  reply_offering: o.reply_offering === undefined ? off(`${o.id}-reply`, o.replyMedium ?? 'music') : o.reply_offering,
  reply_query: null,
  relation: o.relation ?? 'association',
  claimed_relation: null,
  reading: null,
  narration: null,
  carried: o.carried ?? null,
  lost: null,
  facts: o.facts ?? [],
  world_delta: o.world_delta ?? null,
  link_turn_id: o.link_turn_id ?? null,
  link_note: null,
  tuning: null,
  // Null rather than 'player' by default, because that is what every row written
  // before migration 59 holds and the helpers have to read it as a player move.
  move_by: o.move_by ?? null,
  legal: o.legal !== false,
  created_at: '',
})

//        t0
//        └── t1
//            ├── t2
//            └── t3
//                └── t4
const FORKED = [
  mkTurn({ id: 't0', turn_index: 0 }),
  mkTurn({ id: 't1', turn_index: 1, parent_turn_id: 't0' }),
  mkTurn({ id: 't2', turn_index: 2, parent_turn_id: 't1' }),
  mkTurn({ id: 't3', turn_index: 3, parent_turn_id: 't1' }),
  mkTurn({ id: 't4', turn_index: 4, parent_turn_id: 't3' }),
]
const forked = buildGraph(FORKED)

const LINEAR = [
  mkTurn({ id: 'a0', turn_index: 0 }),
  mkTurn({ id: 'a1', turn_index: 1, parent_turn_id: 'a0' }),
]
const linear = buildGraph(LINEAR)

group('buildGraph — a turn names what it answers')
t('a parentless turn is a root', JSON.stringify(forked.rootIds) === '["t0"]', JSON.stringify(forked.rootIds))
t('every turn is a node', forked.nodes.size === FORKED.length)
t('order is creation order', forked.order.map(x => x.id).join() === 't0,t1,t2,t3,t4')
t('two turns may answer the same one', childrenOf(forked, 't1').map(x => x.id).join() === 't2,t3')
t('depth counts the ancestors', forked.nodes.get('t4').depth === 3 && forked.nodes.get('t0').depth === 0)
t('a parent outside the set is treated as absent', (() => {
  const g = buildGraph([mkTurn({ id: 'x', turn_index: 0, parent_turn_id: 'does-not-exist' })])
  return g.rootIds.join() === 'x' && g.nodes.get('x').parentId === null
})())
t('a turn cannot be its own parent', (() => {
  const g = buildGraph([mkTurn({ id: 'y', turn_index: 0, parent_turn_id: 'y' })])
  return g.nodes.get('y').parentId === null
})())
t('a branched game knows it', hasBranches(forked) === true)
t('a line knows it is a line', hasBranches(linear) === false)
t('two roots also count as branching', hasBranches(buildGraph([
  mkTurn({ id: 'r1', turn_index: 0 }), mkTurn({ id: 'r2', turn_index: 1 }),
])) === true)

group('pathTo — the chain is a path, not the session')
t('the path runs root to leaf', pathTo(forked, 't4').map(x => x.id).join() === 't0,t1,t3,t4')
t('the sibling branch is not on it', !pathTo(forked, 't4').some(x => x.id === 't2'))
t('a root path is just the root', pathTo(forked, 't0').map(x => x.id).join() === 't0')
t('no focus is no path', pathTo(forked, null).length === 0)
t('an unknown id is no path', pathTo(forked, 'nope').length === 0)
t('siblings see each other', siblingsOf(forked, 't2').map(x => x.id).join() === 't3')
t('the parent is reachable', parentOf(forked, 't4').id === 't3')
t('a root has no parent', parentOf(forked, 't0') === null)
t('leaves are the live ends', leavesOf(forked).map(x => x.id).join() === 't2,t4')
t('subtreeSize counts descendants, not self', subtreeSize(forked, 't1') === 3)
t('a leaf has no subtree', subtreeSize(forked, 't4') === 0)
t('turnByIndex finds a turn by its name', turnByIndex(forked, 3).id === 't3')
t('turnByIndex refuses an index that is not there', turnByIndex(forked, 99) === null)

group('defaultParent — where a player who said nothing is standing')
t('the newest legal turn', defaultParent(forked).id === 't4')
// An illegal move established nothing and left nothing on the table, so it can
// never be the thing being answered — which is the rule the chain already had.
t('an illegal newest turn is walked past', (() => {
  const g = buildGraph([...FORKED, mkTurn({ id: 't5', turn_index: 5, parent_turn_id: 't4', legal: false })])
  return defaultParent(g).id === 't4'
})())
t('two illegal turns in a row are both walked past', (() => {
  const g = buildGraph([
    ...FORKED,
    mkTurn({ id: 't5', turn_index: 5, parent_turn_id: 't4', legal: false }),
    mkTurn({ id: 't6', turn_index: 6, parent_turn_id: 't4', legal: false }),
  ])
  return defaultParent(g).id === 't4'
})())
t('an empty game has no head', defaultParent(buildGraph([])) === null)
t('a game of nothing but rejections has no head',
  defaultParent(buildGraph([mkTurn({ id: 'z', turn_index: 0, legal: false })])) === null)

group('offeringOnTable — what a move answers')
t('the reply is on the table', offeringOnTable(FORKED[0]).id === 't0-reply')
t('the move stands in when no reply was recorded',
  offeringOnTable(mkTurn({ id: 'q', reply_offering: null })).id === 'q-move')
t('a turned-away move leaves nothing', offeringOnTable(mkTurn({ id: 'q', legal: false })) === null)
t('no turn leaves nothing', offeringOnTable(null) === null)
t('offeringIdsAlong collects both halves',
  offeringIdsAlong(pathTo(forked, 't2')).length === 6)
t('relationsAlong is what spentRelations wants', (() => {
  const spent = spentRelations(relationsAlong(pathTo(forked, 't4')), 1)
  return spent.length === 1 && spent[0] === 'association'
})())
t('replyMediaAlong lists only replies that landed', (() => {
  const g = buildGraph([
    mkTurn({ id: 'b0', turn_index: 0, replyMedium: 'music' }),
    mkTurn({ id: 'b1', turn_index: 1, parent_turn_id: 'b0', replyMedium: 'artwork' }),
    mkTurn({ id: 'b2', turn_index: 2, parent_turn_id: 'b1', reply_offering: null }),
  ])
  return replyMediaAlong(pathTo(g, 'b2')).join() === 'music,artwork'
})())

group('the world is a property of the branch')
const SEED = { place: 'unset', facts: [] }
const WORLDED = [
  mkTurn({ id: 'w0', turn_index: 0, world_delta: { place: 'the airfield' }, facts: ['f1'] }),
  mkTurn({ id: 'w1', turn_index: 1, parent_turn_id: 'w0', world_delta: { mood: 'held' }, facts: ['f2'] }),
  mkTurn({ id: 'w2', turn_index: 2, parent_turn_id: 'w0', world_delta: { place: 'the hangar' }, facts: ['f3'] }),
]
const worlded = buildGraph(WORLDED)
t('a delta on the path is applied', worldAlong(SEED, pathTo(worlded, 'w1')).place === 'the airfield')
t('later keys merge over earlier ones', worldAlong(SEED, pathTo(worlded, 'w2')).place === 'the hangar')
t('the sibling branch keeps its own world', worldAlong(SEED, pathTo(worlded, 'w1')).place !== 'the hangar')
t('facts accumulate along the path',
  JSON.stringify(worldAlong(SEED, pathTo(worlded, 'w1')).facts) === '["f1","f2"]')
t('a sibling does not inherit the other branch\'s facts',
  JSON.stringify(worldAlong(SEED, pathTo(worlded, 'w2')).facts) === '["f1","f3"]')
t('the seed survives keys nothing touched', worldAlong({ ...SEED, anomaly: 'none' }, pathTo(worlded, 'w1')).anomaly === 'none')
t('an illegal turn establishes nothing', (() => {
  const g = buildGraph([
    mkTurn({ id: 'i0', turn_index: 0, world_delta: { place: 'here' }, facts: ['kept'] }),
    mkTurn({ id: 'i1', turn_index: 1, parent_turn_id: 'i0', legal: false, world_delta: { place: 'nowhere' }, facts: ['dropped'] }),
  ])
  const w = worldAlong(SEED, pathTo(g, 'i1'))
  return w.place === 'here' && JSON.stringify(w.facts) === '["kept"]'
})())
t('the seed is not mutated', SEED.place === 'unset' && SEED.facts.length === 0)

group('worldFor — sessions written before the graph existed')
// Their turns have no deltas to fold, but they are lines, and a line has exactly
// one world: the session's own. Trusting the fold there would silently empty it.
const LEGACY = [mkTurn({ id: 'l0', turn_index: 0 }), mkTurn({ id: 'l1', turn_index: 1, parent_turn_id: 'l0' })]
const legacy = buildGraph(LEGACY)
t('a line with no deltas uses the session world',
  worldFor(SEED, { place: 'the hangar' }, legacy, pathTo(legacy, 'l1')).place === 'the hangar')
t('a complete path is folded, not read from the session',
  worldFor(SEED, { place: 'stale' }, worlded, pathTo(worlded, 'w1')).place === 'the airfield')
t('a branched legacy session is folded anyway, lossily', (() => {
  // No branch-correct answer exists from one stored world, and handing both
  // branches the same one would be worse than starting the new branch from less.
  const g = buildGraph([...LEGACY, mkTurn({ id: 'l2', turn_index: 2, parent_turn_id: 'l0' })])
  return worldFor(SEED, { place: 'the hangar' }, g, pathTo(g, 'l2')).place === 'unset'
})())
t('an empty path is the seed', worldFor(SEED, { place: 'x' }, worlded, []).place === 'unset')

group('mergeWorld — one merge rule, used in both places')
// If the per-turn merge and the per-path fold ever disagreed, reopening a game
// would show a different world than playing it did.
t('applyWorldDelta is mergeWorld', (() => {
  const w = { place: 'a', facts: ['f1'] }
  const viaInterpretation = applyWorldDelta(w, ni({ reading: 'r', facts: ['f2'], worldDelta: { place: 'b' } }))
  const direct = mergeWorld(w, { place: 'b' }, ['f2'])
  return JSON.stringify(viaInterpretation) === JSON.stringify(direct)
})())
t('a null delta is a no-op except for facts', (() => {
  const w = mergeWorld({ place: 'a', facts: [] }, null, ['f'])
  return w.place === 'a' && JSON.stringify(w.facts) === '["f"]'
})())

group('linkableTurns — a callback has to point at something real')
t('every legal turn is linkable', linkableTurns(forked, null).length === 5)
t('the turn being answered is not linkable', (() => {
  const ids = linkableTurns(forked, 't3').map(x => x.id)
  return !ids.includes('t3') && ids.length === 4
})())
t('a turned-away turn is not linkable', (() => {
  const g = buildGraph([...FORKED, mkTurn({ id: 't5', turn_index: 5, parent_turn_id: 't4', legal: false })])
  return !linkableTurns(g, null).some(x => x.id === 't5')
})())
t('a link to a turn that was not shown is dropped',
  ni({ reading: 'r', link: { turn: 99, note: 'same reaching' } }, ALL_MEDIA, ALL_RELATIONS, { linkable: [0, 1] })?.link === null)
t('a link to a shown turn survives', (() => {
  const r = ni({ reading: 'r', link: { turn: 1, note: 'the same reaching' } }, ALL_MEDIA, ALL_RELATIONS, { linkable: [0, 1] })
  return r.link?.turnIndex === 1 && r.link.note === 'the same reaching'
})())
t('a numeric string index is tolerated',
  ni({ reading: 'r', link: { turn: '1', note: 'x' } }, ALL_MEDIA, ALL_RELATIONS, { linkable: [1] })?.link?.turnIndex === 1)
// "This rhymes with turn 3" with nothing said about how is not an observation.
t('a link with no note is dropped',
  ni({ reading: 'r', link: { turn: 1, note: '  ' } }, ALL_MEDIA, ALL_RELATIONS, { linkable: [1] })?.link === null)
t('links are refused outright when none were offered',
  ni({ reading: 'r', link: { turn: 1, note: 'x' } })?.link === null)
t('no link is null, not undefined', ni({ reading: 'r' }, ALL_MEDIA, ALL_RELATIONS, { linkable: [1] })?.link === null)

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

group('tuning registry — internal consistency')
t('three axes are registered', AXIS_LIST.length === 3 && new Set(ALL_AXIS_IDS).size === 3)
t('every axis is filed under its own id', AXIS_LIST.every(a => TUNING_AXES[a.id]?.id === a.id))
t('every axis has a stop for every label', AXIS_LIST.every(a => a.stops.length === AXIS_STOPS && a.labels.length === AXIS_STOPS))
t('every neutral is a real stop', AXIS_LIST.every(a => a.neutral >= 0 && a.neutral < AXIS_STOPS))
// A default must not bias anything, and the cheapest guarantee is that it says
// nothing at all.
t('the neutral stop says nothing', AXIS_LIST.every(a => a.stops[a.neutral] === ''))
t('every other stop says something', AXIS_LIST.every(a =>
  a.stops.every((s, i) => (i === a.neutral) === (s === ''))))
t('every axis names both ends and what it does',
  AXIS_LIST.every(a => a.low && a.high && a.does))
t('every share has a word for it',
  [0, 15, DEFAULT_SHARE, SHARE_MAX].every(w => shareLabel(w).length > 0))
t('an unknown axis yields null', getAxis('vibes') === null)
// Same rule the games are held to: "the dial" is a retired concept and new
// player-visible copy must not quietly bring it back.
t('no axis copy mentions a dial', AXIS_LIST.every(a =>
  !/\bdial\b/i.test([a.name, a.does, a.low, a.high, ...a.labels, ...a.stops].join(' '))),
  AXIS_LIST.filter(a => /\bdial\b/i.test([a.name, a.does, ...a.labels, ...a.stops].join(' '))).map(a => a.id).join(', '))

group('normalizeTuning — canonical, so neutral is a key count')
const TU = (raw, media = ALL_MEDIA) => normalizeTuning(raw, media)
t('an empty tuning is neutral', isNeutral(TU({})))
t('the default tuning is neutral', isNeutral(DEFAULT_TUNING))
t('junk is neutral', isNeutral(TU(null)) && isNeutral(TU('nope')) && isNeutral(TU(7)))
t('a share is kept', TU({ shares: { music: 90 } }).shares.music === 90)
t('a share equal to the default is dropped',
  TU({ shares: { music: DEFAULT_SHARE } }).shares.music === undefined)
t('a share is clamped to 0..100', TU({ shares: { music: 900, artwork: -4 } }).shares.music === SHARE_MAX &&
  TU({ shares: { artwork: -4 } }).shares.artwork === MUTED_SHARE)
t('a fractional share is rounded', TU({ shares: { music: 90.6 } }).shares.music === 91)
t('a numeric string share is tolerated', TU({ shares: { music: '0' } }).shares.music === 0)
t('a medium the session does not play is dropped',
  TU({ shares: { artwork: 0 } }, ['music']).shares.artwork === undefined)
t('a medium that does not exist is dropped',
  Object.keys(TU({ shares: { interpretive_mime: 0 } }).shares).length === 0)
// Every session row, every preset and every turn's tuning snapshot written before
// today holds the retired 0-3 scale. Read as shares they would mean "almost never".
t('a legacy 0-3 weight is upgraded', (() => {
  const u = TU({ weights: { music: 3, stretch: 1, scene: 0 } })
  return u.shares.music === 100 && u.shares.stretch === 15 && u.shares.scene === 0
})())
t('a legacy default weight is dropped like any other default',
  TU({ weights: { music: 2 } }).shares.music === undefined)
// A stored 2 is "freely" on the old scale and all-but-muted on the new one. The
// key decides which, and shares always wins, so neither can be read as the other.
t('shares win over a legacy weights object', (() => {
  const u = TU({ shares: { music: 2 }, weights: { music: 3 } })
  return u.shares.music === 2
})())
t('an axis is kept', TU({ axes: { nostalgia: 4 } }).axes.nostalgia === 4)
t('an axis at its neutral is dropped',
  TU({ axes: { nostalgia: TUNING_AXES.nostalgia.neutral } }).axes.nostalgia === undefined)
t('an axis is clamped to its stops', TU({ axes: { nostalgia: 11 } }).axes.nostalgia === AXIS_STOPS - 1)
t('an invented axis is dropped', Object.keys(TU({ axes: { horniness: 4 } }).axes).length === 0)
t('shareOf falls back to the default', shareOf(TU({}), 'music') === DEFAULT_SHARE)
t('axisValue falls back to the neutral', axisValue(TU({}), 'nostalgia') === TUNING_AXES.nostalgia.neutral)

group('shares are arithmetic, not a hint')
// The weighting a real game was set to when it misbehaved: music turned up,
// the composed media left low, everything else off. Measured outcome before the
// fix: 29% music, 57% stretch.
const MOSTLY_MUSIC = TU({ shares: {
  music: 100, stretch: 15, exercise: 15, movement: 15,
  artwork: 0, scene: 0, gesture: 0, passage: 0, theorem: 0, phenomenon: 0, organism: 0, place: 0,
} })
t('a zero share mutes a medium', mutedMedia(MOSTLY_MUSIC, ALL_MEDIA).includes('scene'))
t('a non-zero share does not', !mutedMedia(MOSTLY_MUSIC, ALL_MEDIA).includes('stretch'))
t('nothing is muted by default', mutedMedia(TU({}), ALL_MEDIA).length === 0)
t('a muted medium cannot be answered in',
  !weightedReplyMedia(MOSTLY_MUSIC, ALL_MEDIA).includes('scene'))
t('the heaviest medium is tried first',
  weightedReplyMedia(MOSTLY_MUSIC, ALL_MEDIA)[0] === 'music')
t('weighting does not invent media',
  weightedReplyMedia(MOSTLY_MUSIC, ['music', 'stretch']).length === 2)
// A player who mutes everything has expressed a contradiction with the guarantee
// that every legal turn carries a real reply. The mute loses, not the guarantee.
t('muting everything is ignored rather than breaking the reply guarantee',
  weightedReplyMedia(TU({ shares: Object.fromEntries(ALL_MEDIA.map(m => [m, 0])) }), ALL_MEDIA).length === ALL_MEDIA.length)

group('targetShares — the number the player was never shown')
// The headline defect. Expected share used to be weight/sum across every
// non-muted medium, so one medium turned up against eleven defaults was a
// minority while calling itself "mostly".
t('a lone raised medium among defaults is honestly reported as small', (() => {
  const pct = targetShares(TU({ shares: { music: SHARE_MAX } }), ALL_MEDIA).music
  return pct > 0.14 && pct < 0.17
})(), JSON.stringify(targetShares(TU({ shares: { music: SHARE_MAX } }), ALL_MEDIA).music))
// ...and muting the rest is what actually buys a majority, which the percentage
// now says out loud.
t('muting the others hands their share over', (() => {
  const pct = targetShares(MOSTLY_MUSIC, ALL_MEDIA).music
  return pct > 0.68 && pct < 0.70
})(), JSON.stringify(targetShares(MOSTLY_MUSIC, ALL_MEDIA).music))
t('the shares sum to one', (() => {
  const sum = Object.values(targetShares(MOSTLY_MUSIC, ALL_MEDIA)).reduce((a, b) => a + b, 0)
  return Math.abs(sum - 1) < 1e-9
})())
t('a muted medium is not in the denominator',
  targetShares(MOSTLY_MUSIC, ALL_MEDIA).scene === undefined)
t('an untouched tuning is an equal split', (() => {
  const ts = targetShares(TU({}), ALL_MEDIA)
  return Object.values(ts).every(v => Math.abs(v - 1 / ALL_MEDIA.length) < 1e-9)
})())
t('everything muted yields no targets rather than NaN',
  Object.keys(targetShares(TU({ shares: Object.fromEntries(ALL_MEDIA.map(m => [m, 0])) }), ALL_MEDIA)).length === 0)

group('owedMedia — the proportion is a filter, not a request')
const PAIR = ['music', 'stretch']
const HALF = TU({ shares: { music: 85, stretch: 15 } }, PAIR)
t('an empty branch owes everybody', owedMedia(HALF, PAIR, []).length === 2)
// The actual bug, as a test: a stretch has had its share, so the next reply
// cannot be one. Under the old code this was a sentence ending "do not force it".
t('a medium over its share is removed from what may be answered in', (() => {
  const owed = owedMedia(HALF, PAIR, ['stretch'])
  return owed.includes('music') && !owed.includes('stretch')
})(), JSON.stringify(owedMedia(HALF, PAIR, ['stretch'])))
t('and it comes back once the chain has caught up', (() => {
  // 15% of seven turns is just over one, so a stretch is owed again by then.
  const owed = owedMedia(HALF, PAIR, ['stretch', 'music', 'music', 'music', 'music', 'music'])
  return owed.includes('stretch')
})())
t('the heavy medium stays available throughout', (() => {
  const history = []
  for (let i = 0; i < 12; i++) {
    const owed = owedMedia(HALF, PAIR, history)
    if (!owed.includes('music') && owed.includes('stretch')) history.push('stretch')
    else history.push(owed[0])
  }
  const music = history.filter(m => m === 'music').length
  // 85/100 asked for; a greedy walk should land near it and must not invert.
  return music >= 9 && music <= 11
})(), (() => {
  const history = []
  for (let i = 0; i < 12; i++) {
    const owed = owedMedia(HALF, PAIR, history)
    if (!owed.includes('music') && owed.includes('stretch')) history.push('stretch')
    else history.push(owed[0])
  }
  return history.join(',')
})())
// The real-game weighting, walked greedily: the thing the user actually asked for.
t('mostly music really does come out mostly music', (() => {
  const live = ['music', 'stretch', 'exercise', 'movement']
  const history = []
  for (let i = 0; i < 20; i++) history.push(owedMedia(MOSTLY_MUSIC, live, history)[0])
  const music = history.filter(m => m === 'music').length
  return music / 20 > 0.6
})(), (() => {
  const live = ['music', 'stretch', 'exercise', 'movement']
  const history = []
  for (let i = 0; i < 20; i++) history.push(owedMedia(MOSTLY_MUSIC, live, history)[0])
  return history.filter(m => m === 'music').length + '/20 music'
})())
t('a muted medium is never owed',
  !owedMedia(MOSTLY_MUSIC, ALL_MEDIA, []).includes('scene'))
// Enforcement is opt-in. An untouched game must play exactly as it did before any
// of this existed, which also keeps the identical-prompt guarantee below true.
t('an untouched tuning restricts nothing',
  owedMedia(TU({}), ALL_MEDIA, Array(9).fill('stretch')).length === ALL_MEDIA.length)
t('an axis alone is not a proportion', (() => {
  const axisOnly = TU({ axes: { friction: 4 } })
  return !isProportioned(axisOnly) &&
    owedMedia(axisOnly, ALL_MEDIA, Array(9).fill('stretch')).length === ALL_MEDIA.length
})())
// A perfectly balanced branch owes nobody. The guarantee that a legal turn
// carries a real reply outranks a proportion, exactly as it outranks a scope.
t('never empty, even when nothing is owed', (() => {
  const even = TU({ shares: { music: 50, stretch: 50 } }, PAIR)
  return owedMedia(even, PAIR, ['music', 'stretch']).length > 0
})())
t('ordering is heaviest share first',
  owedMedia(MOSTLY_MUSIC, ['stretch', 'music'], [])[0] === 'music')

// The strongest form of the claim, and the one that matters: the proportion has
// to hold against a model that is *actively* biased the wrong way. It was —
// composed media cannot miss and the retry prompt called them the safest answer,
// so the interpreter reached for a stretch whenever a search looked like work.
// Here the simulated model always picks the LEAST-weighted medium it is allowed,
// which is the worst case, and the ratio still comes out because exclusion is
// absolute rather than persuasive.
const walk = (tuning, live, turns, pick) => {
  const history = []
  for (let i = 0; i < turns; i++) {
    const owed = owedMedia(tuning, live, history)
    history.push(pick(owed))
  }
  return history
}
const worst = owed => owed[owed.length - 1]
const LIVE4 = ['music', 'stretch', 'exercise', 'movement']

group('the reported bug — mostly music must not come out mostly stretches')
t('an adversarial model still cannot exceed its share in stretches', (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, worst)
  const composed = h.filter(m => m !== 'music').length
  return composed / h.length < 0.4
})(), (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, worst)
  return `${h.filter(m => m !== 'music').length}/24 not music`
})())
t('and music gets most of the turns even so', (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, worst)
  return h.filter(m => m === 'music').length / h.length > 0.6
})(), (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, worst)
  return `${h.filter(m => m === 'music').length}/24 music`
})())
// The measured failure was 57% stretch against a 15 share. Under the old code the
// filter did not exist, so this is the assertion that would have caught it.
t('no single low-share medium runs away with the chain', (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, worst)
  return LIVE4.filter(m => m !== 'music')
    .every(m => h.filter(x => x === m).length / h.length < 0.25)
})())
// Every medium the player left open must still appear — a filter that silenced
// the small shares entirely would be a different bug with the same shape.
t('the small shares are not starved to nothing', (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, worst)
  return LIVE4.every(m => h.includes(m))
})())
t('a greedy model lands on the ratio from the other side', (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, owed => owed[0])
  const music = h.filter(m => m === 'music').length / h.length
  return music > 0.6 && music < 0.85
})(), (() => {
  const h = walk(MOSTLY_MUSIC, LIVE4, 24, owed => owed[0])
  return `${h.filter(m => m === 'music').length}/24 music`
})())

group('shareStandings — what the panel and the prompt both read')
t('actual and target are both reported', (() => {
  const st = shareStandings(HALF, PAIR, ['music', 'stretch'])
  const m = st.find(x => x.medium === 'music')
  return m.actual === 1 && Math.abs(m.target - 0.85) < 1e-9 && Math.abs(m.actualShare - 0.5) < 1e-9
})())
t('an empty history reports a zero actual share',
  shareStandings(HALF, PAIR, []).every(s => s.actualShare === 0))
t('allShares covers every medium in play',
  allShares(TU({}), ALL_MEDIA).length === ALL_MEDIA.length)

group('a mute is refused, and refused distinguishably')
t('a muted medium is refused even when the model names it exactly', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'artwork', query: 'Someone — Something', framing: 'f' } },
    ALL_MEDIA, ALL_RELATIONS, { muted: ['artwork'] })
  return r.reply === null && r.replyRejection?.reason === 'muted-medium'
})())
t('a muted medium is refused through an alias too', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'painting', query: 'Someone — Something', framing: 'f' } },
    ALL_MEDIA, ALL_RELATIONS, { muted: ['artwork'] })
  return r.replyRejection?.reason === 'muted-medium'
})())
// The player did this, deliberately, probably a moment ago. Reading it as a bug in
// the prompt would send someone hunting for a defect that is not there.
t('a mute is not reported as an unknown medium', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'artwork', query: 'x — y', framing: 'f' } },
    ALL_MEDIA, ALL_RELATIONS, { muted: ['artwork'] })
  return r.replyRejection?.reason !== 'unknown-medium'
})())
t('every rejection reason still has readable copy', (() => {
  const cases = [
    { reason: 'absent' }, { reason: 'unknown-medium', written: 'mime' },
    { reason: 'no-query', medium: 'music' }, { reason: 'unperformable', medium: 'gesture' },
    { reason: 'muted-medium', medium: 'artwork' },
  ]
  return cases.every(c => typeof describeRejection(c) === 'string' && describeRejection(c).length > 0)
})())

group('dueMedium — still computed, now only as a statement')
// It used to be the entire enforcement mechanism and it was not enough: a nudge
// that ends "do not force it" is one a model declines. It survives as the sentence
// that tells the interpreter WHY a medium is in its (already filtered) enum.
const EVEN = TU({ shares: { music: 100, artwork: 33 } }, ['music', 'artwork'])
t('nothing is due with no history', dueMedium(EVEN, [], ['music', 'artwork']) === null)
t('art comes due after a run of music',
  dueMedium(EVEN, ['music', 'music', 'music', 'music', 'music', 'music'], ['music', 'artwork']) === 'artwork')
t('nothing is due when the balance holds',
  dueMedium(EVEN, ['music', 'music', 'music', 'artwork'], ['music', 'artwork']) === null)
t('a rounding-sized shortfall says nothing',
  dueMedium(EVEN, ['music', 'music'], ['music', 'artwork']) === null)
t('a muted medium never comes due',
  dueMedium(TU({ shares: { artwork: 0 } }), Array(8).fill('music'), ['music', 'artwork']) === null)
t('one medium in play is never short of itself',
  dueMedium(EVEN, Array(8).fill('music'), ['music']) === null)

group('shareLabel — the word is derived from the number, not the other way round')
t('zero is never', shareLabel(0) === 'never')
t('low is rarely', shareLabel(15) === 'rarely')
t('the default is freely', shareLabel(DEFAULT_SHARE) === 'freely')
t('full is mostly', shareLabel(SHARE_MAX) === 'mostly')

group('describeTuning — every sentence comes from the registry')
t('a neutral tuning says nothing at all', describeTuning(TU({}), ALL_MEDIA) === '')
const described = describeTuning(MOSTLY_MUSIC, ALL_MEDIA)
t('the preferred medium is named', described.includes('Music'))
// The proportions reach the model AS proportions. The old version translated them
// into "by preference" and "only occasionally", which is how a 12% share came to
// be described to the interpreter as the medium to answer in by default.
t('the actual percentages are stated', /Music 6[0-9]%/.test(described), described.split('\n')[1])
t('and it is told they are enforced rather than requested',
  /enforced, not requested/.test(described))
t('the muted media are forbidden outright', /Do not answer in these/.test(described))
// Turning a medium off must not read as "the player cannot play it" — they can,
// and a game that silently stopped accepting their moves would be a worse product
// than one that ignored the setting.
t('a muted medium is still the player\'s to play', /player may still play them/.test(described))
// Nostalgia is the axis where this can go wrong: "lean older" must not become
// "a shared decade is a connection", which is the metadata reasoning this section
// removed on purpose.
t('the metadata guard is restated with the weighting', /coincidence of filing/.test(described))
t('an axis contributes its own stop text', (() => {
  const d = describeTuning(TU({ axes: { nostalgia: 4 } }), ALL_MEDIA)
  return d.includes(TUNING_AXES.nostalgia.stops[4].slice(0, 40))
})())
t('a resting axis contributes nothing', (() => {
  const d = describeTuning(TU({ axes: { nostalgia: 4 } }), ALL_MEDIA)
  return !d.includes('Obliquity') && !d.includes('Friction')
})())
t('the summary is empty when neutral', tuningSummary(TU({}), ALL_MEDIA) === '')
t('the summary names what was changed, as percentages', (() => {
  const s = tuningSummary(MOSTLY_MUSIC, ALL_MEDIA)
  return /6[0-9]% music/.test(s) && /no /.test(s)
})(), tuningSummary(MOSTLY_MUSIC, ALL_MEDIA))

group('the system prompt carries the weighting, and only when there is one')
const replyEnum = p => JSON.parse(p.match(/"medium": (\[[^\]]*\])/)[1])
t('a neutral tuning changes nothing about the prompt',
  buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, DEFAULT_TUNING) ===
  buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS))
t('the reply enum is every medium when nothing is muted',
  replyEnum(buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)).length === ALL_MEDIA.length)
t('a muted medium is absent from the reply enum',
  !replyEnum(buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, TU({ shares: { artwork: 0 } }))).includes('artwork'))
t('muting does not remove the medium from the board', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, TU({ shares: { artwork: 0 } }))
  return /artwork \(Art\)/.test(p)
})())
// The enforcement seam: whatever the caller worked out is owed this turn IS the
// enum. A medium over its share is not merely discouraged, it is unnameable.
t('the proportions filter becomes the reply enum', (() => {
  const e = replyEnum(buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, MOSTLY_MUSIC, false, ['music']))
  return e.length === 1 && e[0] === 'music'
})())
t('an over-share medium cannot be answered in even via an alias', (() => {
  const r = ni({ reading: 'r', reply: { medium: 'dance', query: 'x', framing: 'f' } }, ['music'])
  return r.reply === null
})())
t('omitting the filter leaves the enum as it was',
  replyEnum(buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)).length === ALL_MEDIA.length)
t('the weighting block is present when weighted', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, MOSTLY_MUSIC)
  return /HOW THE PLAYER HAS WEIGHTED YOU/.test(p)
})())
t('a link field is always offered', /"link":/.test(buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)))
t('the prompt explains that the game is a graph',
  /graph, not a line/i.test(buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)))
t('the prompt separates the binding path from what happened elsewhere', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)
  return /THE PATH/.test(p) && /ELSEWHERE/.test(p)
})())
// The knowledge media are the only ones where a bad query does not produce a
// visible miss, so they are the only ones that get told what shape a query is.
t('the knowledge media are told to name, not describe', (() => {
  const p = buildSystemPrompt(GAMES.tag, ['organism'], ALL_RELATIONS)
  return /NAME THEM, DO NOT DESCRIBE THEM/.test(p) &&
    /name a member, never the class/.test(p) &&
    /article about the \*category\*/.test(p)
})())
t('a game without them is not told any of that',
  !/NAME THEM, DO NOT DESCRIBE THEM/.test(buildSystemPrompt(GAMES.tag, ['music', 'artwork'], ALL_RELATIONS)))
t('the attribution form is not offered for a medium that has no author',
  !/"query": "Attribution — Title +\(/.test(buildSystemPrompt(GAMES.tag, ['organism'], ALL_RELATIONS)))
t('and is still offered for the media that do',
  /"query": "Attribution — Title +\(/.test(buildSystemPrompt(GAMES.tag, ['music'], ALL_RELATIONS)))

group('the retry prompt recommends only what is actually on the table')
// The bug: this prompt listed the available media correctly and then advised
// naming "a famous recording, a famous painting" and composing a gesture —
// unconditionally. In a session narrowed to Life that is advice to answer in three
// media that are not there, so the retry answered off-list, was refused, and the
// turn fell through to the server's salvage search. A corrective prompt that
// recommends the impossible is worse than no corrective prompt.
const retry = media => buildRetryPrompt({
  game: GAMES.tag, media, relations: ALL_RELATIONS, move: mv, previous: null,
  problem: 'nothing real matched what you named', attempted: 'something', reading: 'a reading',
})
t('a one-medium retry does not mention a famous recording',
  !/famous recording/.test(retry(['organism'])))
t('a one-medium retry does not offer to compose a gesture',
  !/composed medium/.test(retry(['organism'])))
t('it says instead that there is nowhere else to go',
  /only medium open to you/.test(retry(['organism'])))
t('a retry into music still reaches for the obvious',
  /famous recording/.test(retry(['music', 'artwork'])))
t('a retry with composed media still offers to author one',
  /composed medium \(gesture/.test(retry(['gesture', 'movement'])))
t('a retry with every medium offers all three kinds of advice', (() => {
  const p = retry(ALL_MEDIA)
  return /famous recording/.test(p) && /composed medium/.test(p) && /the query is a NAME/.test(p)
})())
t('a knowledge retry is told to name one creature',
  /the query is a NAME/.test(retry(['organism'])) && /never "species"/.test(retry(['organism'])))
t('a retry with no knowledge medium is not',
  !/the query is a NAME/.test(retry(['music'])))
t('the media list is always stated exactly',
  /exactly one of: organism, place/.test(retry(['organism', 'place'])))

group('the salvage account — prose that agrees with the record that landed')
// A salvaged turn used to be stored wearing the first pass's narration, carried and
// lost, all of which describe the reply the interpreter *planned*. That is the one
// place this engine asserted something untrue about what is on the table.
const salvaged = { medium: 'organism', id: 'wiki:organism:1', title: 'Grackle', attribution: null,
  framing: 'The creature', perceptible: { kind: 'text', body: 'Grackles are birds.' },
  sourceUrl: null, origin: 'catalogue', meta: {} }
const account = buildSalvageAccountPrompt({ move: mv, reply: salvaged, reading: 'the reading stands' })
t('it says the reply was not the interpreter\'s choice', /was not your choice/.test(account))
t('it carries the move and the record that landed',
  /Diaphanous/.test(account) && /Grackle/.test(account))
t('it keeps the reading rather than re-asking for one', /unchanged — this still stands/.test(account))
t('it forbids describing the answer that got away', /do not describe the answer you wanted/.test(account))
t('it permits "nothing connects these" as an answer', /a found record that answers nothing is an honest outcome/.test(account))
t('it asks for exactly the three fields that describe a crossing', (() => {
  const fields = [...account.matchAll(/^ {2}"(\w+)":/gm)].map(m => m[1])
  return fields.join(',') === 'narration,carried,lost'
})(), [...account.matchAll(/^ {2}"(\w+)":/gm)].map(m => m[1]).join(','))
t('it does not re-open the verdict', !/verdict/.test(account))

// ---------------------------------------------------------------------------
// The knowledge media
// ---------------------------------------------------------------------------

group('the knowledge media — catalogued, because a theorem can be WRONG')
// The design claim this group exists to defend: performability is the wrong guard
// for a proposition. Vague mush is catchable; a fluent, specific, incorrect
// statement of Noether's theorem is not. So these must be looked up, never authored.
t('four knowledge media are registered', KNOWLEDGE_MEDIA.length === 4)
t('every one is in the medium registry', KNOWLEDGE_MEDIA.every(m => !!getMedium(m)),
  KNOWLEDGE_MEDIA.filter(m => !getMedium(m)).join(', '))
t('every one is catalogued, never composed', KNOWLEDGE_MEDIA.every(m => getMedium(m).origin === 'catalogue'),
  KNOWLEDGE_MEDIA.filter(m => getMedium(m).origin !== 'catalogue').join(', '))
t('none of them is composed', KNOWLEDGE_MEDIA.every(m => !isComposed(m)))
t('every one is marked propositional', KNOWLEDGE_MEDIA.every(m => isPropositional(m)))
t('the propositional media are exactly the knowledge media',
  MEDIUM_LIST.filter(m => m.propositional).length === KNOWLEDGE_MEDIA.length)
// A composed medium is authored, so marking one propositional would be claiming the
// interpreter may assert facts outright — the exact thing this guard forbids.
t('no composed medium is propositional',
  !MEDIUM_LIST.some(m => m.origin === 'composed' && m.propositional))
t('none of them depends on the player\'s library',
  KNOWLEDGE_MEDIA.every(m => !getMedium(m).dependsOnUserLibrary))
// Which also means they are safe retry targets, and that strengthens the
// guarantee that a legal turn always carries a real reply.
t('a retry may land in a knowledge medium',
  KNOWLEDGE_MEDIA.every(m => replyMediaFor(ALL_MEDIA).includes(m)))
t('none of them needs a credential', KNOWLEDGE_MEDIA.every(m => !getMedium(m).requiresEnv))
t('they are available on a keyless deployment',
  KNOWLEDGE_MEDIA.every(m => availableMedia({}).includes(m)))
t('isKnowledge agrees with the registry', KNOWLEDGE_MEDIA.every(m => isKnowledge(m)))
t('isKnowledge refuses a medium it does not resolve',
  !isKnowledge('music') && !isKnowledge('gesture') && !isKnowledge('nonsense'))
t('none of them is physical', KNOWLEDGE_MEDIA.every(m => !getMedium(m).physical))
t('each has its own plural', new Set(KNOWLEDGE_MEDIA.map(m => getMedium(m).plural)).size === 4)

group('scope — curation, not honesty: a rejected page is still a real page')
const page = (title, cats = [], extract = '') => ({ title, extract, categories: cats.map(title => ({ title })) })
t('a theorem page is in theorem scope',
  inScope('theorem', page('Noether\'s theorem', ['Category:Theorems in physics'])))
t('a category match is enough',
  inScope('theorem', page('Symmetry', ['Category:Mathematical concepts'])))
t('a title match is enough',
  inScope('theorem', page('Pythagorean theorem', ['Category:Euclidean geometry'])))
t('an extract match is enough',
  inScope('phenomenon', page('Aurora', ['Category:Sky'], 'An optical phenomenon in the sky.')))
t('an unrelated page is out of theorem scope',
  !inScope('theorem', page('Cat', ['Category:Domesticated animals'], 'The cat is a domestic species.')))
t('that same page is in organism scope',
  inScope('organism', page('Cat', ['Category:Domesticated animals'], 'The cat is a domestic species.')))
t('a place is in place scope',
  inScope('place', page('Mount Erebus', ['Category:Volcanoes of Antarctica'])))
t('a place is not a theorem',
  !inScope('theorem', page('Mount Erebus', ['Category:Volcanoes of Antarctica'])))
t('an unknown medium is never in scope', !inScope('music', page('Anything', ['Category:Theorems'])))
t('a page with nothing to match is out of scope', !inScope('theorem', page('', [], '')))

group('scope — a member of the medium, not the article about the medium')
// The bug this group exists to defend against, observed in production 2026-10-03.
// A Life-only game of Tag answered a common grackle with the Wikipedia article
// *Species*. Nothing was broken: the page is real, and it passes a pattern built
// out of the words "species", "taxonomy" and "organism" more easily than any actual
// creature does. The pattern cannot refuse it, because the pattern is made of what
// it is about. So the medium's own vocabulary is refused by title, and the scopes
// whose members are concrete things have to see a member in the opening sentence.
const wiki = (title, extract, cats = ['Category:Biology']) => page(title, cats, extract)

t('the article "Species" is not an organism',
  !inScope('organism', wiki('Species', 'A species is the basic unit of classification and a taxonomic rank of an organism, as well as a unit of biodiversity.')))
t('nor is "Organism"',
  !inScope('organism', wiki('Organism', 'An organism is any living thing that functions as an individual.')))
t('nor is the medium\'s own grammar',
  !inScope('organism', wiki('Taxonomy (biology)', 'Taxonomy is the practice of naming and classifying groups of organisms.')) &&
  !inScope('organism', wiki('Binomial nomenclature', 'Binomial nomenclature is a formal system of naming species of living things.')))
// These are the near misses — essays that name a creature within a few words of a
// copula. "is the ability of an animal" and "is a bird" are not the same sentence,
// and the difference is the word "of".
t('an essay that mentions creatures is not a creature',
  !inScope('organism', wiki('Crypsis', 'In ecology, crypsis is the ability of an animal or a plant to avoid observation or detection by other animals.')) &&
  !inScope('organism', wiki('Camouflage', 'Camouflage is the use of any combination of materials, coloration, or illumination for concealment, either by making animals hard to see.')) &&
  !inScope('organism', wiki('Convergent evolution', 'Convergent evolution is the independent evolution of similar features in species of different periods or epochs in time.')))
t('a grackle is',
  inScope('organism', wiki('Common grackle', 'The common grackle (Quiscalus quiscula) is an icterid bird found in large numbers through much of North America.')))
t('so is a creature named only by its title',
  inScope('organism', wiki('Anglerfish', 'The anglerfish are ray-finned fish in the order Lophiiformes.')))
t('so is one whose opening names a collective of creatures',
  inScope('organism', wiki('Sea angel', 'Sea angels (clade Gymnosomata) are a large group of small free-swimming sea slugs, classified into six separate families.')))
t('so is one framed taxonomically rather than by common name',
  inScope('organism', wiki('Linophryne arborifera', 'Linophryne arborifera is a species of deep-sea anglerfish in the family Linophrynidae.')))
// Same shape in the place scope: the encyclopedia has an article called *Geography*.
t('the article "Geography" is not a place',
  !inScope('place', page('Geography', ['Category:Geography'], 'Geography is the study of the lands, features, inhabitants and phenomena of Earth.')))
t('a volcano is', inScope('place', page('Mount Erebus', ['Category:Volcanoes of Antarctica'])))
t('an index is never an offering in any medium',
  !inScope('organism', wiki('List of birds', 'This article lists living orders and families of birds.')) &&
  !inScope('theorem', page('List of theorems', ['Category:Mathematics theorems'])) &&
  !inScope('place', page('Mount Erebus (disambiguation)', ['Category:Volcanoes'])))
// A theorem and a phenomenon *are* abstractions, so there is no member test to run
// on them — only the vocabulary refusal. This asserts the asymmetry is deliberate.
t('an abstraction is still a perfectly good theorem',
  inScope('theorem', page('Symmetry', ['Category:Mathematical concepts'])))
t('and a perfectly good phenomenon',
  inScope('phenomenon', page('Quantum entanglement', ['Category:Quantum mechanics'], 'Quantum entanglement is the phenomenon of a group of particles sharing spatial proximity.')))
t('but the name of the field is not',
  !inScope('phenomenon', page('Physics', ['Category:Physics'], 'Physics is the scientific study of matter.')) &&
  !inScope('theorem', page('Mathematics', ['Category:Mathematics'], 'Mathematics is a field of study.')))

group('scope — a person is not a theorem, and a film is not a phenomenon')
// The larger half of the same bug, and it hits the other three scopes harder than
// the organism one. Every scope's pattern is tested against the whole extract and
// all the categories, and Wikipedia is an encyclopedia — so a mathematician's
// biography is in the theorem scope because it says "mathematician", and a
// businessman's is in the place scope because it says where he is from. Probed
// against the live API 2026-10-03: "something about symmetry giving you
// conservation" returned Emmy Noether, "light produced by a living thing" returned
// The Thing (1982 film), and "a place whose silence is its subject" returned Jeff
// Bezos. One gate in front of all four scopes, because all three are the same shape.
const person = (title, opening, cats = []) => page(title, cats, opening)

t('a mathematician is not a theorem',
  !inScope('theorem', person('Emmy Noether', 'Amalie Emmy Noether (23 March 1882 – 14 April 1935) was a German mathematician who made many important contributions to abstract algebra.')))
t('nor is one whose dates are a birth alone',
  !inScope('theorem', person('Andrew Wiles', 'Sir Andrew John Wiles (born 11 April 1953) is an English mathematician who proved Fermat\'s Last Theorem.')))
t('a naturalist is not an organism',
  !inScope('organism', person('Charles Darwin', 'Charles Robert Darwin (12 February 1809 – 19 April 1882) was an English naturalist and biologist known for his theory of evolution by natural selection.')))
t('a businessman is not a place',
  !inScope('place', person('Jeff Bezos', 'Jeffrey Preston Bezos (born January 12, 1964) is an American businessman and the founder of Amazon, in Seattle.')))
t('the person gate does not need the categories to arrive', (() => {
  // Under the API's continuation limits a page sometimes comes back with no
  // categories at all, which is how two biographies reached a live game.
  const p = person('Ted Kaczynski', 'Theodore John Kaczynski (May 22, 1942 – June 10, 2023) was an American mathematician and domestic terrorist.', [])
  return !inScope('theorem', p) && !inScope('phenomenon', p)
})())
t('a birth category alone is also enough',
  !inScope('organism', person('Someone', 'Someone studies birds and their species.', ['Category:1964 births', 'Category:Ornithologists'])))

t('a film is not a phenomenon',
  !inScope('phenomenon', page('The Thing (1982 film)', ['Category:1982 films'], 'The Thing is a 1982 American science fiction horror film directed by John Carpenter.')))
t('a novel is not a place',
  !inScope('place', page('Watership Down', ['Category:1972 British novels'], 'Watership Down is an adventure novel by English author Richard Adams, set in the hills of Hampshire.')))
t('a fictional planet is not a place',
  !inScope('place', page('Geonosis', [], 'Geonosis is a desert planet in the fictional universe of Star Wars, located in the Outer Rim.')))
t('a people is not a place',
  !inScope('place', page('Goths', ['Category:Early Germanic peoples'], 'The Goths were a Germanic people who played a major role in the fall of the Western Roman Empire.')))
t('nor is one that says so only in its title',
  !inScope('place', page('Sea Peoples', [], 'The Sea Peoples were a purported seafaring confederation that attacked ancient Egypt.')))

// A field is the drawer, not the thing in it — and the scopes overlap, so each
// scope's own vocabulary list could not have covered the others'.
t('the name of a field is refused by every scope',
  !inScope('theorem', page('Scientific method', ['Category:Scientific method'], 'The scientific method is an empirical method for acquiring knowledge.')) &&
  !inScope('phenomenon', page('Photography', ['Category:Optics'], 'Photography is the art and practice of creating images by recording light.')) &&
  !inScope('organism', page('Zoology', ['Category:Biology'], 'Zoology is the scientific study of animals.')) &&
  !inScope('place', page('Cartography', ['Category:Geography'], 'Cartography is the study and practice of making maps.')))
t('an "Introduction to X" is an article about a topic, not an offering',
  !inScope('theorem', page('Introduction to gauge theory', ['Category:Mathematical physics'], 'A gauge theory is a type of field theory in physics.')))

// The things that must survive all of that.
t('a theorem is still a theorem',
  inScope('theorem', page('Hairy ball theorem', ['Category:Theorems in topology'], 'The hairy ball theorem of algebraic topology states that there is no nonvanishing continuous tangent vector field on even-dimensional n-spheres.')))
t('an effect is still a phenomenon',
  inScope('phenomenon', page('Doppler effect', ['Category:Wave mechanics'], 'The Doppler effect is the change in the frequency of a wave in relation to an observer who is moving relative to the source.')))
t('a creature named after a person is still a creature',
  inScope('organism', page('Darwin\'s finches', ['Category:Birds of the Galápagos Islands'], 'Darwin\'s finches are a group of about 18 species of passerine birds.')))
t('a place named after a person is still a place',
  inScope('place', page('Mount Erebus', ['Category:Volcanoes of Antarctica'], 'Mount Erebus is the second-highest volcano in Antarctica.')))

group('firstSentence — the clause where a page says what it is')
t('a plain sentence is taken whole',
  firstSentence('An organism is any living thing. It functions as an individual.')
    === 'An organism is any living thing.')
t('an abbreviation does not end a sentence',
  firstSentence('A species (pl. species) is the basic unit of classification. It can be defined otherwise.')
    === 'A species (pl. species) is the basic unit of classification.')
t('a single sentence with no follower is still returned',
  firstSentence('The anglerfish are ray-finned fish in the order Lophiiformes.')
    === 'The anglerfish are ray-finned fish in the order Lophiiformes.')
t('whitespace is collapsed first', firstSentence('one\n\n  two. Three.') === 'one two.')
t('nothing in yields nothing out', firstSentence('') === '' && firstSentence(null) === '')
// The point of taking one sentence: an essay reaches its creatures later, and a
// member test over the whole intro would admit it.
t('a later sentence is not part of the opening',
  !firstSentence('Camouflage is the use of materials for concealment. Many animals are birds.').includes('bird'))

group('trimExtract — long enough to carry a statement, short enough to be eight of them')
t('a short extract is untouched', trimExtract('Short and done.') === 'Short and done.')
t('whitespace is collapsed', trimExtract('one\n\n  two   three') === 'one two three')
t('a long extract is cut', trimExtract('x'.repeat(900)).length <= 601)
t('a sentence boundary is preferred', (() => {
  const text = `${'a'.repeat(450)}. ${'b'.repeat(400)}`
  return trimExtract(text).endsWith('.')
})())
t('a boundary too early is ignored in favour of an ellipsis', (() => {
  // The only full stop is in the first fifth, so honouring it would throw away
  // most of what was asked for.
  const text = `Tiny. ${'b'.repeat(900)}`
  return trimExtract(text).endsWith('…')
})())
t('a word is never cut in half', (() => {
  const trimmed = trimExtract(`${'word '.repeat(300)}`)
  return !/\bwor…$/.test(trimmed)
})())

group('the prompt treats a proposition differently from a record')
t('the interpreter is told not to write out what a theorem says', (() => {
  // Line breaks fall wherever the paragraph wraps, so match on the flattened text.
  const flat = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS).replace(/\s+/g, ' ')
  return /do NOT write out what it says/.test(flat)
})())
t('and it names which media that applies to', (() => {
  const flat = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS).replace(/\s+/g, ' ')
  return /Mathematics, Science, Life, Places work the same way/.test(flat)
})())
t('it says why: a wrong answer there does not look wrong', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS)
  return /does not look wrong/.test(p)
})())
t('the warning is absent when no propositional medium is in play', (() => {
  const p = buildSystemPrompt(GAMES.tag, ['music', 'artwork'], ALL_RELATIONS)
  return !/does not look wrong/.test(p)
})())
// An interpreter given only a title reasons about the title and guesses the
// content, which is precisely what these media exist to prevent.
t('a theorem carries its statement into the prompt', offeringLine({
  medium: 'theorem', id: 'wiki:theorem:1', title: 'Noether\'s theorem', attribution: null,
  framing: 'the statement itself',
  perceptible: { kind: 'text', body: 'Every differentiable symmetry has a conservation law.' },
  sourceUrl: null, origin: 'catalogue', meta: { kind: 'mathematics' },
}).includes('conservation law'))
t('a composed offering still shows steps rather than a doubled body', (() => {
  const line = offeringLine({
    medium: 'gesture', id: 'composed:gesture:x', title: 'The reach', attribution: null,
    framing: 'the stopping', steps: ['Extend one arm', 'Stop it dead'], intent: 'shown',
    perceptible: { kind: 'text', body: 'Extend one arm / Stop it dead' },
    sourceUrl: null, origin: 'composed', meta: {},
  })
  return line.includes('steps:') && !line.includes('text:')
})())

group('aliases reach the knowledge media too')
const niKnow = (written) => ni({
  reading: 'r', reply: { medium: written, query: 'Noether — theorem', framing: 'f' },
})
t('"math" resolves to theorem', niKnow('math')?.reply?.medium === 'theorem')
t('"science" resolves to phenomenon', niKnow('science')?.reply?.medium === 'phenomenon')
t('"fact" resolves to phenomenon', niKnow('fact')?.reply?.medium === 'phenomenon')
t('"species" resolves to organism', niKnow('species')?.reply?.medium === 'organism')
t('"city" resolves to place', niKnow('city')?.reply?.medium === 'place')
t('an alias cannot smuggle in a knowledge medium the game disabled',
  ni({ reading: 'r', reply: { medium: 'math', query: 'x', framing: 'f' } }, ['music'])?.reply === null)

// ---------------------------------------------------------------------------
// Self-reply — the partner answering its own offering
// ---------------------------------------------------------------------------

group('continuation registry — internal consistency')
t('the stops are 0 through the cap',
  CONTINUATION_STOPS.join() === [0, 1, 2, 3].join() &&
  CONTINUATION_STOPS[CONTINUATION_STOPS.length - 1] === MAX_SELF_REPLIES)
t('off is zero', CONTINUATION_OFF === 0)
t('every stop has a label and a hint',
  CONTINUATION_STOPS.every(s => CONTINUATION_LABELS[s]?.length > 0 && CONTINUATION_HINTS[s]?.length > 0))
// Same lint the games and the axes are held to: the retired "dial" must not come
// back in new player-visible copy.
t('no continuation copy mentions a dial', !/\bdial\b/i.test(
  [...Object.values(CONTINUATION_LABELS), ...Object.values(CONTINUATION_HINTS)].join(' ')))

group('moverOf — a row with no column is a player move')
t('null reads as player', moverOf(mkTurn({ id: 'm0' })) === 'player')
t('an explicit player reads as player', moverOf(mkTurn({ id: 'm1', move_by: 'player' })) === 'player')
t('partner reads as partner', moverOf(mkTurn({ id: 'm2', move_by: 'partner' })) === 'partner')
t('junk reads as player', moverOf(mkTurn({ id: 'm3', move_by: 'the dog' })) === 'player')
t('a missing turn reads as player', moverOf(null) === 'player')
t('isSelfReply agrees with moverOf',
  isSelfReply(mkTurn({ id: 'm4', move_by: 'partner' })) === true &&
  isSelfReply(mkTurn({ id: 'm5' })) === false)

group('selfRepliesSince — the cap is derived from the log, not from the request')
const RUN = [
  mkTurn({ id: 'c0', turn_index: 0 }),
  mkTurn({ id: 'c1', turn_index: 1, parent_turn_id: 'c0', move_by: 'partner' }),
  mkTurn({ id: 'c2', turn_index: 2, parent_turn_id: 'c1', move_by: 'partner' }),
]
const runGraph = buildGraph(RUN)
const runPath = pathTo(runGraph, 'c2')
t('a path of player turns has no run', selfRepliesSince(pathTo(forked, 't4')) === 0)
t('the trailing run is counted', selfRepliesSince(runPath) === 2)
t('what is left is the cap minus the run', selfRepliesLeft(runPath) === MAX_SELF_REPLIES - 2)
// The whole mechanism: the cap bounds a run, not a game. A player move anywhere
// resets it, which is why re-entering is what makes a run worth having.
t('a player move resets the run', (() => {
  const g = buildGraph([...RUN, mkTurn({ id: 'c3', turn_index: 3, parent_turn_id: 'c2' })])
  return selfRepliesSince(pathTo(g, 'c3')) === 0
})())
t('only the tail counts, not the total', (() => {
  const g = buildGraph([
    ...RUN,
    mkTurn({ id: 'd3', turn_index: 3, parent_turn_id: 'c2' }),
    mkTurn({ id: 'd4', turn_index: 4, parent_turn_id: 'd3', move_by: 'partner' }),
  ])
  return selfRepliesSince(pathTo(g, 'd4')) === 1
})())
// A move that was turned away is still a turn the partner spent. Skipping it would
// let a rejected self-reply buy an extra one.
t('an illegal self-reply still counts against the run', (() => {
  const g = buildGraph([
    mkTurn({ id: 'e0', turn_index: 0 }),
    mkTurn({ id: 'e1', turn_index: 1, parent_turn_id: 'e0', move_by: 'partner', legal: false }),
  ])
  return selfRepliesSince(pathTo(g, 'e1')) === 1
})())
t('the run is a property of the branch', (() => {
  // t2 and t3 both answer t1; a run down one branch is not a run down the other.
  const g = buildGraph([
    mkTurn({ id: 'f0', turn_index: 0 }),
    mkTurn({ id: 'f1', turn_index: 1, parent_turn_id: 'f0', move_by: 'partner' }),
    mkTurn({ id: 'f2', turn_index: 2, parent_turn_id: 'f0' }),
  ])
  return selfRepliesSince(pathTo(g, 'f1')) === 1 && selfRepliesSince(pathTo(g, 'f2')) === 0
})())

group('selfReplyRefusal — one sentence, shared by the server and the control')
t('nothing on the table is refused', !!selfReplyRefusal(null, []))
t('a turned-away parent is refused',
  !!selfReplyRefusal(mkTurn({ id: 'g0', legal: false }), []))
// A legal turn always carries a reply now, but rows written before that guarantee
// do not, and there is nothing in one for the partner to carry on from.
t('a parent with no answer of its own is refused',
  !!selfReplyRefusal(mkTurn({ id: 'g1', reply_offering: null }), []))
t('an ordinary exchange is allowed',
  selfReplyRefusal(mkTurn({ id: 'g2' }), []) === null)
t('the cap refuses, and says how many it took', (() => {
  const full = Array.from({ length: MAX_SELF_REPLIES }, (_, i) =>
    mkTurn({ id: `h${i + 1}`, turn_index: i + 1, parent_turn_id: `h${i}`, move_by: 'partner' }))
  const g = buildGraph([mkTurn({ id: 'h0', turn_index: 0 }), ...full])
  const why = selfReplyRefusal(g.nodes.get(`h${MAX_SELF_REPLIES}`).turn, pathTo(g, `h${MAX_SELF_REPLIES}`))
  return typeof why === 'string' && why.includes(String(MAX_SELF_REPLIES))
})())
t('one below the cap is still allowed', (() => {
  const g = buildGraph(RUN)
  return MAX_SELF_REPLIES === 3 && selfReplyRefusal(g.nodes.get('c2').turn, pathTo(g, 'c2')) === null
})())

group('continuation is stored like a tuning and told to nobody')
t('off is the default', continuationOf(TU({})) === CONTINUATION_OFF)
t('a value is kept', TU({ continuation: 2 }).continuation === 2)
t('it is clamped to the engine\'s own cap', TU({ continuation: 9 }).continuation === MAX_SELF_REPLIES)
t('a negative is clamped to off', TU({ continuation: -3 }).continuation === CONTINUATION_OFF)
t('junk is off', TU({ continuation: 'lots' }).continuation === CONTINUATION_OFF)
t('a numeric string is tolerated', TU({ continuation: '2' }).continuation === 2)
// The load-bearing one. A model told that a run of three is coming writes toward a
// monologue: it holds material back and stops answering the thing in front of it.
// So continuation is excluded from `isNeutral`, which is what the prompt gates on.
t('a continuation alone is still neutral to the interpreter', isNeutral(TU({ continuation: 3 })))
t('it changes nothing about the system prompt',
  buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, TU({ continuation: 3 })) ===
  buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, DEFAULT_TUNING))
t('it contributes no weighting block',
  describeTuning(TU({ continuation: 3 }), ALL_MEDIA) === '')
// Checked against the player-facing copy rather than the word "continuation",
// which is also the name of a relation and legitimately all over the prompt.
t('none of its player-facing copy reaches the prompt', (() => {
  const p = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, TU({ continuation: 3 }))
  return Object.values(CONTINUATION_HINTS).every(h => !p.includes(h))
})())
// But the player did set it, so their own display says so and a reset button has
// something to reset. That is the isNeutral / isUntouched split.
t('it is not untouched', !isUntouched(TU({ continuation: 1 })))
t('nothing set at all is untouched', isUntouched(TU({})))
t('the summary names it', /carries on/.test(tuningSummary(TU({ continuation: 2 }), ALL_MEDIA)),
  tuningSummary(TU({ continuation: 2 }), ALL_MEDIA))
t('the summary still names the weighting alongside it', (() => {
  const s = tuningSummary(TU({ shares: { music: 100 }, continuation: 1 }), ALL_MEDIA)
  return /% music/.test(s) && /carries on/.test(s)
})())

group('the self-reply prompt — reading your own offering as the move')
const SELF_SYS = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, DEFAULT_TUNING, true)
const PLAIN_SYS = buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS, DEFAULT_TUNING, false)
t('a player turn is unchanged by the flag existing',
  PLAIN_SYS === buildSystemPrompt(GAMES.tag, ALL_MEDIA, ALL_RELATIONS))
t('the self-reply section is present', /ANSWERING YOURSELF/.test(SELF_SYS))
t('and absent otherwise', !/ANSWERING YOURSELF/.test(PLAIN_SYS))
// The failure this text exists to prevent: treating the turn as a second attempt
// at the same answer rather than as a turn.
t('it refuses a second go at the same answer', /not another go at the same answer/i.test(SELF_SYS))
t('it refuses agreement with itself', /Do not agree with yourself/i.test(SELF_SYS))
t('reframing is offered in the schema', /"reframing":/.test(SELF_SYS))
t('reframing is not offered on a player turn', !/"reframing":/.test(PLAIN_SYS))
// Nobody claimed anything, so there is nothing to rule on — and an interpreter
// invited to judge its own offering is not a judge.
t('a strict game asks for no verdict on a self-reply',
  !/"verdict"/.test(SELF_SYS) && /"verdict"/.test(PLAIN_SYS))
t('the guidance says so in as many words', /not ruling on anything/i.test(SELF_REPLY_GUIDANCE))
// It must not know whether another turn is coming, so it never names a count:
// an interpreter told a run of three is under way writes toward a monologue.
t('the guidance never names a count',
  !/\d/.test(SELF_REPLY_GUIDANCE) && !/\b(once|twice|three times)\b/i.test(SELF_REPLY_GUIDANCE))

const selfUser = (over = {}) => buildUserPrompt({
  game: GAMES.tag, media: ALL_MEDIA, relations: ALL_RELATIONS, world: {},
  history: [], move: off('x'), previous: null, claimedRelation: null, spent: [],
  turnIndex: 4, selfReply: true, selfReplyFrom: 3, selfReplyDepth: 1, ...over,
})
t('the move is attributed to the partner', /YOUR OWN OFFERING, NOW THE MOVE/.test(selfUser()))
// The one false sentence it could contain, and the one most likely to be believed
// because every other turn it is true.
t('it never calls it the player\'s move', !/THE PLAYER'S MOVE/.test(selfUser()))
t('a player turn still does', /THE PLAYER'S MOVE/.test(buildUserPrompt({
  game: GAMES.tag, media: ALL_MEDIA, relations: ALL_RELATIONS, world: {},
  history: [], move: off('x'), previous: null, claimedRelation: null, spent: [], turnIndex: 4,
})))
t('it names the exchange the offering came from', /turn 3/.test(selfUser()))
t('a deeper run is stated as one', /turn 3 of a run you have taken alone/.test(
  selfUser({ selfReplyDepth: 3 })))
t('a first turn alone is not described as a run', !/run you have taken alone/.test(selfUser()))
// Belt and braces: the route passes previous: null, which skips the ruling by
// arithmetic. If a caller ever passed both, the ruling must still not appear.
t('the ruling is suppressed even if an offering on the table is supplied',
  !/RULING ON THE MOVE/.test(selfUser({ previous: off('y', 'artwork') })))
t('a player turn in the same game does get the ruling', /RULING ON THE MOVE/.test(buildUserPrompt({
  game: GAMES.tag, media: ALL_MEDIA, relations: ALL_RELATIONS, world: {},
  history: [], move: off('x'), previous: off('y', 'artwork'), claimedRelation: null,
  spent: [], turnIndex: 4,
})))
// A path may now hold turns the player took no part in, and an interpreter shown
// its own offering attributed to the player reads a conversation it was not having.
t('the path says who played each move', (() => {
  const p = selfUser({
    history: [
      { turn_index: 0, move_offering: off('p0'), reply_offering: off('p0r'), relation: 'association', reading: null, narration: null, carried: null },
      { turn_index: 1, move_offering: off('p1'), reply_offering: off('p1r'), relation: 'counterpoint', reading: null, narration: null, carried: null, move_by: 'partner' },
    ],
  })
  return /Turn 0: player offered/.test(p) && /Turn 1: you yourself offered/.test(p)
})())

group('reframing — what stops a self-reply being a restatement')
t('a reframing is kept', ni({ reading: 'r', reframing: 'the stopping' }).reframing === 'the stopping')
t('an absent one is empty', ni({ reading: 'r' }).reframing === '')
t('a non-string one is empty', ni({ reading: 'r', reframing: { part: 'x' } }).reframing === '')
t('it is trimmed', ni({ reading: 'r', reframing: '  the held note ' }).reframing === 'the held note')

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
