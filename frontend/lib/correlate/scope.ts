/**
 * The fourth registry — which *region* of a medium the partner may reach into.
 *
 * Media say what an offering can be made of. Relations say what a reply can do to
 * one. Tuning says in what proportion. None of them can say "music, but jazz" or
 * "a stretch, but for legs" — and those are the restrictions people actually
 * reach for, because a medium is not a flat space. Scope is that axis.
 *
 * The mechanism is not new. `lib/offerings/knowledge.ts` already carves four
 * media out of one provider with exactly two things: a **hint** folded into the
 * search, and a **pattern** deciding whether what came back belongs. This
 * generalises that pair and applies it to every medium that has an ontology worth
 * restricting.
 *
 * ── Honesty: what a scope can and cannot promise ──────────────────────────
 *
 * Tuning's weight-of-zero is arithmetic — the medium leaves the enum and a reply
 * landing there is refused. A scope cannot always be that, and pretending
 * otherwise would be the one thing this section does not do to a player. So every
 * facet declares which it is:
 *
 *   'checked'  The provider gives us the field, or the text is authored here, so
 *              a reply outside the scope is detected and discarded exactly like a
 *              search that found nothing — the ordinary miss, which the retry
 *              stage already knows how to answer.
 *   'guided'   The provider does not tell us, so the instruction goes in the
 *              prompt and the hint goes in the query, and that is the whole of
 *              it. The facet carries a `caveat` saying so, and the UI prints it.
 *
 * Music genre is the honest example: Deezer returns no genre, and fetching one
 * costs a second request per track for a single adjective (see offerings/music.ts).
 * So genre is guided and says it is. Music *era* is checked, because `resolveMusic`
 * already re-fetches the track by id and that response carries `release_date`.
 *
 * ── Where enforcement stops ───────────────────────────────────────────────
 *
 * Checked scopes bite on the interpreter's plan and on its one corrective retry.
 * They are **relaxed at salvage**, for the same reason a total mute is ignored by
 * `weightedReplyMedia`: the engine guarantees that a legal turn carries a real
 * reply, and a guarantee outranks a preference. A player who scoped themselves
 * into a corner gets an answer, not a dead chain.
 *
 * Empty is unrestricted, and the empty object is what an untouched session
 * stores — so the default costs nothing, says nothing, and spends no tokens.
 */

import type { MediumId, Offering } from './types'
import { getMedium } from './media'

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

/** Whether a facet can actually be enforced, or only asked for. */
export type Enforcement = 'checked' | 'guided'

export interface FacetOption {
  id: string
  /** What the player sees and what the prompt names. */
  label: string
  /**
   * Terms folded into a catalogued search so the restriction bites at the
   * provider rather than only in the prompt. Empty for composed media, which
   * have nothing to search.
   */
  hint: string
  /**
   * Decides whether a resolved offering belongs to this option. Generous on
   * purpose, for the reason knowledge.ts gives: a strict pattern produces a scope
   * that feels broken, a loose one produces a result the player can see and play
   * past. Required on a 'checked' facet, absent on a 'guided' one.
   */
  match?: RegExp
}

export interface Facet {
  id: string
  /** Shown as the control's heading. */
  name: string
  /** One line on what restricting this does, shown under the heading. */
  does: string
  enforcement: Enforcement
  /** Why it cannot be enforced. Required when guided, printed in the UI. */
  caveat?: string
  /**
   * The text a `match` is tested against. Defaults to everything legible about
   * the offering; narrowed where a broad haystack would produce false positives —
   * an era facet must read dates, not a title that happens to contain a year.
   */
  haystack?: (o: Offering) => string
  options: FacetOption[]
}

// ---------------------------------------------------------------------------
// Haystacks
// ---------------------------------------------------------------------------

/**
 * Everything legible about an offering, joined.
 *
 * Follows knowledge.ts's precedent of matching against title, text and metadata
 * together rather than one field: providers disagree about which field carries
 * the useful word, and a scope that only reads one of them is a scope that works
 * for one catalogue.
 */
export function offeringHaystack(o: Offering): string {
  const metaBits = Object.values(o.meta ?? {})
    .filter(v => typeof v === 'string' || typeof v === 'number')
    .join(' ')
  const text = o.perceptible?.kind === 'text' ? o.perceptible.body : ''
  return [o.title, o.attribution ?? '', o.framing ?? '', ...(o.steps ?? []), text, metaBits]
    .join(' \n ')
}

/** Dates only. An era facet reading a title would call Blade Runner 2049 a 21st-century film. */
const dateHaystack = (o: Offering): string =>
  [o.meta?.year, o.meta?.date, o.meta?.created].filter(Boolean).join(' ')

/** What a composed offering actually instructs someone to do. */
const actionHaystack = (o: Offering): string =>
  [o.title, ...(o.steps ?? []), o.framing ?? ''].join(' \n ')

// ---------------------------------------------------------------------------
// Shared ontologies
// ---------------------------------------------------------------------------

/**
 * Body regions, for the four composed media.
 *
 * Checked, and the check is real rather than a courtesy: a composed offering is
 * authored here, so its steps are the only evidence of what it asks a body to do
 * and they are evidence we hold. This is the same structural move performability
 * makes — judge what was written, never whether it is any good.
 */
/**
 * ONE CONSEQUENCE, AND IT IS INTENDED: a region scope requires a composed reply
 * to *name* its region.
 *
 * Two of the shipped vocabularies in offerings/composed.ts match no region at all
 * — "One angular phrase" is three abstract shapes, and "Slow descent" opens with
 * "choose any movement you can already do". Under a region scope both are
 * refused, because there is no evidence they do what was asked. Loosening the
 * patterns until they passed would have meant matching generic motion verbs, and
 * then a doorway chest opening counts as a leg stretch.
 *
 * Refusing is also the better game: told its region-neutral reply was out of
 * scope, the interpreter writes steps that say which part of the body moves,
 * which is more performable than what it wrote first. The prompt states the
 * requirement up front (see `describeScopes`) so this costs an instruction rather
 * than a retry. Player-facing vocabularies are unaffected — scope gates the
 * partner's replies, never what a player may offer.
 */
const BODY_REGIONS: FacetOption[] = [
  {
    id: 'legs',
    label: 'Legs & hips',
    hint: 'legs hips',
    // No bare "step". It is a leg action in isolation and a preposition-magnet in
    // practice: "step through until the chest lengthens" is a chest stretch, and
    // matching it here put a doorway chest opening inside a legs-only scope. The
    // anatomical words are specific enough on their own.
    match: /\b(leg|legs|knee|knees|hamstring|quad|quadricep|calf|calves|ankle|shin|hip|hips|glute|thigh|thighs|foot|feet|groin|squat|lunge)\w*/i,
  },
  {
    id: 'arms',
    label: 'Arms & hands',
    hint: 'arms hands',
    match: /\b(arm|arms|hand|hands|wrist|elbow|forearm|bicep|tricep|finger|fingers|palm|grip|reach|press)\w*/i,
  },
  {
    id: 'core',
    label: 'Core & torso',
    hint: 'core torso abdominal',
    match: /\b(core|torso|abdomen|abdominal|abs|oblique|waist|trunk|plank|brace|rib|ribs|breath|breathe|breathing|pelvis)\w*/i,
  },
  {
    id: 'back',
    label: 'Back & spine',
    hint: 'back spine',
    match: /\b(back|spine|spinal|lumbar|thoracic|vertebra|hinge|fold|arch|round|bend|arched)\w*/i,
  },
  {
    id: 'neck',
    label: 'Neck & shoulders',
    hint: 'neck shoulders',
    match: /\b(neck|shoulder|shoulders|collarbone|clavicle|trapezius|scapula|chest|head|gaze|chin|jaw)\w*/i,
  },
  {
    id: 'whole',
    label: 'Whole body',
    hint: 'whole body',
    // Deliberately narrower than "anything involving a body". The first version
    // matched stand/step/turn/body, which made this option accept nearly every
    // composed offering — and since options within a facet are OR'd, a player who
    // picked only "whole body" would have had no restriction at all.
    match: /\b(whole body|full body|entire body|head to toe|travel|walk|walking|jump|jumping|balance|posture|weight shift|shift weight)\w*/i,
  },
]

/** How much a body is asked to do, and from where. The accessibility axis. */
const SUPPORT: FacetOption[] = [
  { id: 'standing', label: 'Standing', hint: 'standing', match: /\b(stand|standing|upright|on your feet|step|walk)\w*/i },
  { id: 'seated',   label: 'Seated',   hint: 'seated',   match: /\b(sit|sitting|seated|chair|stool|bench)\w*/i },
  { id: 'floor',    label: 'On the floor', hint: 'floor mat', match: /\b(floor|ground|mat|lie|lying|supine|prone|kneel|kneeling|all fours)\w*/i },
  { id: 'supported', label: 'Against something', hint: 'wall doorway chair support', match: /\b(wall|doorway|doorframe|chair|table|counter|support|supported|hold on|railing)\w*/i },
]

/** Four-digit-year patterns, reused by every era facet. */
const YEAR = {
  pre1900:  /\b(1[0-8]\d{2})\b|\bBC\b|\bB\.C\b|\bancient\b/i,
  c19:      /\b18\d{2}\b|\b1800s\b/i,
  c20early: /\b19[0-4]\d\b|\b1900s\b/i,
  mid:      /\b19[5-7]\d\b/,
  late:     /\b19[89]\d\b/,
  c21:      /\b20[0-1]\d\b/,
  now:      /\b202\d\b/,
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

/**
 * Facets by medium. A medium absent from here simply has no scope control, which
 * is a real answer rather than a gap:
 *
 *  - `passage` is the reader's own library. Restricting it would be restricting
 *    what somebody has already chosen to read, and the library is small enough
 *    that a scope would usually empty it.
 */
export const FACETS: Partial<Record<MediumId, Facet[]>> = {
  music: [
    {
      id: 'genre',
      name: 'Genre',
      does: 'Which part of the catalogue your partner reaches into.',
      enforcement: 'guided',
      caveat:
        'Deezer does not return a genre, so this steers the search and the instruction ' +
        'rather than filtering what comes back. Expect it to lean, not to obey.',
      options: [
        { id: 'rock',       label: 'Rock',           hint: 'rock' },
        { id: 'pop',        label: 'Pop',            hint: 'pop' },
        { id: 'hiphop',     label: 'Hip hop',        hint: 'hip hop rap' },
        { id: 'electronic', label: 'Electronic',     hint: 'electronic techno house' },
        { id: 'ambient',    label: 'Ambient & drone', hint: 'ambient drone' },
        { id: 'jazz',       label: 'Jazz',           hint: 'jazz' },
        { id: 'classical',  label: 'Classical',      hint: 'classical orchestral' },
        { id: 'folk',       label: 'Folk & acoustic', hint: 'folk acoustic' },
        { id: 'soul',       label: 'Soul & R&B',     hint: 'soul r&b funk' },
        { id: 'metal',      label: 'Metal & punk',   hint: 'metal punk hardcore' },
        { id: 'country',    label: 'Country',        hint: 'country americana' },
        { id: 'global',     label: 'Outside the anglophone world', hint: 'world traditional' },
      ],
    },
    {
      id: 'era',
      name: 'Era',
      does: 'When the recording is from.',
      enforcement: 'checked',
      haystack: dateHaystack,
      options: [
        { id: 'pre60',  label: 'Before 1950',  hint: '1940s', match: /\b(1[0-8]\d{2}|19[0-4]\d)\b/ },
        { id: 'mid',    label: '1950s–70s',    hint: '1960s', match: YEAR.mid },
        { id: 'late',   label: '1980s–90s',    hint: '1980s', match: YEAR.late },
        { id: 'c21',    label: '2000s–2010s',  hint: '2000s', match: YEAR.c21 },
        { id: 'now',    label: '2020s',        hint: '2020s', match: YEAR.now },
      ],
    },
  ],

  artwork: [
    {
      id: 'form',
      name: 'Form',
      does: 'What kind of object it is.',
      enforcement: 'checked',
      options: [
        { id: 'painting',   label: 'Painting',    hint: 'painting',   match: /\bpainting|oil on|tempera|acrylic|canvas|panel\b/i },
        { id: 'sculpture',  label: 'Sculpture',   hint: 'sculpture',  match: /\bsculptur|carv|bronze|marble|statue|relief\b/i },
        { id: 'print',      label: 'Print',       hint: 'print',      match: /\bprint|etching|engrav|woodcut|lithograph|screenprint|woodblock\b/i },
        { id: 'drawing',    label: 'Drawing',     hint: 'drawing',    match: /\bdrawing|sketch|charcoal|graphite|pastel|ink on paper\b/i },
        { id: 'photograph', label: 'Photograph',  hint: 'photograph', match: /\bphotograph|gelatin silver|daguerreotype|albumen\b/i },
        { id: 'textile',    label: 'Textile',     hint: 'textile',    match: /\btextile|tapestr|embroider|weav|woven|silk|cloth|garment|robe\b/i },
        { id: 'vessel',     label: 'Ceramic & vessel', hint: 'ceramic vessel', match: /\bceramic|porcelain|earthenware|stoneware|vessel|vase|jar|bowl|pottery\b/i },
        { id: 'metalwork',  label: 'Metalwork & jewellery', hint: 'metalwork jewelry', match: /\bjewel|gold|silver|metalwork|bronze vessel|ornament|pendant|brooch\b/i },
      ],
    },
    {
      id: 'era',
      name: 'Era',
      does: 'When it was made.',
      enforcement: 'checked',
      haystack: dateHaystack,
      options: [
        { id: 'ancient',  label: 'Ancient',          hint: 'ancient',           match: YEAR.pre1900 },
        { id: 'c19',      label: '19th century',     hint: '19th century',      match: YEAR.c19 },
        { id: 'c20early', label: 'Early 20th century', hint: 'early 20th century', match: YEAR.c20early },
        { id: 'postwar',  label: 'Post-war',         hint: 'postwar modern',    match: /\b19[5-7]\d\b/ },
        { id: 'contemporary', label: 'Contemporary', hint: 'contemporary',      match: /\b(19[89]\d|20\d{2})\b/ },
      ],
    },
    {
      id: 'culture',
      name: 'Where from',
      does: 'The tradition it belongs to.',
      enforcement: 'checked',
      options: [
        { id: 'europe',   label: 'Europe',            hint: 'European',  match: /\b(europe|european|french|italian|dutch|flemish|german|spanish|british|english|greek|roman|russian)\w*/i },
        { id: 'americas', label: 'The Americas',      hint: 'American',  match: /\b(america|american|mexic|andean|inca|maya|aztec|brazil|canadian|peruvian)\w*/i },
        { id: 'eastasia', label: 'East Asia',         hint: 'Chinese Japanese Korean', match: /\b(china|chinese|japan|japanese|korea|korean|tibet|mongol)\w*/i },
        { id: 'southasia', label: 'South & Southeast Asia', hint: 'Indian Southeast Asian', match: /\b(india|indian|nepal|thai|thailand|cambodi|khmer|vietnam|indonesi|javanese|burmese|sri lanka)\w*/i },
        { id: 'africa',   label: 'Africa',            hint: 'African',   match: /\b(africa|african|egypt|egyptian|nigeria|yoruba|benin|congo|mali|ethiop|ashanti)\w*/i },
        { id: 'westasia', label: 'West Asia & the Islamic world', hint: 'Islamic Persian', match: /\b(islam|islamic|persia|persian|iran|turk|ottoman|arab|syria|mesopotam|assyr)\w*/i },
      ],
    },
  ],

  scene: [
    {
      id: 'form',
      name: 'Form',
      does: 'A film or a series.',
      enforcement: 'checked',
      haystack: o => String(o.meta?.kind ?? ''),
      options: [
        { id: 'film',   label: 'Film',   hint: 'film',   match: /film/i },
        { id: 'series', label: 'Series', hint: 'series', match: /series/i },
      ],
    },
    {
      id: 'era',
      name: 'Era',
      does: 'When it was released.',
      enforcement: 'checked',
      haystack: dateHaystack,
      options: [
        { id: 'classic', label: 'Before 1970', hint: 'classic', match: /\b(19[0-6]\d)\b/ },
        { id: 'late',    label: '1970s–90s',   hint: '1980s',   match: /\b19[789]\d\b/ },
        { id: 'c21',     label: '2000s–2010s', hint: '2000s',   match: YEAR.c21 },
        { id: 'now',     label: '2020s',       hint: 'recent',  match: YEAR.now },
      ],
    },
  ],

  theorem: [
    {
      id: 'branch',
      name: 'Branch',
      does: 'Which part of mathematics.',
      enforcement: 'checked',
      options: [
        { id: 'algebra',  label: 'Algebra',               hint: 'algebra group ring', match: /\b(algebra|group|ring|field|module|galois|matrix|linear|vector space|representation)\w*/i },
        { id: 'geometry', label: 'Geometry & topology',   hint: 'geometry topology',  match: /\b(geometr|topolog|manifold|curvature|euclid|knot|surface|homolog|homotop|differential)\w*/i },
        { id: 'number',   label: 'Number theory',         hint: 'number theory',      match: /\b(number theor|prime|diophantin|modular|congruen|zeta|arithmetic|integer)\w*/i },
        { id: 'analysis', label: 'Analysis & calculus',   hint: 'analysis calculus',  match: /\b(analysis|calculus|derivative|integral|limit|series|convergen|measure|fourier|differential equation)\w*/i },
        { id: 'probability', label: 'Probability & statistics', hint: 'probability',  match: /\b(probabilit|statistic|random|stochastic|distribution|expectation|markov|bayes)\w*/i },
        { id: 'logic',    label: 'Logic & set theory',    hint: 'logic set theory',   match: /\b(logic|set theor|cardinal|ordinal|incompleteness|computab|decidab|axiom|proof theor|model theor)\w*/i },
        { id: 'discrete', label: 'Combinatorics & graphs', hint: 'combinatorics graph', match: /\b(combinator|graph|counting|pigeonhole|ramsey|matching|colour|coloring|tree|network)\w*/i },
      ],
    },
  ],

  phenomenon: [
    {
      id: 'discipline',
      name: 'Discipline',
      does: 'Which science.',
      enforcement: 'checked',
      options: [
        { id: 'physics',   label: 'Physics',            hint: 'physics',   match: /\b(physic|quantum|relativ|thermodynam|mechanic|optic|acoustic|electromagnet|particle|wave|energy|force|entropy)\w*/i },
        { id: 'chemistry', label: 'Chemistry',          hint: 'chemistry', match: /\b(chemist|chemical|molecul|reaction|catalys|bond|element|compound|acid|solvent|crystal)\w*/i },
        { id: 'biology',   label: 'Biology',            hint: 'biology',   match: /\b(biolog|cell|gene|genetic|protein|enzyme|evolution|metabol|organism|immun|bacteri|virus)\w*/i },
        { id: 'earth',     label: 'Earth & climate',    hint: 'geology climate', match: /\b(geolog|climate|weather|atmospher|ocean|tecton|volcan|erosion|glacier|mineral|seismic)\w*/i },
        { id: 'space',     label: 'Astronomy & space',  hint: 'astronomy', match: /\b(astronom|astrophys|cosmolog|star|stellar|galax|planet|orbit|nebula|black hole|supernova)\w*/i },
        { id: 'mind',      label: 'Mind & perception',  hint: 'neuroscience perception', match: /\b(neuro|brain|cognit|percept|psycholog|memory|conscious|illusion|synapse|sensory)\w*/i },
      ],
    },
  ],

  organism: [
    {
      id: 'group',
      name: 'Group',
      does: 'Which kind of living thing.',
      enforcement: 'checked',
      options: [
        { id: 'mammals',  label: 'Mammals',            hint: 'mammal',  match: /\b(mammal|primate|rodent|bat|whale|cetacean|feline|canine|ungulate|marsupial|bear|cat|dog|deer|seal)\w*/i },
        { id: 'birds',    label: 'Birds',              hint: 'bird',    match: /\b(bird|avian|passerine|raptor|owl|corvid|parrot|finch|heron|gull|penguin|hawk|eagle)\w*/i },
        { id: 'sea',      label: 'Fish & sea life',    hint: 'fish marine', match: /\b(fish|shark|ray|eel|coral|jellyfish|octopus|squid|cephalopod|crustacean|crab|marine|reef|mollusc)\w*/i },
        { id: 'insects',  label: 'Insects & arthropods', hint: 'insect', match: /\b(insect|arthropod|beetle|moth|butterfl|ant|bee|wasp|spider|arachnid|dragonfl|mantis|cicada)\w*/i },
        { id: 'plants',   label: 'Plants',             hint: 'plant',   match: /\b(plant|tree|flower|orchid|fern|moss|grass|conifer|angiosperm|leaf|root|seed|vine|shrub)\w*/i },
        { id: 'small',    label: 'Fungi & microbes',   hint: 'fungus',  match: /\b(fungus|fungi|mushroom|lichen|mould|mold|yeast|bacteri|microb|archaea|protist|slime mould)\w*/i },
        { id: 'herps',    label: 'Reptiles & amphibians', hint: 'reptile amphibian', match: /\b(reptil|amphibian|snake|lizard|turtle|tortoise|crocodil|frog|toad|salamander|newt|gecko)\w*/i },
      ],
    },
  ],

  place: [
    {
      id: 'kind',
      name: 'Kind of place',
      does: 'What sort of landscape or settlement.',
      enforcement: 'checked',
      options: [
        { id: 'high',   label: 'Mountains & highlands', hint: 'mountain', match: /\b(mountain|peak|summit|range|alpine|highland|plateau|ridge|volcano|cliff)\w*/i },
        { id: 'water',  label: 'Rivers, lakes & coasts', hint: 'river lake coast', match: /\b(river|lake|coast|sea|ocean|bay|fjord|delta|estuar|waterfall|island|lagoon|shore)\w*/i },
        { id: 'dry',    label: 'Desert & dryland',      hint: 'desert',   match: /\b(desert|arid|dune|steppe|savanna|badland|salt flat|oasis|scrub)\w*/i },
        { id: 'green',  label: 'Forest & jungle',       hint: 'forest',   match: /\b(forest|jungle|rainforest|woodland|taiga|grove|canopy|wetland|swamp|marsh)\w*/i },
        { id: 'built',  label: 'Cities & settlements',  hint: 'city',     match: /\b(city|cities|town|village|settlement|urban|district|quarter|street|metropol|port)\w*/i },
        { id: 'ruins',  label: 'Ruins & archaeology',   hint: 'ruins archaeological', match: /\b(ruin|archaeolog|ancient site|temple|abandoned|excavat|necropolis|fort|monument)\w*/i },
        { id: 'ice',    label: 'Ice & polar',           hint: 'glacier polar', match: /\b(glacier|ice|polar|arctic|antarctic|tundra|permafrost|iceberg|snowfield)\w*/i },
      ],
    },
  ],

  gesture:  [{ id: 'region', name: 'Body region', does: 'Which part of the body the gesture uses.', enforcement: 'checked', haystack: actionHaystack, options: BODY_REGIONS }],
  movement: [{ id: 'region', name: 'Body region', does: 'Which part of the body the movement uses.', enforcement: 'checked', haystack: actionHaystack, options: BODY_REGIONS }],

  stretch: [
    { id: 'region',  name: 'Body region', does: 'Where the stretch is felt.', enforcement: 'checked', haystack: actionHaystack, options: BODY_REGIONS },
    { id: 'support', name: 'Position',    does: 'What the body is doing to hold itself up.', enforcement: 'checked', haystack: actionHaystack, options: SUPPORT },
  ],

  exercise: [
    { id: 'region',  name: 'Body region', does: 'What the effort is asked of.', enforcement: 'checked', haystack: actionHaystack, options: BODY_REGIONS },
    { id: 'support', name: 'Position',    does: 'What the body is doing to hold itself up.', enforcement: 'checked', haystack: actionHaystack, options: SUPPORT },
  ],
}

export function facetsFor(medium: MediumId): Facet[] {
  return FACETS[medium] ?? []
}

export function getFacet(medium: MediumId, facetId: string): Facet | null {
  return facetsFor(medium).find(f => f.id === facetId) ?? null
}

/** Media that have anything to restrict, in the order the picker shows them. */
export function scopableMedia(media: MediumId[]): MediumId[] {
  return media.filter(m => facetsFor(m).length > 0)
}

// ---------------------------------------------------------------------------
// The value
// ---------------------------------------------------------------------------

/**
 * What the player has restricted, canonically: medium → facet → chosen option
 * ids. Only non-empty selections are stored, so `{}` is "anything", which is the
 * state a session is created in.
 *
 * Options within one facet are an OR — picking jazz and ambient means either is
 * welcome. Facets are an AND — jazz *and* from the 1970s. That is the reading
 * everyone expects from a set of filter chips, and the prompt says it out loud so
 * the interpreter reads it the same way.
 */
export type Scopes = Partial<Record<MediumId, Record<string, string[]>>>

export function isUnscoped(scopes: Scopes): boolean {
  return Object.keys(scopes).length === 0
}

export function selectedOptions(scopes: Scopes, medium: MediumId, facetId: string): string[] {
  return scopes[medium]?.[facetId] ?? []
}

/** Every option id a facet offers, deduped — used to detect "all of them", which is none of them. */
const allOptionIds = (facet: Facet) => facet.options.map(o => o.id)

/**
 * Coerce whatever is in the database or a request body into Scopes.
 *
 * Canonicalising is the point, exactly as it is for tuning: unknown media,
 * unknown facets and unknown options are dropped, and a facet where every option
 * is selected is dropped too — restricting to everything is not a restriction,
 * and storing it would make `isUnscoped` lie.
 */
export function normalizeScopes(raw: unknown, media: MediumId[]): Scopes {
  const out: Scopes = {}
  if (!raw || typeof raw !== 'object') return out

  for (const [mediumId, facetMap] of Object.entries(raw as Record<string, unknown>)) {
    const medium = mediumId as MediumId
    if (!media.includes(medium) || !getMedium(medium)) continue
    if (!facetMap || typeof facetMap !== 'object') continue

    const kept: Record<string, string[]> = {}
    for (const [facetId, value] of Object.entries(facetMap as Record<string, unknown>)) {
      const facet = getFacet(medium, facetId)
      if (!facet || !Array.isArray(value)) continue

      const valid = allOptionIds(facet)
      const chosen = Array.from(new Set(
        value.filter((v): v is string => typeof v === 'string' && valid.includes(v)),
      ))
      // Nothing selected is unrestricted; everything selected is also
      // unrestricted, and conflating them keeps one meaning of "empty".
      if (chosen.length === 0 || chosen.length === valid.length) continue
      // Store in registry order, so two equivalent selections are the same JSON
      // and a preset compares equal to the state it was saved from.
      kept[facetId] = valid.filter(id => chosen.includes(id))
    }

    if (Object.keys(kept).length > 0) out[medium] = kept
  }

  return out
}

// ---------------------------------------------------------------------------
// Enforcement
// ---------------------------------------------------------------------------

/**
 * Does this offering satisfy the scope set for its medium?
 *
 * True when there is nothing to check — no scope, or only guided facets, or a
 * facet whose chosen options carry no pattern. Being permissive in the unknown
 * case is deliberate: a scope that cannot be verified must not be able to
 * *reject*, or a guided preference would quietly become a filter that throws away
 * good replies for no stated reason.
 */
export function satisfiesScope(o: Offering, scopes: Scopes): boolean {
  const perMedium = scopes[o.medium]
  if (!perMedium) return true

  for (const [facetId, chosen] of Object.entries(perMedium)) {
    const facet = getFacet(o.medium, facetId)
    if (!facet || facet.enforcement !== 'checked' || chosen.length === 0) continue

    const options = facet.options.filter(opt => chosen.includes(opt.id) && opt.match)
    if (options.length === 0) continue

    const hay = (facet.haystack ?? offeringHaystack)(o)
    // Options within a facet are an OR; facets are an AND. One facet failing is
    // enough to make the whole thing a miss.
    if (!options.some(opt => opt.match!.test(hay))) return false
  }

  return true
}

/** Why a reply was out of scope, for the log. Never shown as an error. */
export function describeScopeMiss(o: Offering, scopes: Scopes): string {
  const perMedium = scopes[o.medium] ?? {}
  const failed: string[] = []

  for (const [facetId, chosen] of Object.entries(perMedium)) {
    const facet = getFacet(o.medium, facetId)
    if (!facet || facet.enforcement !== 'checked') continue
    const options = facet.options.filter(opt => chosen.includes(opt.id) && opt.match)
    if (options.length === 0) continue
    const hay = (facet.haystack ?? offeringHaystack)(o)
    if (!options.some(opt => opt.match!.test(hay))) {
      failed.push(`${facet.name.toLowerCase()} is not ${options.map(o2 => o2.label.toLowerCase()).join(' or ')}`)
    }
  }

  return failed.length > 0
    ? `"${o.title}" is out of scope: ${failed.join('; ')}`
    : `"${o.title}" is out of scope`
}

/**
 * Terms to fold into a catalogued search, so a restriction reaches the provider
 * instead of only the model.
 *
 * This is the half of the mechanism that makes a *guided* facet worth having at
 * all: nothing can verify that a Deezer track is jazz, but searching for "jazz"
 * alongside the query reliably returns jazz. Capped at two facets' worth, because
 * a query buried in qualifiers stops matching the thing it was actually naming.
 */
export function scopeHints(medium: MediumId, scopes: Scopes): string[] {
  const perMedium = scopes[medium]
  if (!perMedium) return []

  const hints: string[] = []
  for (const facet of facetsFor(medium)) {
    const chosen = perMedium[facet.id] ?? []
    if (chosen.length === 0) continue
    // Only one option's hint per facet. Two genres ORed together into one query
    // searches for neither.
    const first = facet.options.find(opt => chosen.includes(opt.id) && opt.hint)
    if (first) hints.push(first.hint)
    if (hints.length === 2) break
  }
  return hints
}

/** A query with the scope's search terms folded in. Unchanged when unscoped. */
export function applyScopeToQuery(medium: MediumId, query: string, scopes: Scopes): string {
  const hints = scopeHints(medium, scopes)
  if (hints.length === 0) return query
  return `${query} ${hints.join(' ')}`.trim()
}

// ---------------------------------------------------------------------------
// Prompt text
// ---------------------------------------------------------------------------

const optionLabels = (facet: Facet, chosen: string[]) =>
  facet.options.filter(o => chosen.includes(o.id)).map(o => o.label.toLowerCase()).join(' or ')

/**
 * The scope, as a block of prompt. Empty when unrestricted.
 *
 * Checked and guided facets are told apart on purpose. The interpreter is a
 * better partner when it knows which of its instructions will be mechanically
 * enforced — the same reason the muted-media rule is stated as arithmetic rather
 * than as a preference.
 */
export function describeScopes(scopes: Scopes, media: MediumId[]): string {
  if (isUnscoped(scopes)) return ''

  const blocks: string[] = []
  let anyChecked = false
  /** Set when a composed medium is narrowed, which carries an extra requirement. */
  let anyComposed = false

  for (const medium of media) {
    const perMedium = scopes[medium]
    if (!perMedium) continue

    const lines: string[] = []
    for (const facet of facetsFor(medium)) {
      const chosen = perMedium[facet.id] ?? []
      if (chosen.length === 0) continue
      if (getMedium(medium)?.origin === 'composed') anyComposed = true
      const labels = optionLabels(facet, chosen)
      if (facet.enforcement === 'checked') {
        anyChecked = true
        lines.push(`  - ${facet.name}: ${labels}. ENFORCED — a reply outside this is discarded.`)
      } else {
        lines.push(`  - ${facet.name}: ${labels}.`)
      }
    }

    if (lines.length > 0) {
      blocks.push(`${getMedium(medium)?.plural ?? medium}:\n${lines.join('\n')}`)
    }
  }

  if (blocks.length === 0) return ''

  return `WHERE IN EACH MEDIUM YOU MAY REACH
The player has narrowed some media. Within one line the options are alternatives —
any of them is fine. Across lines they all apply at once.

${blocks.join('\n')}
${anyChecked ? `
The lines marked ENFORCED are checked after your reply is resolved, and a reply
that fails one is thrown away exactly like a search that found nothing. Treat them
as part of the schema, not as a preference.
` : ''}${anyComposed ? `
For a composed medium the check reads your own steps, so a narrowed facet means
your steps must SAY which part of the body is doing the work. "Choose any movement
you can already do" and "make three angular shapes" name no region and are
discarded under a region scope, however good they are otherwise. Name the part,
then say what it does.
` : ''}
This narrows what you reach *for*. It does not narrow what the player may play,
and it does not change what makes a connection hold. If the move itself sits
outside these bounds, read it normally and answer it from inside them.`
}

/** One short line for the player's own display. Empty when unrestricted. */
export function scopeSummary(scopes: Scopes, media: MediumId[]): string {
  if (isUnscoped(scopes)) return ''
  const bits: string[] = []

  for (const medium of media) {
    const perMedium = scopes[medium]
    if (!perMedium) continue
    const labels: string[] = []
    for (const facet of facetsFor(medium)) {
      const chosen = perMedium[facet.id] ?? []
      if (chosen.length > 0) labels.push(optionLabels(facet, chosen))
    }
    if (labels.length > 0) {
      bits.push(`${(getMedium(medium)?.plural ?? medium).toLowerCase()}: ${labels.join(', ')}`)
    }
  }

  return bits.join(' · ')
}
