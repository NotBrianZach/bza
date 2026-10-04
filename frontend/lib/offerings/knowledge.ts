/**
 * Knowledge offerings — a theorem, a phenomenon, a creature, a place.
 *
 * WHY THESE ARE CATALOGUED AND NOT COMPOSED, which is the whole design of this
 * file. A theorem is a *proposition*, and that makes it the first medium here whose
 * content can be confidently wrong rather than merely bad. The composed guard does
 * not transfer: performability catches vague mush, and a false claim about
 * mathematics is not mush — it is specific, fluent and incorrect. An interpreter
 * asked to author "the statement of Noether's theorem" would sometimes author
 * something that is not Noether's theorem, which is the invented-track failure in a
 * new costume.
 *
 * So the guard is the one `passage` already uses, and it is strict: **the
 * interpreter never writes the content, only names the search.** The server
 * fetches the record and quotes its text verbatim. A query that matches nothing is
 * a miss, exactly like a song that does not exist, and nothing is asserted into
 * being. No new class of honesty guard was needed — only the discipline of not
 * reaching for the wrong existing one.
 *
 * Four media, one resolver, because they differ by *scope* rather than by
 * mechanism. Each scope is a search hint plus a pattern that decides whether a page
 * belongs in it. The pattern is curation, not honesty: a page it rejects is still a
 * real page, it is just not a theorem, and saying "no theorem matched" is better
 * than handing a geometry game an article about a cat.
 *
 * Wikipedia is the provider because it is keyless, enormous, and returns extract,
 * thumbnail and categories in a single call — so one search costs one request, the
 * trade this section has already learned to care about (see artwork.ts).
 */

import type { MediumId, Offering, Perceptible } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const API = 'https://en.wikipedia.org/w/api.php'

const PROVIDER = 'Wikipedia'

/**
 * Wikimedia asks every client to identify itself and answers unidentified
 * datacenter traffic inconsistently.
 *
 * This is the exception shared.ts warns about rather than a contradiction of it:
 * the lesson there was that a *crawler-shaped* UA gets refused by an edge WAF
 * (Apple's), and Wikimedia's own policy asks for precisely this format. A provider
 * that wants a header asks for one per call, which is why that is possible.
 */
const HEADERS = {
  'User-Agent': 'AIReadAlong/1.0 (https://aireadalong.com) correlation-games',
}

export const KNOWLEDGE_SEARCH_LIMIT = 12

/**
 * Extracts are intros, and an intro can run for paragraphs. Long enough to carry a
 * statement, short enough that eight of them in a prompt is not the prompt.
 */
const MAX_EXTRACT = 600

/**
 * Titles that are generic whatever the medium: an index, a list, a disambiguation
 * page, a survey. Real pages, and never an offering — nothing in them is a thing
 * you can perceive.
 */
const GENERIC_TITLE = /^(?:list|lists|outline|index|glossary|timeline|history|comparison|types|classification|introduction) (?:of|to)\b|\(disambiguation\)$/i

/**
 * The name of a field, a discipline or a practice, refused by every scope.
 *
 * Each scope's own `rejects` covers its own vocabulary, and that was not enough,
 * because the scopes overlap: *Scientific method* was offered as a theorem and
 * *Photography* as a phenomenon, and neither list had thought to mention the
 * other's subject. A field is never an offering in any of these media — it is the
 * drawer, not the thing in it.
 */
const FIELD_TITLE = /^(?:science|sciences|natural science|scientific method|scientific law|mathematics|physics|chemistry|biology|astronomy|geology|geography|cartography|ecology|zoology|botany|medicine|technology|engineering|computing|photography|art|the arts|music|literature|philosophy|logic|linguistics|language|psychology|sociology|anthropology|archaeology|economics|research|education|knowledge|nature|culture|society|history|statistics|measurement|observation|experiment|theory|methodology)$/i

/**
 * Pages that are not an offering in *any* of these media, however well they match
 * a scope.
 *
 * The second thing a generous pattern cannot see, and the larger of the two. Each
 * scope's pattern is tested against the whole extract and every category, and
 * Wikipedia is an encyclopedia — so a mathematician's biography is in the theorem
 * scope (it says "mathematician"), a businessman's is in the place scope (it says
 * where he is from), and a Star Wars planet is in it too (it says "desert planet").
 * Probed 2026-10-03, all four from real description-shaped queries:
 *
 *   theorem    "something about symmetry giving you conservation" → Emmy Noether
 *   theorem    "a theorem about things that must coincide"        → Ted Kaczynski
 *   phenomenon "light produced by a living thing"                 → The Thing (1982 film)
 *   place      "a place whose silence is its subject"             → Jeff Bezos
 *   place      "a landscape that looks like another planet"       → Geonosis
 *   place      "somewhere people left and never came back to"     → Goths
 *
 * These are a worse failure than the dull-category one, because a reader cannot
 * even tell what went wrong: the chain simply contains a person where a theorem
 * should be. And they are *all three the same shape* — a page about a person, a
 * made-up thing, or a nation — so one gate in front of all four scopes catches
 * them. Two of these classes have their own medium already (a film is a `scene`,
 * a song is `music`), which is the other reason they do not belong here.
 */
const NOT_AN_OFFERING: RegExp[] = [
  // A person. The parenthetical of birth and death dates is the most reliable
  // signal English Wikipedia has, and it does not depend on the categories
  // arriving — which, under the API's continuation limits, they sometimes do not.
  /\([^)]{0,90}?(?:\bborn\b[^)]{0,30}\d{4}|\d{4}\s*[–—-]\s*(?:\d{4}|\d{1,2}\s+\w+\s+\d{4}))[^)]{0,50}\)/,
  /\b(?:is|was)\s+(?:a|an|the)\s+[^.]{0,50}?\b(?:mathematician|physicist|chemist|biologist|naturalist|astronomer|geologist|zoologist|botanist|engineer|inventor|businessman|businesswoman|entrepreneur|writer|author|poet|novelist|playwright|artist|painter|sculptor|composer|musician|singer|film-?maker|director|politician|statesman|philosopher|economist|historian|scientist|academic|professor|activist|explorer|architect|monarch|emperor|empress|saint|general|admiral|criminal|terrorist)s?\b/i,
  // A people, a nation, a dynasty — in the place scope these read as somewhere,
  // and they are a someone.
  /\b(?:is|are|was|were)\s+(?:a|an|the)?\s*[^.]{0,40}?\b(?:people|peoples|ethnic group|tribe|confederation|dynasty|civilisation|civilization|empire)\b/i,
  /\b(?:peoples|tribes)\b/i,
  // A made-up thing, or a work. "Geonosis is a desert planet in the fictional
  // universe of Star Wars" matches the place scope on every word that matters.
  /\bfictional\b/i,
  /\b(?:is|was)\s+(?:a|an|the)\s+[^.]{0,60}?\b(?:film|movie|novel|novella|album|single|video game|television series|TV series|sitcom|play|musical|opera|comic|manga|anime|episode|franchise)s?\b/i,
]

const NOT_AN_OFFERING_CATEGORY =
  /\b\d{4} (?:births|deaths)\b|^Living people$|\b\d{4} films\b|^Fictional |\bfictional\b/i

interface Scope {
  /** Appended to a query that carries no signal of its own, to bias relevance. */
  hint: string
  /**
   * What makes a page part of this medium, matched against its categories, its
   * title and its extract. Generous on purpose: the cost of a strict pattern is a
   * medium that feels broken, and the cost of a loose one is a bad result the
   * player can see and search past.
   */
  pattern: RegExp
  /**
   * Titles that name this medium's own *vocabulary* rather than an offering in it,
   * matched against the whole trimmed title.
   *
   * These are the pages `pattern` cannot refuse, because `pattern` is built out of
   * the very words they are about: the article "Species" is in the organism scope
   * by every test that asks whether biology is being discussed. Observed in
   * production — a Life-only game answered a grackle with the encyclopedia's
   * definition of *species*, which is in scope, is real, and is the dullest
   * sentence available.
   */
  rejects: RegExp
  /**
   * Whether a page is about a *member* of this scope, given its title and its
   * first sentence.
   *
   * Set only for the scopes whose members are concrete things — a creature, a
   * place. A theorem and a phenomenon *are* abstractions, so there is no member
   * test to run on them: for those two, `rejects` is the whole of the guard.
   *
   * First sentence rather than the whole extract on purpose. An essay about
   * camouflage mentions animals by its third sentence, so a member test over the
   * whole intro admits it; "is a bird" has to be what the page is *about*, not
   * something it gets around to.
   */
  member?: (title: string, opening: string) => boolean
  /** The default framing. A player's own framing still overrides it. */
  framing: string
}

/**
 * Animal, plant and fungus words distinctive enough to match unanchored, so the
 * compounds English actually uses — anglerfish, cuttlefish, birdwing, seadevil —
 * are caught by the head noun inside them. The short ambiguous ones are bounded
 * separately below, because unanchored `bat` matches "Bateman's principle" and
 * unanchored `ant` matches "significant".
 */
const CREATURE_WORDS =
  'fish|bird|fowl|mollusc|cephalopod|arthropod|crustacean|insect|beetle|butterfl|' +
  'spider|arachnid|scorpion|millipede|centipede|mammal|primate|rodent|marsupial|' +
  'cetacean|whale|dolphin|porpoise|ungulate|antelope|rabbit|squirrel|monkey|' +
  'reptil|amphibian|lizard|turtle|tortoise|crocodil|alligator|salamander|gecko|' +
  'snake|serpent|python|viper|frog|toad|shark|eel|sturgeon|salmon|minnow|' +
  'jellyfish|octopus|squid|urchin|anemone|sponge|coral|starfish|barnacle|' +
  'penguin|parrot|finch|heron|pigeon|sparrow|warbler|thrush|corvid|passerine|' +
  'raptor|falcon|vulture|grackle|blackbird|wader|waterfowl|' +
  'moth|cicada|mantis|dragonfl|damselfl|wasp|hornet|termite|aphid|weevil|' +
  'grasshopper|cricket|locust|caterpillar|snail|slug|earthworm|nematod|annelid|' +
  'hydrozoan|cnidarian|siphonophor|ctenophore|echinoderm|bryozoan|rotifer|' +
  'copepod|isopod|amphipod|krill|nautilus|' +
  'orchid|conifer|fern|moss|liverwort|grass|sedge|palm|cactus|cacti|succulent|' +
  'legume|fungus|fungi|mushroom|toadstool|lichen|mould|mold|bacteri|microb|' +
  'archaea|protist|protozoa|amoeba|myxomycete|ciliate|flagellate|' +
  'algae|alga|diatom|plankton|cyanobacteri'

/** Short enough to appear inside unrelated words, so these need both boundaries. */
const CREATURE_WORDS_BOUNDED =
  'bats?|cats?|dogs?|bears?|deer|seals?|otters?|owls?|gulls?|hawks?|eagles?|cranes?|' +
  'ducks?|geese|swans?|crabs?|shrimps?|lobsters?|bees?|ants?|flies|fly|rays?|cods?|' +
  'trees?|shrubs?|vines?|herbs?|flowers?|plants?|worms?|yeasts?|moulds?|' +
  'breeds?|cultivars?|strains?|hybrids?'

/** Any creature word, however it was spelled or bounded above. */
const CREATURE = `(?:(?:${CREATURE_WORDS})|\\b(?:${CREATURE_WORDS_BOUNDED})\\b)`

/**
 * The clause in which a page says what its subject *is*, rather than what its
 * subject is about.
 *
 * This is the part that took two passes to get right, and the reason is one word:
 * "of". *Crypsis* opens "is the ability of an animal to avoid detection" and
 * *Convergent evolution* opens "is the independent evolution of similar features
 * in species of different periods" — both name a creature within a few words of a
 * copula, and both are essays. So the window between "is a" and the creature word
 * is a tempered match that cannot cross "of" …
 */
const COPULA =
  '\\b(?:is|are|was|were)\\s+' +
  '(?:(?:a|an|the|any|some|two|three|several|(?:one|any|all|some|each) of the)\\s+)?'
const NOT_OF = '(?:(?!\\bof\\b)[^.]){0,60}'

/**
 * … except through one of these, which are the collective nouns a page about a
 * real taxon genuinely uses: "a species of birdwing butterfly", "a large group of
 * swimming sea slugs", "a clonal colony of a single quaking aspen".
 */
const COLLECTIVE =
  '(?:(?:sub)?species|genus|famil(?:y|ies)|subfamily|tribe|order|suborder|clade|taxon|' +
  'class|phylum|division|section|group|colony|complex|assemblage|members?|kinds?|' +
  'types?|variet(?:y|ies)|breeds?)\\s+of\\b'

/**
 * Taxonomic framing decisive enough to stand on its own, wherever it appears:
 * nothing but a page about a taxon says "in the family Linophrynidae".
 *
 * `order` and `family` must carry an article, because "in order to" and "a family
 * of languages" are both things a concept page says.
 */
const TAXON_FRAMING =
  '\\b(?:sub)?genus\\b|\\bgenera\\b|' +
  '\\b(?:the|a|an)\\s+(?:[a-z-]+\\s+){0,2}' +
  '(?:order|famil(?:y|ies)|subfamily|tribe|clade|class|phylum|division|kingdom)\\s+[A-Z]'

/**
 * A title that is itself a creature's name, which the first sentence cannot always
 * supply: "Cat" opens "is a domestic species", naming no creature at all.
 *
 * Anchored on the last word or on a parenthetical disambiguator — "Common
 * grackle", "Deep-sea fish", "Pando (tree)" — because that is where English puts
 * the head noun. A title that merely mentions creatures does not qualify, which is
 * what keeps "Bird migration" and "Animal coloration" out.
 */
const CREATURE_TITLE = new RegExp(`(?:${CREATURE}\\w*|\\(${CREATURE}\\w*\\))$`, 'i')

const ORGANISM_MEMBER = new RegExp(
  `${TAXON_FRAMING}|${COPULA}${NOT_OF}(?:${COLLECTIVE}[^.]{0,40}?)?${CREATURE}|` +
  `${COPULA}${NOT_OF}(?:sub)?species of\\b`,
  'i',
)

/** Both halves of the organism member test, since the title is checked separately. */
function namesACreature(title: string, opening: string): boolean {
  return CREATURE_TITLE.test(title.trim()) || ORGANISM_MEMBER.test(opening)
}

/**
 * A page about somewhere, rather than about the idea of somewhere.
 *
 * A real place names its kind in its first clause — "is a volcano in Antarctica",
 * "is a city in", "is the second-largest island" — and the article *Geography*
 * does not.
 */
const PLACE_WORDS =
  'mount|mountain|peak|summit|massif|range|volcano|caldera|crater|cliff|' +
  'plateau|highland|ridge|glacier|icefield|river|stream|creek|delta|estuary|' +
  'lake|loch|lagoon|sea|ocean|bay|gulf|fjord|strait|waterfall|spring|' +
  'island|isle|archipelago|peninsula|cape|atoll|reef|coast|shore|beach|dune|' +
  'desert|steppe|savanna|tundra|forest|rainforest|jungle|woodland|grove|marsh|' +
  'swamp|wetland|valley|canyon|gorge|ravine|basin|plain|prairie|' +
  'salt flat|salt pan|salt lake|playa|mudflat|depression|sinkhole|cave|cavern|' +
  'city|cities|town|village|hamlet|settlement|municipality|borough|district|' +
  'quarter|neighbourhood|neighborhood|port|county|province|' +
  'prefecture|commune|capital|national park|nature reserve|exclusion zone|' +
  'temple|ruin|fortress|fort|castle|abbey|monastery|necropolis|' +
  'archaeological site|ghost town'

/**
 * A page about somewhere has to *name its kind of place*, and nothing weaker.
 *
 * The first version of this also accepted "opens by siting itself somewhere" —
 * `is a … in …` — on the theory that only a real place does that. Almost
 * everything does that. "Jeffrey Preston Bezos … is an American businessman, and
 * the founder … of Amazon" matches it, and so does "The Goths were a Germanic
 * people who played a major role in the fall of the Western Roman Empire". That
 * alternative is gone; the place word is now required.
 */
const PLACE_MEMBER = new RegExp(`\\b(?:${PLACE_WORDS})s?\\b`, 'i')

function namesAPlace(title: string, opening: string): boolean {
  return PLACE_MEMBER.test(`${title}. ${opening}`)
}

const SCOPES: Record<string, Scope> = {
  theorem: {
    hint: 'mathematics theorem',
    pattern: /theorem|lemma|corollar|conjectur|identit|inequalit|axiom|paradox|mathemat|algebra|geometr|topolog|number theory|calculus|probabilit|set theory|proof/i,
    rejects: /^(?:theorems?|lemmas?|corollar(?:y|ies)|conjectures?|axioms?|postulates?|proofs?|mathematical proof|mathematics|pure mathematics|applied mathematics|mathematical logic|logic|algebra|geometry|topology|number theory|calculus|probability(?: theory)?|statistics|set theory|category theory|graph theory|combinatorics|analysis(?: \(mathematics\))?|arithmetic|paradox|identity \(mathematics\)|inequality(?: \(mathematics\))?|equation|formula|function \(mathematics\)|mathematical notation|axiomatic system|theorem \(disambiguation\))$/i,
    framing: 'The statement itself',
  },
  phenomenon: {
    hint: 'science',
    pattern: /physic|chemistr|chemical|biolog|astronom|astrophys|cosmolog|geolog|meteorolog|thermodynam|quantum|optic|acoustic|electromagnet|evolution|neuroscien|scientific|phenomen|ecolog|particle|relativity|fluid|wave/i,
    rejects: /^(?:phenomenon|phenomena|natural phenomenon|science|natural science|physical science|the sciences|scientific method|scientific law|physical law|laws of science|physics|chemistry|biology|astronomy|cosmology|geology|meteorology|ecology|neuroscience|thermodynamics|optics|acoustics|mechanics|electromagnetism|quantum mechanics|matter|energy|nature|universe|research|experiment|measurement|observation)$/i,
    framing: 'What happens, and under what conditions',
  },
  organism: {
    hint: 'species',
    // Widened 2026-10-03: a man o' war, a sea angel and a slime mould were all out
    // of scope, because none of their pages or categories happens to use one of the
    // words above. `pattern` is the generous gate and the member test below is the
    // strict one, so the invertebrates belong here.
    pattern: /species|genus|taxa|taxonom|animal|plant|bird|insect|fish|fung|mammal|reptil|amphibian|mollusc|arthropod|flora|fauna|organism|bacteri|orchid|beetle|moth|spider|slug|snail|hydrozoa|cnidaria|siphonophor|ctenophor|echinoderm|bryozoa|rotifer|crustacean|cephalopod|annelid|nematod|protozoa|amoeb|myxomycet|slime mou?ld|algae|lichen/i,
    rejects: /^(?:species|subspecies|species concept|species complex|type species|organism|organisms|living things?|lifeform|life|biodiversity|biomass|animal|animals|plant|plants|fungus|fungi|microorganism|taxon|taxa|taxonomy(?: \(biology\))?|biological classification|scientific classification|binomial nomenclature|nomenclature|cladistics|phylogenetics|genus|genera|famil(?:y|ies) \(biology\)|order \(biology\)|class \(biology\)|phylum|kingdom \(biology\)|domain \(biology\)|clade|biology|zoology|botany|mycology|microbiology|ecology|evolution|natural selection|adaptation|fauna|flora|wildlife|breed|domestication)$/i,
    member: namesACreature,
    framing: 'The creature, or the one behaviour that matters',
  },
  place: {
    hint: 'geography',
    pattern: /geograph|cities|towns|villages|mountain|river|lake|island|desert|forest|valley|canyon|national park|landform|populated places|regions|coast|glacier|volcan|ruins|archaeolog/i,
    rejects: /^(?:place|places|location|geography|physical geography|human geography|topography|terrain|landform|landscape|biome|ecoregion|region|territory|settlement|human settlement|city|cities|town|village|mountain|mountains|hill|river|rivers|lake|lakes|sea|ocean|island|islands|desert|deserts|forest|forests|valley|canyon|coast|coastline|glacier|volcano|volcanoes|ruins|archaeology|archaeological site|continent|country|countries|nation|urban area|rural area|cartography|map)$/i,
    member: namesAPlace,
    framing: 'The place as it is, or one feature of it',
  },
}

export const KNOWLEDGE_MEDIA = Object.keys(SCOPES) as MediumId[]

export function isKnowledge(medium: string): boolean {
  return medium in SCOPES
}

const cache = makeCache<Offering[]>(30 * 60 * 1000)

/**
 * The defining clause of an article — where a page says what kind of thing it is
 * about, before it starts saying things about it.
 *
 * Exported for the tests. A period inside "pl.", "spp.", "e.g." or an initial is
 * not a sentence end, so a capital or an opening bracket is required after the
 * space; a split that finds nothing returns the text, because a member test on a
 * whole short intro is still better than a member test on nothing.
 */
export function firstSentence(raw: string): string {
  const text = (raw ?? '').replace(/\s+/g, ' ').trim()
  const match = /^.*?[.!?](?=\s+[A-Z(“"]|$)/.exec(text)
  // A "first sentence" longer than this is a failed split or a run-on, and the
  // defining clause is always near the front of one.
  return (match ? match[0] : text).slice(0, 320)
}

/**
 * Exported for the tests: scope is the part worth asserting, and it is pure.
 *
 * Three gates, and they refuse different things. `pattern` asks whether the page
 * is about the right subject — that one is generous, deliberately. `rejects` and
 * `member` ask the question `pattern` structurally cannot: whether this is a page
 * about a *member* of the medium or a page about the medium itself. Both are
 * curation and neither is honesty — every page all three refuse is still a real
 * page — but "Species" in answer to a grackle is a worse failure than a miss,
 * because a miss gets retried and a dull hit gets served.
 */
export function inScope(
  medium: string,
  page: { title?: string; extract?: string; categories?: { title?: string }[] },
): boolean {
  const scope = SCOPES[medium]
  if (!scope) return false

  const title = (page.title ?? '').trim()
  if (GENERIC_TITLE.test(title) || FIELD_TITLE.test(title) || scope.rejects.test(title)) return false

  const categories = (page.categories ?? []).map(c => c.title ?? '')
  const opening = firstSentence(page.extract ?? '')

  // Before any scope question: is this the kind of page any of these media offers?
  // Title and opening together, because a page sometimes states its kind in only
  // one of them — "Sea Peoples" says *peoples* in its title and "a purported
  // seafaring confederation" in its first sentence.
  const subject = `${title}. ${opening}`
  if (NOT_AN_OFFERING.some(p => p.test(subject))) return false
  if (categories.some(c => NOT_AN_OFFERING_CATEGORY.test(c))) return false

  const haystack = [title, page.extract ?? '', ...categories].join(' \n ')
  if (!scope.pattern.test(haystack)) return false

  if (scope.member && !scope.member(title, opening)) return false

  return true
}

/** Cut at a sentence boundary when there is one nearby, so a quote does not stop mid-clause. */
export function trimExtract(raw: string, max = MAX_EXTRACT): string {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  const window = text.slice(0, max)
  const lastStop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '))
  // Only honour a sentence break in the last third; otherwise it throws away more
  // than it tidies.
  if (lastStop > max * 0.6) return window.slice(0, lastStop + 1)
  return `${window.replace(/\s+\S*$/, '')}…`
}

function mapPage(medium: MediumId, page: any): Offering | null {
  const extract = typeof page?.extract === 'string' ? trimExtract(page.extract) : ''
  // No text is nothing to read, and a proposition you cannot read is not an
  // offering in a game about connecting things you can perceive.
  if (!page?.pageid || !page.title || !extract) return null

  const thumb = typeof page?.thumbnail?.source === 'string' ? page.thumbnail.source : null

  // Text, not image, even when a thumbnail exists: for every one of these media the
  // words are the content and the picture is decoration. The thumbnail rides along
  // in meta, which is where OfferingCard already looks for one.
  const perceptible: Perceptible = { kind: 'text', body: extract }

  return {
    medium,
    id: `wiki:${medium}:${page.pageid}`,
    title: page.title,
    // Nobody is the author of a theorem in the sense a song has an artist, and
    // naming Wikipedia here would put the encyclopedia in the slot where the
    // interpreter looks for a maker.
    attribution: null,
    framing: SCOPES[medium].framing,
    perceptible,
    sourceUrl: `https://en.wikipedia.org/?curid=${page.pageid}`,
    origin: 'catalogue',
    meta: {
      kind: KIND_LABEL[medium] ?? null,
      thumb,
    },
  }
}

/** What `context` on the card and `offeringLine` in the prompt show for these. */
const KIND_LABEL: Record<string, string> = {
  theorem: 'mathematics',
  phenomenon: 'science',
  organism: 'living thing',
  place: 'place',
}

/**
 * Bias the query toward the scope, but only when it does not already say so.
 *
 * "Noether's theorem" needs no help; "symmetry" does, and without it a theorem
 * search for a bare noun returns the disambiguation page for the noun.
 */
function scopedQuery(medium: string, term: string): string {
  const scope = SCOPES[medium]
  if (!scope) return term
  return scope.pattern.test(term) ? term : `${term} ${scope.hint}`
}

export async function searchKnowledge(
  medium: MediumId,
  q: string,
  limit = KNOWLEDGE_SEARCH_LIMIT,
): Promise<Offering[]> {
  const term = q.trim()
  if (!term || !SCOPES[medium]) return []

  // `exlimit=max` caps extracts at 20 pages per call, so the search limit cannot
  // exceed that without silently dropping text from the tail.
  const bounded = Math.max(1, Math.min(Math.trunc(limit) || KNOWLEDGE_SEARCH_LIMIT, 20))
  const key = `${medium}|${term.toLowerCase()}|${bounded}`
  const hit = cache.get(key)
  if (hit) return hit

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: scopedQuery(medium, term),
    gsrlimit: String(bounded),
    gsrnamespace: '0',
    prop: 'extracts|pageimages|categories',
    exintro: '1',
    explaintext: '1',
    exlimit: 'max',
    piprop: 'thumbnail',
    pithumbsize: '320',
    cllimit: 'max',
    clshow: '!hidden',
    redirects: '1',
  })

  const data = await getJson(PROVIDER, `${API}?${params}`, HEADERS)

  // A generator returns pages keyed by id, not in relevance order; `index` is the
  // search rank and is the only thing that restores it.
  const pages: any[] = Array.isArray(data?.query?.pages) ? data.query.pages : []
  const offerings = pages
    .slice()
    .sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0))
    .filter(p => inScope(medium, p))
    .map(p => mapPage(medium, p))
    .filter((o: Offering | null): o is Offering => !!o)

  cache.set(key, offerings)
  return offerings
}

/**
 * Re-fetch one record by id.
 *
 * Scope is deliberately NOT re-applied here. The honesty property is that the
 * record is real, and it is; scope decided what to *offer*, and re-litigating it on
 * lookup would let a category edit on Wikipedia invalidate a move a player already
 * chose from a list this server gave them.
 */
export async function lookupKnowledge(medium: MediumId, id: string): Promise<Offering | null> {
  const match = /^wiki:([a-z]+):(\d+)$/.exec(id)
  if (!match || match[1] !== medium || !SCOPES[medium]) return null

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    pageids: match[2],
    prop: 'extracts|pageimages|categories',
    exintro: '1',
    explaintext: '1',
    piprop: 'thumbnail',
    pithumbsize: '320',
    cllimit: 'max',
    clshow: '!hidden',
  })

  const data = await getJson(PROVIDER, `${API}?${params}`, HEADERS)
  const page = Array.isArray(data?.query?.pages) ? data.query.pages[0] : null
  return page ? mapPage(medium, page) : null
}

/**
 * Turn an interpreter's query into a real record.
 *
 * Two attempts rather than artwork's three, because there is no "Artist — Title"
 * convention to unpick here: a theorem is named, not attributed. What the second
 * attempt handles is an interpreter that wrote a name plus a gloss — "Noether's
 * theorem — conservation from symmetry" — where the part before the dash is the
 * searchable half.
 */
export async function resolveKnowledge(
  medium: MediumId,
  query: string,
  exclude: string[] = [],
): Promise<Offering | null> {
  const raw = query.trim()
  if (!raw || !SCOPES[medium]) return null

  const attempts = [raw]
  const dashSplit = raw.split(/\s+[-–—]\s+/)
  if (dashSplit.length >= 2 && dashSplit[0].trim()) attempts.push(dashSplit[0].trim())

  const excluded = new Set(exclude)
  for (const attempt of [...new Set(attempts)]) {
    let results: Offering[]
    try {
      results = await searchKnowledge(medium, attempt, 10)
    } catch (e) {
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const found = results.find(o => !excluded.has(o.id))
    if (found) return found
  }
  return null
}
