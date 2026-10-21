#!/usr/bin/env node
/**
 * Unit checks for the suggested-feed pipeline.
 *
 * Same harness as tests/concepts-logic.mjs, same reason: the modules are
 * TypeScript, so they are transpiled to CommonJS in a temp dir with the
 * project's own `typescript` devDependency. This works only because every
 * cross-directory import in lib/suggest is `import type` — a runtime import of
 * `@/lib/...` would need path mapping this harness deliberately does not set up.
 *
 * WHAT IS COVERED: the whole decision surface, because the whole thing is pure.
 * Canonicalisation including the cases where it must NOT strip (an article id in
 * a query parameter); the three-signal similarity and the redistribution that
 * stops a config change from silently disabling dedup; that relevance and
 * quality cannot move each other; that the floor is applied before ranking
 * rather than as a penalty; and — the tests that matter most — that the bucket
 * mix survives a lopsided candidate pool, and that a short bucket is REPORTED
 * rather than quietly papered over.
 *
 * WHAT IS DELIBERATELY NOT HERE: whether the scoring weights are good, and
 * whether a cue list labels real articles correctly. The first is a preference,
 * not a fact — the spec says so, and a test asserting the defaults are right
 * would be asserting an opinion. The second needs a labelled corpus; the cue
 * tests here assert the mechanism (that a cue fires, and that its reason names
 * the text that fired it), not the taxonomy.
 *
 * Run: node tests/suggest-logic.mjs        (from frontend/)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const outDir = mkdtempSync(join(tmpdir(), 'suggest-logic-'))

function build() {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  const entries = [
    join('lib', 'suggest', 'normalize.ts'),
    join('lib', 'suggest', 'parse.ts'),
    join('lib', 'suggest', 'tags.ts'),
    join('lib', 'suggest', 'cluster.ts'),
    join('lib', 'suggest', 'score.ts'),
    join('lib', 'suggest', 'select.ts'),
    join('lib', 'suggest', 'feedback.ts'),
    join('lib', 'suggest', 'metrics.ts'),
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
  const load = name => require(join(outDir, 'suggest', name))
  return {
    normalize: load('normalize.js'),
    parse: load('parse.js'),
    tags: load('tags.js'),
    cluster: load('cluster.js'),
    score: load('score.js'),
    select: load('select.js'),
    feedback: load('feedback.js'),
    metrics: load('metrics.js'),
  }
}

const M = build()

// ── harness ──────────────────────────────────────────────────────────────────

let passed = 0
const failures = []
let current = ''

function test(name, fn) {
  current = name
  try {
    fn()
    passed++
  } catch (e) {
    failures.push(`${name}: ${e.message}`)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'assertion failed')
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg ?? current} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function near(actual, expected, tol, msg) {
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${msg ?? current} — expected ${expected} ± ${tol}, got ${actual}`)
  }
}

// ── fixtures ─────────────────────────────────────────────────────────────────

const NOW = '2026-10-21T12:00:00.000Z'

function feed(over = {}) {
  return {
    feedId: over.feedId ?? 'f1',
    url: over.url ?? 'https://example.com/feed.xml',
    name: over.name ?? 'Example',
    language: 'en',
    region: over.region ?? null,
    topicTags: over.topicTags ?? [],
    sourceType: over.sourceType ?? 'specialist',
    enabled: true,
    userDesignated: over.userDesignated ?? false,
  }
}

/**
 * An item built through the real classifiers rather than with hand-written
 * labels. A fixture that hard-codes `topicTags` tests the scorer against tags
 * the tagger would never have produced, and the two then drift apart silently.
 */
function item(over = {}) {
  const title = over.title ?? 'Grid batteries reach cost parity in Texas'
  const summary = over.summary ?? null
  const text = over.text ?? null
  const entry = M.normalize.normalizeEntry(
    {
      title,
      url: over.url ?? `https://example.com/${over.itemId ?? 'i1'}`,
      summary,
      content: text,
      // `in` rather than `??`, so a fixture can ask for an UNDATED item. With
      // `??` a deliberate `publishedAt: null` became NOW and the
      // missing-date freshness test silently asserted nothing.
      published: 'publishedAt' in over ? over.publishedAt : NOW,
      categories: over.declaredTags ?? [],
    },
    NOW,
  )
  return {
    itemId: over.itemId ?? 'i1',
    feedId: over.feedId ?? 'f1',
    canonicalUrl: entry.canonicalUrl,
    originalUrl: entry.originalUrl,
    title: entry.title,
    summary: entry.summary,
    publishedAt: entry.publishedAt,
    author: entry.author,
    text: entry.text,
    topicTags: M.tags.assignTopicTags({
      title: entry.headline,
      summary: entry.summary,
      text: entry.text,
      declaredTags: entry.declaredTags,
      feedTags: over.feedTags ?? [],
    }),
    entities: M.tags.extractEntities(entry.headline, entry.summary),
    articleType: over.articleType
      ? { value: over.articleType, reason: 'set by the fixture', confidence: 'declared' }
      : M.tags.classifyArticleType({ title: entry.headline, summary: entry.summary }),
    embedding: over.embedding ?? null,
    storyClusterId: null,
    contentHash: entry.contentHash,
  }
}

function interest(name, over = {}) {
  return {
    interestId: over.interestId ?? name.toLowerCase().replace(/\W+/g, '-'),
    name,
    kind: over.kind ?? 'topic',
    weight: over.weight ?? 1,
    parentInterestId: over.parentInterestId ?? null,
    explicitFeedback: over.explicitFeedback ?? false,
  }
}

function ctx(over = {}) {
  return {
    interests: over.interests ?? [interest('energy storage')],
    regions: over.regions ?? [],
    recentlyShown: over.recentlyShown ?? [],
    now: over.now ?? NOW,
    weights: over.weights,
    qualityFloor: over.qualityFloor,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// normalize
// ═══════════════════════════════════════════════════════════════════════════

test('canonicalUrl strips tracking params and sorts the rest', () => {
  eq(
    M.normalize.canonicalUrl('https://WWW.Example.com/a/b?utm_source=x&b=2&a=1&fbclid=zz'),
    'https://example.com/a/b?a=1&b=2',
  )
})

test('canonicalUrl KEEPS an unknown param — an article id must survive', () => {
  // The deny-list default. Were this an allow-list, every ?p=1234 site would
  // collapse to one row and look like a clustering bug.
  eq(M.normalize.canonicalUrl('https://example.com/?p=1234'), 'https://example.com/?p=1234')
})

test('canonicalUrl does not rewrite the scheme', () => {
  // Upgrading http→https is a guess about the server; a wrong guess splits one
  // article across two rows the day a redirect changes.
  eq(M.normalize.canonicalUrl('http://example.com/a'), 'http://example.com/a')
})

test('canonicalUrl drops the fragment but keeps a #! path', () => {
  eq(M.normalize.canonicalUrl('https://example.com/a#section'), 'https://example.com/a')
  eq(M.normalize.canonicalUrl('https://example.com/a#!/doc/7'), 'https://example.com/a#!/doc/7')
})

test('canonicalUrl strips a trailing slash and an /amp suffix together', () => {
  eq(M.normalize.canonicalUrl('https://example.com/story/amp/'), 'https://example.com/story')
  eq(M.normalize.canonicalUrl('https://example.com/story/'), 'https://example.com/story')
})

test('canonicalUrl returns an unparseable input unchanged', () => {
  eq(M.normalize.canonicalUrl('not a url'), 'not a url')
  eq(M.normalize.canonicalUrl(''), '')
})

test('splitTitlePublisher removes an aggregator suffix', () => {
  const r = M.normalize.splitTitlePublisher('Grid batteries reach parity - Reuters')
  eq(r.headline, 'Grid batteries reach parity')
  eq(r.publisher, 'Reuters')
})

test('splitTitlePublisher leaves a headline dash alone', () => {
  // "for now" is lowercase, so it is not a publisher name.
  const r = M.normalize.splitTitlePublisher('Inflation cools - for now')
  eq(r.headline, 'Inflation cools - for now')
  eq(r.publisher, null)
})

test('parseFeedDate returns null, not now, for an unreadable date', () => {
  // The whole point: an undated item is unknown-freshness, not maximally fresh.
  eq(M.normalize.parseFeedDate('tomorrow-ish', NOW), null)
  eq(M.normalize.parseFeedDate('', NOW), null)
})

test('parseFeedDate clamps a future date to now', () => {
  eq(M.normalize.parseFeedDate('2027-01-01T00:00:00Z', NOW), NOW)
})

test('contentHash ignores case and whitespace but not content', () => {
  eq(M.normalize.contentHash('A  B'), M.normalize.contentHash('a b'))
  assert(M.normalize.contentHash('a b') !== M.normalize.contentHash('a c'))
})

test('contentHash distinguishes strings differing above Latin-1', () => {
  // The high-byte mixing in the FNV loop exists for this; without it every
  // CJK headline pair with the same low bytes would hash alike.
  assert(M.normalize.contentHash('日本') !== M.normalize.contentHash('日時'))
})

test('normalizeEntry hashes the headline, so an aggregator suffix cannot defeat dedup', () => {
  const a = M.normalize.normalizeEntry(
    { title: 'Same wire story - Reuters', url: 'https://a.com/1', summary: 'body' }, NOW)
  const b = M.normalize.normalizeEntry(
    { title: 'Same wire story - AP News', url: 'https://b.com/2', summary: 'body' }, NOW)
  eq(a.contentHash, b.contentHash)
})

test('normalizeEntry rejects only an entry with neither URL nor title', () => {
  assert(M.normalize.normalizeEntry({ title: '', url: '' }, NOW) === null)
  assert(M.normalize.normalizeEntry({ title: 'x', url: '' }, NOW) !== null)
  assert(M.normalize.normalizeEntry({ title: '', url: 'https://a.com' }, NOW) !== null)
})

test('stripHtml removes tags and decodes the entities feeds actually use', () => {
  eq(M.normalize.stripHtml('<p>a &amp; b&#8212;c</p>'), 'a & b—c')
})

// ═══════════════════════════════════════════════════════════════════════════
// tags
// ═══════════════════════════════════════════════════════════════════════════

test('tokenize keeps intra-word hyphens and drops bare years', () => {
  const t = M.tags.tokenize("state-of-the-art don't 2026 7 ok")
  assert(t.includes('state-of-the-art'), 'hyphenated word survives whole')
  assert(t.includes("don't"), 'apostrophe survives')
  assert(!t.includes('2026'), 'a bare year is dropped — it relates every headline')
  assert(!t.includes('7'), 'bare numbers dropped')
})

test('containment beats jaccard for a short interest against a long headline', () => {
  const small = new Set(['energy', 'storage'])
  const large = new Set('grid batteries reach cost parity energy storage texas market'.split(' '))
  near(M.tags.containment(small, large), 1, 0.001)
  assert(M.tags.jaccard(small, large) < 0.3, 'jaccard reads the asymmetry as dissimilarity')
})

test('declared tags are never overwritten by a keyword hit', () => {
  const tagged = M.tags.assignTopicTags({
    title: 'batteries batteries batteries',
    summary: null, text: null,
    declaredTags: ['batteries'],
    feedTags: [],
  })
  const b = tagged.find(t => t.value === 'batteries')
  eq(b.confidence, 'declared')
  assert(/publisher/.test(b.reason), 'reason names the publisher as the source of the label')
})

test('a feed tag the user set outranks the publisher category', () => {
  const tagged = M.tags.assignTopicTags({
    title: 'x', summary: null, text: null,
    declaredTags: ['energy'], feedTags: ['energy'],
  })
  const e = tagged.find(t => t.value === 'energy')
  assert(/set by you/.test(e.reason), 'the user’s own tag wins the slot')
})

test('every topic tag carries a reason', () => {
  const tagged = M.tags.assignTopicTags({
    title: 'Grid batteries reach cost parity',
    summary: 'Storage costs fell again.', text: null,
    declaredTags: [], feedTags: [],
  })
  assert(tagged.length > 0)
  for (const t of tagged) assert(t.reason && t.reason.length > 3, `tag ${t.value} has no reason`)
})

test('article type: opinion is checked before news', () => {
  // An opinion piece about an event matches every news cue there is.
  const r = M.tags.classifyArticleType({
    title: 'Opinion: the grid operator said it would act, and it did not',
    summary: null,
  })
  eq(r.value, 'opinion')
})

test('article type: the reason quotes the text that fired', () => {
  const r = M.tags.classifyArticleType({ title: 'What is a capacity market?', summary: null })
  eq(r.value, 'explainer')
  assert(/matched "/.test(r.reason), `reason should quote the cue, got: ${r.reason}`)
})

test('article type: unclassified is a real outcome, not a default to news', () => {
  const r = M.tags.classifyArticleType({ title: 'Quarterly notes', summary: null })
  eq(r.value, 'unclassified')
  eq(r.confidence, 'derived')
})

test('article type: a feed hint resolves a tie but never overrides a cue', () => {
  const hinted = M.tags.classifyArticleType({
    title: 'Quarterly notes', summary: null, sourceTypeHint: 'research',
  })
  eq(hinted.value, 'research')
  eq(hinted.confidence, 'guessed')

  const cued = M.tags.classifyArticleType({
    title: 'Regulator announces a new rule', summary: null, sourceTypeHint: 'research',
  })
  eq(cued.value, 'official_release', 'a cue in the text wins over the feed’s type')
})

test('typeHintFromSource gives nothing for wire, specialist and local', () => {
  eq(M.tags.typeHintFromSource('wire'), null)
  eq(M.tags.typeHintFromSource('specialist'), null)
  eq(M.tags.typeHintFromSource('local_reporting'), null)
  eq(M.tags.typeHintFromSource('research'), 'research')
})

test('entities are labelled guessed, with the surface form in the reason', () => {
  const es = M.tags.extractEntities('Bank of England holds rates, says NIESR', null)
  const names = es.map(e => e.value)
  assert(names.includes('bank of england'), `multi-word run missed: ${names.join(', ')}`)
  assert(names.includes('niesr'), `acronym missed: ${names.join(', ')}`)
  for (const e of es) eq(e.confidence, 'guessed')
})

test('entity extraction abstains on a Title Case headline', () => {
  // arXiv, journals and many publications Title Case every headline, so a "run
  // of capitalised words" is just the sentence. Left unchecked this produced an
  // entity equal to the whole paper title, which then became the bridge score's
  // "unfamiliar material" and inflated it on every arXiv item.
  const titled = 'Hilbert-Scale Stability Of Posterior Diffusion Priors For Ill-Posed Signal Recovery'
  const es = M.tags.extractEntities(titled, null).map(e => e.value)
  assert(
    !es.some(e => e.split(' ').length > 4),
    `no long pseudo-entity should survive Title Case, got: ${es.join(' | ')}`,
  )
})

test('entity extraction still finds acronyms inside Title Case', () => {
  // The one signal that survives: an all-caps run is distinguishable from
  // Title Case, so abstaining on runs must not cost us NASA and ERCOT.
  const es = M.tags.extractEntities('Grid Battery Costs Fall Across The NASA And ERCOT Regions', null)
    .map(e => e.value)
  assert(es.includes('nasa'), `acronym lost: ${es.join(', ')}`)
  assert(es.includes('ercot'), `acronym lost: ${es.join(', ')}`)
})

test('entity extraction caps a name at five words', () => {
  // "National Oceanic and Atmospheric Administration" is five; anything longer
  // is a clause that slipped the Title Case check.
  const es = M.tags.extractEntities(
    'the National Oceanic and Atmospheric Administration said today', null,
  ).map(e => e.value)
  assert(es.includes('national oceanic and atmospheric administration'),
    `a real five-word name must survive: ${es.join(' | ')}`)
})

test('bridge judges only declared tags and entities, not keyword residue', () => {
  // The correction that made bridge behave on real data. assignTopicTags
  // appends keywords from the item's own headline — "reliable", "estimation" —
  // and counting those as material made "unfamiliar" mean "any word not in
  // your interest's name", which is almost every word.
  const interests = [interest('machine learning')]
  const it = item({
    title: 'Reliable estimation of differential privacy under selection bias',
    feedTags: ['machine learning'],
    declaredTags: ['cs.lg', 'stat.ml'],
  })
  const b = M.score.bridge(it, interests, M.score.relevance(it, interests))
  assert(b.value < 0.2,
    `a paper inside a declared interest is core, not a bridge — got ${b.value}: ${b.why}`)
})

test('entity extraction rejects feed boilerplate', () => {
  // arXiv summaries open "Announce Type: new Abstract: ...", and "Announce
  // Type" is a perfectly good two-word capitalised run. Observed inflating the
  // bridge score on live arXiv items.
  const es = M.tags.extractEntities(
    'a study of grid storage',
    'Announce Type: new Abstract: we examine Continue Reading',
  ).map(e => e.value)
  assert(!es.includes('announce type'), `boilerplate leaked: ${es.join(' | ')}`)
  assert(!es.includes('continue reading'), `boilerplate leaked: ${es.join(' | ')}`)
})

test('entity extraction does not treat a sentence-initial capital as a name', () => {
  const names = M.tags.extractEntities('The market cooled', null).map(e => e.value)
  assert(!names.includes('the'), 'stop-capitals filtered')
})

test('CONTEXT_TYPES excludes opinion', () => {
  // Argument about events is not background on them, and letting it in would
  // make the context bucket the cheapest one to fill.
  assert(!M.tags.CONTEXT_TYPES.has('opinion'))
  assert(M.tags.CONTEXT_TYPES.has('explainer'))
  assert(M.tags.CONTEXT_TYPES.has('research'))
})

// ═══════════════════════════════════════════════════════════════════════════
// cluster
// ═══════════════════════════════════════════════════════════════════════════

test('dedupeExact keeps the first and records the basis', () => {
  const a = item({ itemId: 'a', url: 'https://x.com/1' })
  const b = item({ itemId: 'b', url: 'https://x.com/1?utm_source=t' })
  const r = M.cluster.dedupeExact([a, b])
  eq(r.unique.length, 1)
  eq(r.unique[0].itemId, 'a')
  eq(r.duplicates[0].basis, 'canonical_url')
  eq(r.duplicates[0].droppedItemId, 'b')
})

test('dedupeExact catches the same content at different URLs', () => {
  const a = item({ itemId: 'a', url: 'https://x.com/1', title: 'Same story', summary: 'same body' })
  const b = item({ itemId: 'b', url: 'https://y.com/9', title: 'Same story', summary: 'same body' })
  const r = M.cluster.dedupeExact([a, b])
  eq(r.unique.length, 1)
  eq(r.duplicates[0].basis, 'content_hash')
})

test('timeAffinity is symmetric and decays to zero past the window', () => {
  const a = '2026-10-21T00:00:00Z'
  const b = '2026-10-21T12:00:00Z'
  near(M.cluster.timeAffinity(a, b), M.cluster.timeAffinity(b, a), 1e-9)
  eq(M.cluster.timeAffinity('2026-10-01T00:00:00Z', b), 0)
})

test('timeAffinity on a missing date is 0.5 — unknown, not distant', () => {
  eq(M.cluster.timeAffinity(null, NOW), 0.5)
})

test('similarity redistributes the embedding weight when embeddings are absent', () => {
  // Without this, switching to EMBEDDING_SIMILARITY before an embedding
  // provider exists would cap every pair at 0.5 and silently disable dedup.
  const a = item({ itemId: 'a', title: 'Grid batteries reach cost parity in Texas' })
  const b = item({ itemId: 'b', title: 'Grid batteries reach cost parity in Texas' })
  const d = M.cluster.similarity(a, b, M.cluster.EMBEDDING_SIMILARITY)
  near(d.score, 1, 0.001)
  assert(/weight redistributed/.test(d.reason))
})

test('similarity uses an embedding when both sides carry one', () => {
  const a = item({ itemId: 'a', title: 'alpha beta', embedding: [1, 0] })
  const b = item({ itemId: 'b', title: 'gamma delta', embedding: [1, 0] })
  const d = M.cluster.similarity(a, b, M.cluster.EMBEDDING_SIMILARITY)
  near(d.embedding, 1, 1e-9)
  assert(d.score > 0.5, 'identical embeddings carry a dissimilar headline')
})

test('cosine is clamped to 1 despite float error', () => {
  const v = [0.1, 0.2, 0.3]
  assert(M.cluster.cosine(v, v) <= 1)
})

test('clusterStories groups the same event from two outlets', () => {
  const a = item({
    itemId: 'a', feedId: 'f1',
    title: 'Grid batteries reach cost parity in Texas, ERCOT says',
    publishedAt: '2026-10-21T08:00:00Z',
  })
  const b = item({
    itemId: 'b', feedId: 'f2',
    title: 'ERCOT: grid batteries reach cost parity across Texas',
    publishedAt: '2026-10-21T10:00:00Z',
  })
  const r = M.cluster.clusterStories([a, b])
  eq(r.clusters.length, 1)
  eq(r.assignment.get('a'), r.assignment.get('b'))
})

test('clusterStories keeps different events in the same field apart', () => {
  const a = item({ itemId: 'a', title: 'Fed holds rates steady', publishedAt: NOW })
  const b = item({ itemId: 'b', title: 'ECB cuts rates by a quarter point', publishedAt: NOW })
  const r = M.cluster.clusterStories([a, b])
  eq(r.clusters.length, 2, 'headline overlap alone must not merge these')
})

test('a cluster id is stable across runs for the same inputs', () => {
  const mk = () => [
    item({ itemId: 'a', title: 'Grid batteries reach cost parity in Texas' }),
    item({ itemId: 'b', title: 'Grid batteries reach cost parity across Texas' }),
  ]
  eq(
    M.cluster.clusterStories(mk()).clusters[0].clusterId,
    M.cluster.clusterStories(mk()).clusters[0].clusterId,
  )
})

test('addsDistinctContribution refuses a second item unless the story is contested', () => {
  const a = item({ itemId: 'a', feedId: 'f1', articleType: 'news' })
  const b = item({ itemId: 'b', feedId: 'f2', articleType: 'analysis' })
  const no = M.cluster.addsDistinctContribution(a, b, {
    incumbentSourceType: 'specialist', candidateSourceType: 'specialist', contested: false,
  })
  assert(!no.ok)
  const yes = M.cluster.addsDistinctContribution(a, b, {
    incumbentSourceType: 'specialist', candidateSourceType: 'specialist', contested: true,
  })
  assert(yes.ok, yes.reason)
})

test('addsDistinctContribution refuses wire copy and same-type follow-ups', () => {
  const a = item({ itemId: 'a', feedId: 'f1', articleType: 'news' })
  const wire = item({ itemId: 'b', feedId: 'f2', articleType: 'analysis' })
  const r1 = M.cluster.addsDistinctContribution(a, wire, {
    incumbentSourceType: 'specialist', candidateSourceType: 'wire', contested: true,
  })
  assert(!r1.ok && /syndication/.test(r1.reason))

  const sameType = item({ itemId: 'c', feedId: 'f3', articleType: 'news' })
  const r2 = M.cluster.addsDistinctContribution(a, sameType, {
    incumbentSourceType: 'specialist', candidateSourceType: 'specialist', contested: true,
  })
  assert(!r2.ok && /same article type/.test(r2.reason))
})

// ═══════════════════════════════════════════════════════════════════════════
// score
// ═══════════════════════════════════════════════════════════════════════════

test('relevance is zero, with a reason, when no interests exist', () => {
  const r = M.score.relevance(item(), [])
  eq(r.value, 0)
  assert(/no interests/.test(r.why))
})

test('relevance matches through the entity channel as well as the text', () => {
  const it = item({ title: 'Sanctions tighten on Iran', summary: null })
  const r = M.score.relevance(it, [interest('Iran', { kind: 'entity' })])
  assert(r.value > 0, 'should match')
  assert(r.matched.includes('Iran'))
})

test('relevance does not fall as unmatched interests are added', () => {
  const it = item({ title: 'Grid batteries reach cost parity in Texas' })
  const one = M.score.relevance(it, [interest('energy storage')])
  const many = M.score.relevance(it, [
    interest('energy storage'),
    interest('byzantine history'),
    interest('ceramics'),
    interest('tax policy'),
  ])
  assert(many.value >= one.value - 1e-9,
    `a longer interest list must not punish an item: ${one.value} → ${many.value}`)
})

test('quality cannot see the interests — the separation is structural', () => {
  // Called with a feed and an item only. If this signature ever grows an
  // interests argument, the spec's central separation is gone.
  eq(M.score.quality.length, 2)
})

test('quality penalises sponsored content below the floor', () => {
  const it = item({ title: 'Sponsored: the future of storage', summary: 'Paid content.' })
  const q = M.score.quality(it, feed())
  assert(q.value < M.score.QUALITY_FLOOR, `expected below floor, got ${q.value}`)
  assert(/sponsored/i.test(q.why))
})

test('quality rewards attribution and original work', () => {
  const bare = M.score.quality(item({ title: 'Storage costs fell', summary: 'They fell.' }), feed())
  const sourced = M.score.quality(
    item({
      title: 'Storage costs fell',
      summary: 'We analysed ERCOT filings and interviewed three operators, according to the report.',
    }),
    feed(),
  )
  assert(sourced.value > bare.value, `${sourced.value} should exceed ${bare.value}`)
})

test('quality gives commentary a lower prior than a primary source', () => {
  const it = item({ title: 'Storage costs fell', summary: 'Text.' })
  assert(
    M.score.quality(it, feed({ sourceType: 'commentary' })).value <
    M.score.quality(it, feed({ sourceType: 'primary_source' })).value,
  )
})

test('the floor is applied before ranking, so freshness cannot rescue a weak item', () => {
  const parts = { relevance: 1, quality: 0.1, freshness: 1, bridge: 1, novelty: 1, localFit: 1 }
  const r = M.score.isEligible(parts, feed())
  assert(!r.eligible, 'a maximal blend must not clear a sub-floor quality')
  assert(/below the floor/.test(r.reason))
  // And the blend really would have been high — proving the floor is doing work
  // a weight could not.
  assert(M.score.blend(parts) > 0.8)
})

test('a user-designated feed bypasses the floor', () => {
  const parts = { relevance: 0, quality: 0.05, freshness: 0, bridge: 0, novelty: 0, localFit: 0 }
  assert(M.score.isEligible(parts, feed({ userDesignated: true })).eligible)
  assert(!M.score.isEligible(parts, feed({ userDesignated: false })).eligible)
})

test('freshness treats a missing date as unknown, not fresh', () => {
  const f = M.score.freshness(item({ publishedAt: null }), NOW)
  eq(f.value, 0.5)
  assert(/no date/.test(f.why))
})

test('freshness decays an explainer far slower than news', () => {
  const old = '2026-10-14T12:00:00Z' // a week back
  const news = M.score.freshness(item({ publishedAt: old, articleType: 'news' }), NOW)
  const expl = M.score.freshness(item({ publishedAt: old, articleType: 'explainer' }), NOW)
  assert(expl.value > news.value * 2, `${expl.value} vs ${news.value}`)
})

test('bridge needs both ends — pure core and pure outside both score low', () => {
  const interests = [interest('energy storage')]
  // Everything in the item is covered by the interest: no new end.
  const core = M.score.bridge(
    item({ title: 'Energy storage storage energy' }),
    interests,
    M.score.relevance(item({ title: 'Energy storage storage energy' }), interests),
  )
  // Nothing in the item is known: no near end.
  const outsideItem = item({ title: 'Byzantine ceramics in Ravenna' })
  const outside = M.score.bridge(outsideItem, interests, M.score.relevance(outsideItem, interests))
  assert(outside.value === 0, `no anchor should give 0, got ${outside.value}`)
  assert(core.value < 0.5, `fully-covered item should not read as a bridge, got ${core.value}`)
})

test('bridge ignores taxonomy codes as "unfamiliar material"', () => {
  // Found on a live arXiv feed. Every item carries its category codes as
  // declared tags, and cs.lg shares no token with "machine learning" even
  // though it IS machine learning — so bridge read them all as unfamiliar and
  // scored 1.00 on papers squarely inside a declared interest.
  const interests = [interest('machine learning')]
  const it = item({
    title: 'Reliable estimation under selection bias in machine learning',
    declaredTags: ['cs.lg', 'cs.cr', 'cs.ai', 'stat.ml'],
  })
  const b = M.score.bridge(it, interests, M.score.relevance(it, interests))
  assert(b.value < 0.35, `category codes must not read as discovery, got ${b.value}: ${b.why}`)
})

test('bridge is damped when the item is mostly inside a known interest', () => {
  // The doc comment always claimed "an item entirely inside your interests is
  // not a bridge (it is core)". Nothing enforced it until a real run produced
  // relevance 0.90 AND bridge 1.00 on the same item — counted twice, once in
  // each of two terms that describe different things.
  const interests = [interest('machine learning')]
  const inside = item({
    title: 'Machine learning machine learning, a machine learning study',
    summary: 'Machine learning.',
  })
  const rel = M.score.relevance(inside, interests)
  const b = M.score.bridge(inside, interests, rel)
  assert(rel.value > 0.6, `fixture precondition: relevance should be high, got ${rel.value}`)
  assert(b.value < 0.4, `a high-relevance item must not also be a strong bridge, got ${b.value}`)
})

test('bridge still fires for a genuine moderate-relevance bridge', () => {
  // The damp must not kill the real cases: a bridge HAS to mention something
  // known, so moderate relevance is its signature, not a disqualification.
  const interests = [interest('energy storage')]
  const it = item({
    title: 'Energy storage demand reshapes lithium mining in Chile',
    summary: 'Cobalt refining and Atacama brine permits are the constraint.',
  })
  const b = M.score.bridge(it, interests, M.score.relevance(it, interests))
  assert(b.value > 0, `a real bridge must survive the damp, got ${b.value}: ${b.why}`)
})

test('parseFeed distinguishes "not a feed" from "an empty feed"', () => {
  // A junk subscription on the first live run: example.com parsed to zero
  // entries, zero entries was read as "an empty feed" (legitimate), and an
  // HTML page was subscribed and contributed nothing forever.
  const html = M.parse.parseFeed('<!DOCTYPE html><html><body><h1>Example Domain</h1></body></html>')
  eq(html.isFeedDocument, false)
  eq(html.entries.length, 0)

  const emptyRss = M.parse.parseFeed('<?xml version="1.0"?><rss version="2.0"><channel><title>Quiet</title></channel></rss>')
  eq(emptyRss.isFeedDocument, true, 'a feed that declares itself and is empty is still a feed')
  eq(emptyRss.entries.length, 0)
  eq(emptyRss.feedTitle, 'Quiet')
})

test('parseFeed reads categories and author from both RSS and Atom', () => {
  // The four fields fetch-url's parser drops, which is why this parser exists.
  const rss = M.parse.parseFeed(`<?xml version="1.0"?><rss><channel><title>T</title><language>en</language>
    <item><title>One</title><link>https://a.com/1</link><dc:creator>A Reporter</dc:creator>
      <category>Energy</category><category>Policy</category></item></channel></rss>`)
  eq(rss.entries.length, 1)
  eq(rss.entries[0].author, 'A Reporter')
  eq(JSON.stringify(rss.entries[0].categories), JSON.stringify(['Energy', 'Policy']))
  eq(rss.language, 'en')

  const atom = M.parse.parseFeed(`<?xml version="1.0"?><feed xml:lang="en-gb"><title>T</title>
    <entry><title>One</title><link rel="alternate" href="https://a.com/1"/>
      <author><name>B Writer</name></author><category term="Space"/></entry></feed>`)
  eq(atom.entries[0].author, 'B Writer')
  eq(JSON.stringify(atom.entries[0].categories), JSON.stringify(['Space']))
  eq(atom.language, 'en-gb')
})

test('parseFeed takes the alternate link, not an enclosure', () => {
  // "First href wins" returns the audio file on a podcast feed and the comment
  // thread on a commentable one — both look like working links.
  const atom = M.parse.parseFeed(`<feed><entry><title>Ep</title>
    <link rel="enclosure" href="https://a.com/audio.mp3"/>
    <link rel="alternate" href="https://a.com/episode"/></entry></feed>`)
  eq(atom.entries[0].url, 'https://a.com/episode')
})

test('parseFeed decodes &amp; last, so &amp;lt; stays literal text', () => {
  const rss = M.parse.parseFeed('<rss><channel><item><title>a &amp;lt; b</title></item></channel></rss>')
  eq(rss.entries[0].title, 'a &lt; b')
})

test('a back-filled bucket reports how many slots were stand-ins, not "none qualified"', () => {
  // Live run produced: bucket core, filled 8 of 8, backfilled 2, reason "no
  // candidate qualified for core" — flatly false on a bucket that filled six
  // slots by qualifying.
  const pairs = []
  for (let i = 0; i < 12; i++) {
    pairs.push({
      item: item({
        itemId: `c${i}`, feedId: `f${i}`,
        title: `Energy storage report number ${i}`,
        summary: 'According to the study, storage costs fell.',
      }),
      feed: feed({ feedId: `f${i}`, name: `Feed ${i}` }),
    })
  }
  const { scored, clusters } = prepare(pairs)
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 12 })
  for (const g of d.gaps) {
    if (g.backfilled > 0 && g.filled === g.wanted) {
      assert(!/^no candidate qualified/.test(g.reason),
        `a bucket that filled every slot must not claim none qualified: "${g.reason}"`)
      assert(/had no qualifying candidate/.test(g.reason), g.reason)
    }
  }
})

test('bridge names both ends when it fires', () => {
  const interests = [interest('energy storage')]
  const it = item({
    title: 'Energy storage demand reshapes lithium mining in Chile',
    summary: 'Cobalt refining and Atacama brine permits are the constraint.',
  })
  const b = M.score.bridge(it, interests, M.score.relevance(it, interests))
  assert(b.value > 0, `expected a bridge, got ${b.value}: ${b.why}`)
  eq(b.from, 'energy storage')
  assert(b.to && b.to.length > 0, 'the far end must be named')
})

test('novelty is 1 against an empty history and falls against a near-repeat', () => {
  const it = item({ title: 'Grid batteries reach cost parity in Texas' })
  eq(M.score.novelty(it, []).value, 1)
  const shown = [new Set(M.tags.contentTokens('Grid batteries reach cost parity in Texas'))]
  assert(M.score.novelty(it, shown).value < 0.4)
})

test('novelty uses the max, not the mean, of the history', () => {
  const it = item({ title: 'Grid batteries reach cost parity in Texas' })
  const shown = [
    new Set(M.tags.contentTokens('Grid batteries reach cost parity in Texas')),
    new Set(M.tags.contentTokens('Byzantine ceramics in Ravenna')),
    new Set(M.tags.contentTokens('Tax policy in Ohio')),
  ]
  assert(M.score.novelty(it, shown).value < 0.4,
    'one near-identical item in the history is enough to kill novelty')
})

test('localFit is 0 with no region set, and says so', () => {
  const l = M.score.localFit(item(), feed(), [])
  eq(l.value, 0)
  assert(/not named a region/.test(l.why))
})

test('localFit ranks the feed’s own region above a mere mention', () => {
  const it = item({ title: 'Grid batteries reach cost parity in Texas' })
  const byFeed = M.score.localFit(it, feed({ region: 'Texas' }), ['texas'])
  const byMention = M.score.localFit(it, feed({ region: null }), ['texas'])
  eq(byFeed.value, 1)
  assert(byMention.value < byFeed.value && byMention.value > 0)
})

test('scoreItem keeps a because-line for every part', () => {
  const s = M.score.scoreItem(item(), feed(), ctx())
  for (const k of ['relevance', 'quality', 'freshness', 'bridge', 'novelty', 'localFit']) {
    assert(s.because[k] && s.because[k].length > 3, `no explanation for ${k}`)
    assert(typeof s.parts[k] === 'number', `no value for ${k}`)
  }
})

test('scoreItem withholds a bridge explanation when the bridge is weak', () => {
  // Offering a connection the arithmetic does not support is how an
  // explanation becomes a confabulation.
  const it = item({ title: 'Byzantine ceramics in Ravenna' })
  const s = M.score.scoreItem(it, feed(), ctx())
  assert(s.parts.bridge < 0.15)
  eq(s.bridgeFrom, null)
  eq(s.bridgeTo, null)
})

test('scoreAll agrees with scoreItem — the shared cache changes nothing', () => {
  const pairs = [
    { item: item({ itemId: 'a' }), feed: feed() },
    { item: item({ itemId: 'b', title: 'Sanctions tighten on Iran' }), feed: feed() },
  ]
  const c = ctx({ interests: [interest('energy storage'), interest('Iran', { kind: 'entity' })] })
  const batch = M.score.scoreAll(pairs, c)
  for (let i = 0; i < pairs.length; i++) {
    const single = M.score.scoreItem(pairs[i].item, pairs[i].feed, c)
    near(batch[i].base, single.base, 1e-12, `item ${i}`)
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// select
// ═══════════════════════════════════════════════════════════════════════════

/** Score a list of {item, feed} and cluster it, as a digest run would. */
function prepare(pairs, c = ctx()) {
  const scored = M.score.scoreAll(pairs, c)
  const clusters = M.cluster.clusterStories(pairs.map(p => p.item)).assignment
  return { scored, clusters }
}

test('qualifyingBuckets: outside needs low relevance AND high novelty', () => {
  const lowRelHighNov = {
    item: item(), feed: feed(),
    parts: { relevance: 0.1, quality: 0.6, freshness: 0.5, bridge: 0, novelty: 0.9, localFit: 0 },
  }
  assert(M.select.qualifyingBuckets(lowRelHighNov).includes('outside'))

  const lowRelLowNov = { ...lowRelHighNov, parts: { ...lowRelHighNov.parts, novelty: 0.1 } }
  assert(!M.select.qualifyingBuckets(lowRelLowNov).includes('outside'),
    'merely irrelevant is not discovery')
})

test('qualifyingBuckets: context is decided by article type, and can overlap core', () => {
  const s = {
    item: item({ articleType: 'explainer' }), feed: feed(),
    parts: { relevance: 0.9, quality: 0.6, freshness: 0.5, bridge: 0, novelty: 0.5, localFit: 0 },
  }
  const qs = M.select.qualifyingBuckets(s)
  assert(qs.includes('core') && qs.includes('context'))
})

test('sourceCap is a tenth of the digest, relaxed when too few feeds exist', () => {
  eq(M.select.sourceCap(20, 10).cap, 2)
  eq(M.select.sourceCap(20, 10).relaxed, false)
  const few = M.select.sourceCap(20, 3)
  eq(few.cap, 7)
  eq(few.relaxed, true)
})

test('selection does not fill the digest with one source', () => {
  // Ten strong items from one feed, ten weaker ones from five others. A naive
  // sort by base would take all ten from the first feed.
  const pairs = []
  for (let i = 0; i < 10; i++) {
    pairs.push({
      item: item({
        itemId: `hot${i}`, feedId: 'loud',
        title: `Energy storage milestone number ${['one','two','three','four','five','six','seven','eight','nine','ten'][i]}`,
        summary: 'We analysed the filings and interviewed operators, according to the report.',
      }),
      feed: feed({ feedId: 'loud', name: 'Loud Daily' }),
    })
  }
  for (let i = 0; i < 10; i++) {
    pairs.push({
      item: item({
        itemId: `quiet${i}`, feedId: `q${i % 5}`,
        title: `Storage adjacent topic ${i}: lithium brine permits in Chile`,
        summary: 'According to the filing, refining capacity is the constraint.',
      }),
      feed: feed({ feedId: `q${i % 5}`, name: `Quiet ${i % 5}` }),
    })
  }
  const { scored, clusters } = prepare(pairs)
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 6 })
  const loud = d.items.filter(s => s.scored.feed.feedId === 'loud').length
  assert(loud <= M.select.sourceCap(20, 6).cap,
    `one source took ${loud} of ${d.items.length} slots`)
})

test('an item is assigned to the bucket with the largest shortfall', () => {
  // A single explainer that is also strongly core. Core has 8 slots and context
  // has 3, so on the first pick core is the shorter-of-the-two by remaining
  // count — the assignment must follow the counts, not the qualification order.
  const it = item({
    itemId: 'x',
    title: 'What is a capacity market? Energy storage explained',
    summary: 'According to the regulator, the study shows how storage bids work.',
  })
  const { scored, clusters } = prepare([{ item: it, feed: feed() }])
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 1 })
  const picked = d.items.find(s => s.scored.item.itemId === 'x')
  assert(picked, 'the item should be selected')
  eq(picked.bucket, 'core', 'core has the most open slots on the first pick')
  assert(picked.alsoQualifiedFor.includes('context'),
    'the other qualification is recorded, so the "why" answer can name it')
})

test('only one item per story cluster is taken when the story is not contested', () => {
  const a = item({
    itemId: 'a', feedId: 'f1',
    title: 'ERCOT says grid batteries reached cost parity in Texas',
    summary: 'According to the filing.',
  })
  const b = item({
    itemId: 'b', feedId: 'f2',
    title: 'Grid batteries reached cost parity in Texas, ERCOT says',
    summary: 'According to the filing.',
  })
  const { scored, clusters } = prepare([
    { item: a, feed: feed({ feedId: 'f1', name: 'One' }) },
    { item: b, feed: feed({ feedId: 'f2', name: 'Two' }) },
  ])
  eq(clusters.get('a'), clusters.get('b'), 'fixture precondition: these cluster')
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 2 })
  const fromCluster = d.items.filter(s => ['a', 'b'].includes(s.scored.item.itemId))
  eq(fromCluster.length, 1)
})

test('a short bucket is reported as a gap, with a reason', () => {
  // One item, twenty slots. Nineteen slots cannot be filled and the digest must
  // say so rather than returning a one-item list as if that were the answer.
  const { scored, clusters } = prepare([{ item: item(), feed: feed() }])
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 1 })
  assert(d.gaps.length > 0, 'gaps must be reported')
  for (const g of d.gaps) {
    assert(g.reason && g.reason.length > 10, `gap for ${g.bucket} has no reason`)
    assert(g.filled < g.wanted || g.backfilled > 0)
  }
  assert(d.items.length < 20)
})

test('back-filled items are labelled, so discovery rates are not computed over them', () => {
  // Every candidate is strongly core; the discovery buckets have nothing to put
  // in them, so whatever lands there arrived by back-fill and must be marked.
  const pairs = []
  for (let i = 0; i < 12; i++) {
    pairs.push({
      item: item({
        itemId: `c${i}`, feedId: `f${i}`,
        title: `Energy storage report ${i}`,
        summary: 'According to the study, storage costs fell.',
      }),
      feed: feed({ feedId: `f${i}`, name: `Feed ${i}` }),
    })
  }
  const { scored, clusters } = prepare(pairs)
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 12 })
  const outsideGap = d.gaps.find(g => g.bucket === 'outside')
  assert(outsideGap, 'the outside bucket should be short')
  assert(outsideGap.backfilled >= 0)
  if (outsideGap.backfilled > 0) {
    assert(/back-filled|nothing left|no candidate/.test(outsideGap.reason), outsideGap.reason)
  }

  // The per-item flag, which is what the measurements actually read. A gap
  // count alone cannot tell you WHICH slot was a stand-in.
  const inOutside = d.items.filter(s => s.bucket === 'outside')
  assert(
    inOutside.every(s => s.backfilled),
    'every item in a bucket nothing qualified for must be flagged as back-filled',
  )
  const qualified = d.items.filter(s => s.bucket === 'core')
  assert(
    qualified.some(s => !s.backfilled),
    'items that genuinely qualified must NOT be flagged',
  )
})

test('metrics reads the selector’s own backfilled flag end to end', () => {
  // The two halves wired together: whatever selectDigest flags, measure()
  // excludes from the discovery denominator. A regression in either one alone
  // would let a digest with no discovery content report a discovery rate.
  const pairs = []
  for (let i = 0; i < 12; i++) {
    pairs.push({
      item: item({
        itemId: `c${i}`, feedId: `f${i}`,
        title: `Energy storage report ${i}`,
        summary: 'According to the study, storage costs fell.',
      }),
      feed: feed({ feedId: `f${i}`, name: `Feed ${i}` }),
    })
  }
  const { scored, clusters } = prepare(pairs)
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 12 })

  const m = M.metrics.measure({
    shown: d.items.map(s => ({
      itemId: s.scored.item.itemId,
      bucket: s.bucket,
      feedId: s.scored.feed.feedId,
      topicTags: s.scored.item.topicTags.map(t => t.value),
      clusterId: clusters.get(s.scored.item.itemId) ?? s.scored.item.itemId,
      backfilled: s.backfilled,
    })),
    feedback: [], previousClusterIds: [], desiredTopics: [],
  })
  const flagged = d.items.filter(s => s.backfilled && ['adjacent', 'outside'].includes(s.bucket)).length
  const inDiscovery = d.items.filter(s => ['adjacent', 'outside'].includes(s.bucket)).length
  eq(m.discoveryItemsCounted, inDiscovery - flagged,
    'the discovery denominator must exclude exactly the flagged slots')
})

test('the relaxed source cap is a digest note, not a fake bucket gap', () => {
  const pairs = [0, 1, 2].map(i => ({
    item: item({ itemId: `a${i}`, feedId: 'only', title: `Energy storage item ${i}` }),
    feed: feed({ feedId: 'only', name: 'Only Feed' }),
  }))
  const { scored, clusters } = prepare(pairs)
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 1 })
  assert(d.notes.some(n => /cap was raised/.test(n)), `notes: ${JSON.stringify(d.notes)}`)
  for (const g of d.gaps) {
    assert(['core', 'adjacent', 'outside', 'context', 'local'].includes(g.bucket))
  }
})

test('ineligible and bucket-less candidates are reported as rejected, with reasons', () => {
  const sponsored = item({ itemId: 'spam', title: 'Sponsored: storage', summary: 'Paid post.' })
  const { scored, clusters } = prepare([{ item: sponsored, feed: feed() }])
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 1 })
  const r = d.rejected.find(x => x.itemId === 'spam')
  assert(r, 'a rejected candidate must be reported, not dropped')
  assert(/floor|bucket/.test(r.reason), r.reason)
})

test('a digest records the weights and plan it was built with', () => {
  const { scored, clusters } = prepare([{ item: item(), feed: feed() }])
  const d = M.select.selectDigest(scored, clusters, { enabledFeeds: 1 })
  eq(d.weights.relevance, M.score.DEFAULT_WEIGHTS.relevance)
  eq(d.plan.reduce((n, b) => n + b.slots, 0), 20)
})

// ═══════════════════════════════════════════════════════════════════════════
// feedback
// ═══════════════════════════════════════════════════════════════════════════

test('explicit feedback moves a weight further than a weak signal', () => {
  const base = [interest('energy storage', { weight: 0.5 })]
  const strong = M.feedback.applyFeedback(base, {
    matchedInterests: ['energy storage'], kind: 'more_like_this', shownAsBucket: 'core',
  })
  const weak = M.feedback.applyWeakSignal(base, {
    matchedInterests: ['energy storage'], kind: 'opened', value: 1,
  })
  const d1 = strong[0].weight - 0.5
  const d2 = weak[0].weight - 0.5
  assert(d1 > d2 * 2, `explicit ${d1} should dominate weak ${d2}`)
})

test('"interesting but not useful" does not reduce the interest weight', () => {
  // The whole reason the control exists: saying "good find, wrong moment" must
  // not teach the system to stop finding that kind of thing.
  const base = [interest('energy storage', { weight: 0.5 })]
  const after = M.feedback.applyFeedback(base, {
    matchedInterests: ['energy storage'], kind: 'interesting_not_useful', shownAsBucket: 'adjacent',
  })
  assert(after[0].weight >= 0.5, `weight fell to ${after[0].weight}`)
})

test('"already saw this" touches no weight at all', () => {
  const base = [interest('energy storage', { weight: 0.5 })]
  const after = M.feedback.applyFeedback(base, {
    matchedInterests: ['energy storage'], kind: 'already_saw', shownAsBucket: 'core',
  })
  eq(after[0].weight, 0.5)
})

test('decay pulls a learned weight back but leaves an explicit one alone', () => {
  const learned = interest('a', { weight: 0.9, explicitFeedback: false })
  const stated = interest('b', { weight: 0.9, explicitFeedback: true })
  const after = M.feedback.decayWeights([learned, stated], 0.5)
  assert(after[0].weight < 0.9, 'a learned weight decays')
  eq(after[1].weight, 0.9, 'a weight the user typed is a statement, not an estimate')
})

test('the discovery floor survives a run of negative feedback', () => {
  let interests = [interest('energy storage', { weight: 0.5 })]
  for (let i = 0; i < 40; i++) {
    interests = M.feedback.applyFeedback(interests, {
      matchedInterests: ['energy storage'], kind: 'less_like_this', shownAsBucket: 'core',
    })
  }
  const plan = M.feedback.planWithDiscoveryFloor(
    [{ bucket: 'core', slots: 20 }, { bucket: 'adjacent', slots: 0 }, { bucket: 'outside', slots: 0 }],
  )
  const discovery = plan.filter(p => p.bucket === 'adjacent' || p.bucket === 'outside')
    .reduce((n, p) => n + p.slots, 0)
  assert(discovery >= 2, `discovery collapsed to ${discovery} slots`)
})

// ═══════════════════════════════════════════════════════════════════════════
// metrics
// ═══════════════════════════════════════════════════════════════════════════

test('metrics keeps the measurements separate — there is no single score', () => {
  const m = M.metrics.measure({
    shown: [
      { itemId: 'a', bucket: 'core', feedId: 'f1', topicTags: ['energy'], clusterId: 'c1', backfilled: false },
      { itemId: 'b', bucket: 'outside', feedId: 'f1', topicTags: ['ceramics'], clusterId: 'c2', backfilled: false },
      { itemId: 'c', bucket: 'adjacent', feedId: 'f2', topicTags: ['lithium'], clusterId: 'c3', backfilled: true },
    ],
    feedback: [
      { itemId: 'a', kind: 'worth_seeing', at: NOW, shownAsBucket: 'core' },
      { itemId: 'b', kind: 'worth_seeing', at: NOW, shownAsBucket: 'outside' },
    ],
    previousClusterIds: ['c1'],
    desiredTopics: ['energy', 'ceramics', 'tax policy'],
  })
  assert(typeof m.relevanceRate === 'number')
  assert(typeof m.discoveryHitRate === 'number')
  assert(typeof m.sourceConcentration === 'number')
  assert(typeof m.duplicateRate === 'number')
  assert(m.coverageGaps.includes('tax policy'), 'an unreachable desired topic is a coverage gap')
  assert(!('engagement' in m), 'a single engagement number is exactly what the spec warns against')
})

test('discovery hit rate excludes back-filled items', () => {
  // A back-filled discovery slot was never discovery. Counting it would let a
  // digest with no discovery content report a discovery hit rate.
  const m = M.metrics.measure({
    shown: [
      { itemId: 'real', bucket: 'outside', feedId: 'f1', topicTags: [], clusterId: 'c1', backfilled: false },
      { itemId: 'fake', bucket: 'outside', feedId: 'f1', topicTags: [], clusterId: 'c2', backfilled: true },
    ],
    feedback: [{ itemId: 'real', kind: 'worth_seeing', at: NOW, shownAsBucket: 'outside' }],
    previousClusterIds: [],
    desiredTopics: [],
  })
  eq(m.discoveryItemsCounted, 1)
  eq(m.discoveryHitRate, 1)
})

test('source concentration is the largest source’s share', () => {
  const m = M.metrics.measure({
    shown: [
      { itemId: 'a', bucket: 'core', feedId: 'f1', topicTags: [], clusterId: 'c1', backfilled: false },
      { itemId: 'b', bucket: 'core', feedId: 'f1', topicTags: [], clusterId: 'c2', backfilled: false },
      { itemId: 'c', bucket: 'core', feedId: 'f2', topicTags: [], clusterId: 'c3', backfilled: false },
    ],
    feedback: [], previousClusterIds: [], desiredTopics: [],
  })
  near(m.sourceConcentration, 2 / 3, 0.001)
})

test('duplicate rate counts clusters already shown recently', () => {
  const m = M.metrics.measure({
    shown: [
      { itemId: 'a', bucket: 'core', feedId: 'f1', topicTags: [], clusterId: 'c1', backfilled: false },
      { itemId: 'b', bucket: 'core', feedId: 'f1', topicTags: [], clusterId: 'c2', backfilled: false },
    ],
    feedback: [], previousClusterIds: ['c1'], desiredTopics: [],
  })
  near(m.duplicateRate, 0.5, 0.001)
})

test('rates are null, not zero, when nothing was rated', () => {
  // Zero would read as "nothing was worth seeing"; null reads as "nobody said".
  const m = M.metrics.measure({
    shown: [{ itemId: 'a', bucket: 'core', feedId: 'f1', topicTags: [], clusterId: 'c1', backfilled: false }],
    feedback: [], previousClusterIds: [], desiredTopics: [],
  })
  eq(m.relevanceRate, null)
})

// ── report ───────────────────────────────────────────────────────────────────

rmSync(outDir, { recursive: true, force: true })

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
