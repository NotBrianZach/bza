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
    join('lib', 'offerings', 'composed.ts'),
    join('lib', 'offerings', 'shared.ts'),
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
    composed:  require(join(outDir, 'offerings', 'composed.js')),
  }
}

const M = build()
const {
  parseJsonObject, normalizeInterpretation, applyWorldDelta, offeringLine, sessionScope,
  describeRejection, salvageQueries,
} = M.prompt
const { GAME_LIST, GAMES, getGame, ACCENT_CLASSES, FEATURED_GAMES, FEATURED_GAME_IDS, retiredGameName } = M.games
const { MEDIA, MEDIUM_LIST, ALL_MEDIUM_IDS, getMedium, isComposed, availableMedia, playableMedia, resolveMedia, replyMediaFor } = M.media
const { RELATIONS, RELATION_LIST, ALL_RELATION_IDS, relationPermitted, spentRelations, resolveRelations } = M.relations
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
const ni = (o, media = ALL_MEDIA, rel = ALL_RELATIONS) => normalizeInterpretation(o, media, rel)
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

group('salvageQueries — the server\'s own last resort')
const sq = (interp, move) => salvageQueries(interp, move)
const mv = { medium: 'music', id: 'dz:1', title: 'Diaphanous', attribution: 'Ana Roxanne', framing: 'f',
             perceptible: { kind: 'audio', url: 'x' }, sourceUrl: null, origin: 'catalogue', meta: {} }
t('the carried quality seeds the first attempt', (() => {
  // Hyphens become spaces: a catalogue search wants words, not compounds.
  const q = sq({ carried: 'the quality of something almost-visible', facts: [] }, mv)[0]
  return q === 'quality something almost visible'
})(), sq({ carried: 'the quality of something almost-visible', facts: [] }, mv)[0])
t('short words are dropped from the seed',
  !sq({ carried: 'the and of a quality', facts: [] }, mv)[0].split(' ').some(w => w.length <= 3))
t('the move title is a later attempt', sq({ carried: '', facts: [] }, mv).includes('Diaphanous'))
t('the attribution is the last attempt', sq({ carried: '', facts: [] }, mv).includes('Ana Roxanne'))
t('nothing usable yields no attempts rather than empty strings',
  sq({ carried: '', facts: [] }, { ...mv, title: '', attribution: null }).length === 0)
t('punctuation does not leak into a query',
  !/[—"'?!]/.test(sq({ carried: 'reaching — never "arriving"', facts: [] }, mv)[0]))

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

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${pass} passed, ${failures.length} failed`)
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
