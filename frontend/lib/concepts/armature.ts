/**
 * The Armature — mathematics as a place you can walk.
 *
 * Each of the 21 major spheres of influence carries one area of the concept
 * map, so the nineteen areas in `atlas.ts` acquire a geography. The model is
 * Logical Journey of the Zoombinis: a region is not a place that happens to
 * contain a puzzle, it is a place whose character IS one idea.
 *
 * ── THE NAME ──────────────────────────────────────────────────────────────
 *
 * Derived from Armat Sur, the tabletop setting this geography and all 21 of
 * its city names come from, and deliberately not the same word — this is a
 * learning surface and that is a game, and the two should not be mistaken for
 * each other.
 *
 * "Armature" was chosen over the other derivations because it happens to mean
 * the right thing. An armature is the internal framework a sculpted form is
 * modelled onto: invisible in the finished piece, and the only reason the
 * finished piece stands up. That is what a prerequisite graph is to a subject,
 * so the name says what the thing is rather than only where it came from.
 *
 * The map image still carries its original title, because it is the original
 * drawing and redrawing it to hide that would be worse than crediting it.
 *
 * ── WHY THIS IS WORTH HAVING HERE AND NOT ONLY IN THE GAME ────────────────
 *
 * The atlas is a list of nineteen areas and two hundred concepts, and a list
 * is the one shape that cannot answer "where am I and what is near me". The
 * map can. It also makes COVERAGE visible as terrain: `regionCoverage` reads
 * the real `atlasCoverage`, so the parts of mathematics nothing is written for
 * are a thin scatter of pins rather than a number in a table — and
 * Nadda-zalan, the frontier region that teaches nothing, stops being a
 * conceit and starts being literally true.
 *
 * ── THE DIFFERENCE FROM THE GAME'S COPY ───────────────────────────────────
 *
 * The armat-sur session runner carries this same table as a dated SNAPSHOT of
 * area and concept ids, because it plays offline from a Python stdlib server
 * and cannot reach a Cloudflare worker. Here there is no such constraint:
 * `AREAS` is imported, and `armatureProblems()` fails the build-time check if a
 * region names an area that does not exist. The snapshot's whole failure mode
 * — ids rotting silently under a rename — cannot happen on this side.
 *
 * So if the two ever disagree, THIS one is right. The game's copy is the one
 * that needs re-syncing.
 *
 * ── WHAT THIS DOES NOT ENCODE ─────────────────────────────────────────────
 *
 * Not the prerequisite order of mathematics. `km` is distance from the
 * continental center and travelling outward broadly runs rules → structure →
 * change → analysis, but it is a storyteller's escalation and not a
 * curriculum: Schalfrend holds a foundation at 6200 km. The authoritative
 * order is `gatingPrerequisitesOf` in registry.ts, which walks real `needs`
 * edges and looks through unwritten nodes. Nothing here may gate anything.
 */

import { AREAS, type AtlasCoverage } from './atlas'

/** The image, and its intrinsic size — marker positions are fractions of it. */
export const ARMATURE_MAP = {
  src: '/armature/world-map.png',
  width: 1392,
  height: 1130,
} as const

/**
 * The continental center, the origin every distance in the setting is measured
 * from ("4300 km from the continental center").
 *
 * Placed at Mt. Lumingrad, which the map draws north-east of the Central Sea.
 * The two regions nearest the center — Ringed Mountains at 900 km and Hasspab
 * at 1000 km — sit either side of it, which is the check that it is right.
 *
 * It matters because the compass bearings in the source material are relative
 * to THIS point rather than to the middle of the picture. Kalvent is "south
 * western" while sitting slightly above the image's vertical center.
 */
export const ARMATURE_CENTER = { x: 0.600, y: 0.375 } as const

/** What a region does with mathematics. Two of the 21 do none. */
export type RegionRole = 'teaching' | 'broker' | 'frontier'

export interface Region {
  id: string
  name: string
  epithet: string
  /** Distance from the continental center, in km, per the source material. */
  km: number
  /** An area id from `AREAS`. Absent for the two that teach nothing. */
  area?: string
  /**
   * Authored subjects (`ONTOLOGIES`) whose material belongs to this place.
   *
   * ── Why this field has to exist ───────────────────────────────────────
   *
   * The atlas is two partitions, not one. `AREAS` are the nineteen mapped
   * areas, every one of which is unwritten by construction — a map node
   * carries no knowledge points. The ten authored subjects are siblings of
   * them in the composed graph, and they hold ALL 62 written concepts.
   *
   * So a map that only knew about `area` would shade every region "nothing
   * written" and be a picture of exactly the half of mathematics there is
   * nothing in. A test caught that; it is the reason this field was added.
   *
   * The attribution is EDITORIAL and local to this file. `atlas.ts`
   * deliberately keeps the two partitions apart, and nothing here changes
   * that — `regionCoverage` adds the counts up for display and no walk,
   * gate or prerequisite reads it. `armatureProblems` checks that every
   * authored subject is claimed exactly once, so a newly authored subject
   * cannot quietly fail to appear anywhere on the map.
   */
  authored?: string[]
  /** Concepts this place is most characteristically about. Must be in `area`. */
  anchors?: string[]
  role?: RegionRole
  /**
   * Why this mathematics belongs to this place.
   *
   * The load-bearing field, and the only one that is an opinion. Every
   * assignment was drawn from a city's most distinctive institution, and the
   * sentence is stored so the choice can be argued with — a reader who thinks
   * Hasspab should hold statistics rather than number theory needs to see the
   * claim in order to reject it. Change `area` and `because` together or this
   * file starts lying.
   */
  because: string
  /**
   * Position on the map, as a fraction of its width and height.
   *
   * Read off the drawn map by eye, off the red dot its own key calls "major
   * city / settlement" — a different KIND of claim from everything above,
   * which came out of the setting's prose. Approximate on purpose: the map
   * prints "Terrain and distances are approximate" in its key, and a marker
   * needs to land on the right coastline, not the right pixel. The test that
   * guards them checks each against the region's stated compass bearing from
   * `ARMATURE_CENTER`, which catches a region placed on the wrong side of the
   * world without claiming a precision neither source has.
   */
  xy: { x: number; y: number }
}

export const REGIONS: Region[] = [
  {
    id: 'ringed-mountains', name: 'Ringed Mountains', epithet: 'Land of The Golden Dragon',
    km: 900, area: 'algebra-foundations', xy: { x: 0.647, y: 0.301 },
    // Three authored subjects land here: the rules of number, the manipulation
    // of expressions, and the rational expressions built out of both.
    authored: ['arithmetic-foundations', 'expressions-and-equations', 'rational-expressions'],
    anchors: ['word-problems', 'linear-inequalities', 'absolute-value'],
    because: 'The Golden Scribes are trained at Zurramat\'s palace in literacy, rhetoric and "the principles of the golden law" — the rules every other region\'s practice is then interpreted under. The centre of the continent holds the rules everything else is derived from.',
  },
  {
    id: 'hasspab', name: 'Hasspab', epithet: 'The Aether Sepulcher',
    km: 1000, area: 'number-theory', xy: { x: 0.551, y: 0.449 },
    anchors: ['division-algorithm', 'modular-arithmetic', 'prime-distribution'],
    because: 'Mage-priests read divine law off a sepulcher of basalt and desert glass cut down into bedrock. Number theory is the mathematics that feels found rather than built, inscribed rather than invented — which is how Hasspab treats its law.',
  },
  {
    id: 'druuvruke', name: 'Druuvruke', epithet: 'Mountains Of Steeled Green',
    km: 1500, area: 'euclidean-geometry', xy: { x: 0.438, y: 0.331 },
    // Solids with the plane: the Stone Diggers cut in three dimensions.
    authored: ['plane-geometry', 'solid-measure'],
    // `distance-and-midpoint` was the middle anchor until it was authored into
    // `plane-geometry`. An anchor must be a node of `area`, so a promotion
    // empties the slot rather than leaving it — and `armatureProblems` says so
    // loudly, which is the one check this table has that the game's copy does
    // not. `isometries-and-symmetry` replaces it: still synthetic, still about
    // what a cut preserves, and still in the area.
    anchors: ['constructions', 'isometries-and-symmetry', 'lines-in-the-plane'],
    because: 'The Stone Digger Guild cuts straight lines through mountains for a living, under elected assemblies that have to agree where the line goes. Compass, straightedge, and an argument about measurement.',
  },
  {
    id: 'krull', name: 'Krull', epithet: 'The Stalwart Machine',
    km: 1900, area: 'linear-algebra', xy: { x: 0.535, y: 0.164 },
    authored: ['vectors-and-independence', 'matrices-and-determinants'],
    anchors: ['vector-spaces', 'eigenvalues', 'diagonalisation'],
    because: 'The Runeforger guild fabricates objects that conduct aether — shields, ignition surfaces, industrial equipment — which is arrays of conducting elements and what they do to what passes through them. A city named The Stalwart Machine keeps its mathematics in matrices.',
  },
  {
    id: 'paravgrad', name: 'Paravgrad', epithet: 'The Northmost Port',
    km: 2000, area: 'trigonometry', xy: { x: 0.522, y: 0.150 },
    authored: ['triangle-trigonometry'],
    anchors: ['law-of-sines-cosines', 'unit-circle', 'polar-coordinates'],
    because: 'The Black Fleet works the northmost water, where position is an angle to a star and a bearing off a coast you cannot see. Forty-four thousand people with no formal law and a very great deal of navigation.',
  },
  {
    id: 'rubneb', name: 'Rubneb', epithet: 'The Veiled Swamp',
    km: 2000, area: 'probability', xy: { x: 0.550, y: 0.572 },
    anchors: ['expectation', 'conditional-probability', 'random-variables'],
    because: 'Order courts price every sentence in money owed to the offended party and the state, and the Scales run a seasonal raid whose return nobody can promise. Both are expected value, and the swamp is where somebody is always computing one.',
  },
  {
    id: 'borova', name: 'Borova', epithet: 'The Winged Court',
    km: 2300, area: 'topology', xy: { x: 0.362, y: 0.310 },
    anchors: ['connectedness', 'closure-and-interior', 'quotient-and-product-spaces'],
    because: 'A principality system: oligarchs over "a patchwork quilt of distinct sub regions loosely bound by national law that enforces a semblance of a common court". Neighbourhoods, what is glued to what, and which properties survive the stretching.',
  },
  {
    id: 'gal-garad', name: 'Gal-garad', epithet: 'The Crucible of the Sun',
    km: 2450, area: 'statistics', xy: { x: 0.366, y: 0.373 },
    anchors: ['hypothesis-testing', 'linear-regression', 'sampling-and-bias'],
    because: 'Guild arbitrators settle disputes by weighing "economic impact, social precedent, and martial necessity" — a million people whose justice is an inference from aggregates, with all the bias that implies.',
  },
  {
    id: 'burdervruke', name: 'Burdervruke', epithet: 'The Chambered Mountain',
    km: 3000, area: 'discrete-mathematics', xy: { x: 0.688, y: 0.224 },
    anchors: ['counting-principles', 'graphs', 'propositional-logic'],
    because: 'Eligibility for the Great Chamber requires tier-three professional commendation and a certificate of physical condition; the Migration and Visa Office decides who may enter at all. A mountain that runs on rules about who counts, who may sit with whom, and what follows from what.',
  },
  {
    id: 'malean', name: 'Malean', epithet: 'The Sheltered Gate',
    km: 3000, area: 'limits-and-continuity', xy: { x: 0.240, y: 0.372 },
    anchors: ['limit-of-a-function', 'one-sided-limits', 'intermediate-value-theorem'],
    because: 'An island gate at the mouth of the Sea of Troubles, where a cleric oversees the landowners\' assembly to keep proceedings "reasonable". Everything about the place is approaching a boundary without crossing it.',
  },
  {
    id: 'taiga', name: 'Taiga', epithet: 'the cloistered archive',
    km: 3200, area: 'real-analysis', xy: { x: 0.790, y: 0.262 },
    anchors: ['epsilon-delta', 'supremum-and-completeness', 'cauchy-sequences'],
    because: 'A junta-ruled archive on an island, whose economy is "limited mostly by design as unnecessary complexity and foreign dependence is seen as undesirable". Real analysis is the area where the standard of proof is the content rather than a tax on it — the one subject Taiga would consider worth the austerity.',
  },
  {
    id: 'tellgrad', name: 'Tellgrad', epithet: 'The Rising Chorus',
    km: 3700, area: 'abstract-algebra', xy: { x: 0.781, y: 0.409 },
    anchors: ['groups', 'subgroups-and-cosets', 'group-homomorphisms'],
    because: 'The Choir rules by the collective respect of the other kulns, and Morrenian philosophy holds a society together through "local cohesion and understood hierarchical responsibilities". Structure, nesting, and what is preserved when you map one hierarchy onto another.',
  },
  {
    id: 'durvolk', name: 'Durvolk', epithet: 'Shelter of The Faithful',
    km: 4300, area: 'differential-calculus', xy: { x: 0.870, y: 0.422 },
    anchors: ['derivative-definition', 'related-rates', 'linear-approximation'],
    because: 'The Durvolk school\'s entire specialty is "small tweaks to flora and fauna" for agriculture and industry — a college of derivatives. It is also the port of departure for circumnavigation, which makes the first serious rate of change the thing you learn before you leave.',
  },
  {
    id: 'qing-men', name: 'Qing-men', epithet: 'Bastion of the deep mist',
    km: 5100, area: 'integral-calculus', xy: { x: 0.838, y: 0.527 },
    anchors: ['definite-integral', 'riemann-sums', 'integration-applications'],
    because: 'The most populous city on Armat, run by ministries for taxation, grain, garrisons and copies of every legal record, bordering valleys under "a perpetual fog that makes routing a nightmare". When you cannot see the whole, you total up the parts you can.',
  },
  {
    id: 'alun', name: 'Alun', epithet: 'Port of the Rolling Hills',
    km: 5300, area: 'multivariable-calculus', xy: { x: 0.365, y: 0.682 },
    anchors: ['gradient-and-directional', 'partial-derivatives', 'multivariable-optimisation'],
    because: 'Rolling hills between a river delta and a peninsula, worked by a Resettlement Office deciding where people should go and a Storm Line Company deciding how to get there. A surface, and the steepest way off it.',
  },
  {
    id: 'kalkreath-mountains', name: 'Kalkreath Mountains', epithet: 'The Shattered Horde',
    km: 5500, area: 'sequences-and-series', xy: { x: 0.250, y: 0.513 },
    anchors: ['sequence-convergence', 'infinite-series', 'convergence-tests'],
    because: 'Zook\'s Moon Coven shattered between his two daughters, the male sorcerers went back to their clans, and what is left is called The Five. A region defined by repeated splitting, where the only real question is whether the pieces add up to anything.',
  },
  {
    id: 'kalvent', name: 'Kalvent', epithet: 'City Along the Storm\'s Edge',
    km: 5500, area: 'differential-equations', xy: { x: 0.228, y: 0.443 },
    anchors: ['what-an-ode-is', 'direction-fields', 'systems-of-odes'],
    because: 'A city on the edge of a storm belt, defended by the Storm Guard and supplied by the Mountain Road Guild. The weather here is a system whose next state follows from its current one, which is the only honest definition of the subject.',
  },
  {
    id: 'schalfrend', name: 'Schalfrend', epithet: 'The Frosted Lens',
    km: 6200, area: 'functions', xy: { x: 0.249, y: 0.197 },
    authored: ['exponents-and-logarithms', 'functions-and-inverses'],
    anchors: ['graphs-of-functions', 'transformations-of-graphs', 'parametric-and-implicit'],
    because: 'The Schalfrend School builds a customized beast to a client\'s specification and raises it in the Outer Cradle: a specification goes in, one creature comes out, and no two orders from one spec. A lens, and a map from input to output.',
  },
  {
    id: 'chu-kau', name: 'Chu-kau', epithet: 'The Isle Of Snakes',
    km: 6200, role: 'broker', xy: { x: 0.859, y: 0.584 },
    because: 'The Weighing House is "nominally a collection of banks" whose real business appears "once the decimal places start shifting farther to the right", and the Traveling Eye guild sells what it learns abroad to whoever pays. Chu-kau teaches nothing of its own — it trades in what the other regions know.',
  },
  {
    id: 'nadda-zalan', name: 'Nadda-zalan', epithet: 'The Frozen Jungle',
    km: 6600, role: 'frontier', xy: { x: 0.261, y: 0.682 },
    because: 'Fifteen thousand people, five thousand of them at a rear camp inside the southern storm belt, and no formal conflict management at all. This is where the atlas runs out: the concepts nothing is written for live here. Nobody in Nadda-zalan can teach you the mathematics of Nadda-zalan, which is the point of going.',
  },
  {
    id: 'hemgrad-and-hemlith', name: 'Hemgrad and Hemlith', epithet: 'The Sundered Isles',
    km: 7500, area: 'complex-analysis', xy: { x: 0.047, y: 0.369 },
    anchors: ['holomorphic-functions', 'contour-integration', 'analytic-continuation'],
    because: 'A sundered pair in the far western ocean, where the Illuminates kept working after their master and their city were destroyed, and the Printing House and the Accords argue over what the record says. A conjugate pair, and the art of continuing a function past the place it was defined.',
  },
]

/**
 * The rings, inward to outward.
 *
 * Boundaries sit at the natural gaps in the distance table rather than at
 * round numbers, so no city lands just the wrong side of a line. The result is
 * lopsided — eight regions on the Rim against two in the Outer Spheres — and
 * that is left alone, because the rings describe where Armat's cities actually
 * are. Evening them out would mean moving a city. So each `is` describes the
 * ring's centre of gravity and not every member of it.
 */
export const RINGS: { id: string; name: string; upTo: number; is: string }[] = [
  { id: 'core', name: 'The Core', upTo: 2000, is: 'The rules, and the shapes and numbers they are about.' },
  { id: 'near', name: 'The Near Spheres', upTo: 3200, is: 'Structure: what holds together, what counts, what can be proved.' },
  { id: 'outer', name: 'The Outer Spheres', upTo: 4300, is: 'Change, and the structures that describe it.' },
  { id: 'rim', name: 'The Rim', upTo: Infinity, is: 'Mostly analysis, plus the far isles and the two places that teach nothing.' },
]

export function ringOf(km: number): string {
  return (RINGS.find(r => km <= r.upTo) ?? RINGS[RINGS.length - 1]).id
}

export interface PlacedRegion extends Region {
  role: RegionRole
  ring: string
  areaName: string | null
}

/**
 * Every region, inward to outward, with its area resolved against `AREAS`.
 *
 * Ties broken by name so the order is stable: Kalvent and Kalkreath are both
 * at 5500 km, and an order that fell through to the literal's would reshuffle
 * on any edit above them.
 */
export function regions(): PlacedRegion[] {
  const named = new Map(AREAS.map(a => [a.id, a.name]))
  return [...REGIONS]
    .sort((a, b) => a.km - b.km || a.name.localeCompare(b.name))
    .map(r => ({
      ...r,
      role: r.role ?? 'teaching',
      ring: ringOf(r.km),
      areaName: r.area ? named.get(r.area) ?? null : null,
    }))
}

/** By id, name or epithet, case- and punctuation-insensitively. */
export function regionBy(key: string): PlacedRegion | null {
  const want = String(key ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (!want) return null
  const all = regions()
  return all.find(r => r.id.replace(/[^a-z0-9]+/g, '') === want)
    ?? all.find(r => r.name.toLowerCase().replace(/[^a-z0-9]+/g, '') === want)
    ?? all.find(r => r.epithet.toLowerCase().replace(/[^a-z0-9]+/g, '') === want)
    ?? null
}

export function regionForArea(areaId: string): PlacedRegion | null {
  return regions().find(r => r.area === areaId) ?? null
}

/**
 * Which region a concept stands in, by the subject it belongs to.
 *
 * The bridge that turns the map from a thing you read into a board you play
 * on. A traversal's position is a concept id; a concept carries a `subjectId`;
 * and a subject is either one of the nineteen mapped areas or one of the ten
 * authored ones — both of which this table already places. So "where am I"
 * becomes a pin, and a route through the graph becomes a route across a world.
 *
 * Both partitions are checked, in that order, because a subject id is drawn
 * from one namespace or the other and never both. `armatureProblems` is what
 * guarantees the second lookup can succeed at all: it fails if any authored
 * subject belongs to no region, so a concept whose subject ships cannot land
 * nowhere.
 */
export function regionForConcept(subjectId: string): PlacedRegion | null {
  return regions().find(r =>
    r.area === subjectId || (r.authored ?? []).includes(subjectId)) ?? null
}

/**
 * Regions a journey outward has already passed.
 *
 * Geography, NOT prerequisites — see the file header. Strictly inward, so two
 * cities at the same distance are neighbours rather than one gating the other.
 * Use it to decide where to go next, never whether somebody is ready.
 */
export function inwardOf(key: string): PlacedRegion[] {
  const r = regionBy(key)
  return r ? regions().filter(o => o.km < r.km) : []
}

export interface RegionCoverage {
  region: PlacedRegion
  /** Concepts here: the mapped area's, plus any authored subjects' it holds. */
  concepts: number
  /** Those with material written — `teachable` in `atlasCoverage`. */
  written: number
  /** The authored subject ids counted in, for the panel to name. */
  authored: string[]
}

/**
 * How much of each region's mathematics is actually written.
 *
 * The reason the map earns its place on /learn rather than being decoration:
 * it turns `atlasCoverage().byArea` into terrain. A region you can go to and
 * find almost nothing is a true and useful thing to see at a glance.
 *
 * It sums BOTH partitions — the mapped area and whatever authored subjects the
 * region holds — because counting only the area would report zero everywhere.
 * Every mapped node is unwritten by construction, so an area-only reading
 * shades the whole world "nothing written" and shows a picture of the empty
 * half of mathematics. See the `authored` field.
 *
 * The two regions with no area report zeroes, which is not a gap in the data:
 * Chu-kau has no mathematics of its own to count, and Nadda-zalan's entire
 * meaning is that nothing is written there.
 */
export function regionCoverage(coverage: AtlasCoverage): RegionCoverage[] {
  const bySubject = new Map(coverage.byArea.map(a => [a.id, a]))
  return regions().map(region => {
    const parts = [region.area, ...(region.authored ?? [])]
      .filter((id): id is string => !!id)
      .map(id => bySubject.get(id))
      .filter((row): row is NonNullable<typeof row> => !!row)
    return {
      region,
      concepts: parts.reduce((n, row) => n + row.concepts, 0),
      written: parts.reduce((n, row) => n + row.teachable, 0),
      authored: region.authored ?? [],
    }
  })
}

/**
 * Structural faults, in the same shape and for the same reason as
 * `atlasProblems` — a list of strings, empty when the document is sound.
 *
 * This is what makes the live import worth having over the game's snapshot. A
 * region naming an area that no longer exists, or anchoring on a concept that
 * was renamed out from under it, is caught here by a test rather than
 * discovered by a learner clicking a pin into an empty panel.
 */
export function armatureProblems(
  conceptIdsByArea: Map<string, Set<string>>,
  /**
   * Every authored subject id (`ONTOLOGIES.map(o => o.subject.id)`).
   *
   * Passed in rather than imported so this file does not depend on
   * ontology.ts — and so the check is against whatever the caller considers
   * shipped. Omit it and the authored-subject checks are skipped, which is
   * the only way to use this without them.
   */
  authoredSubjectIds?: Set<string>,
): string[] {
  const problems: string[] = []
  const areaIds = new Set(AREAS.map(a => a.id))
  const seenArea = new Map<string, string>()
  const seenId = new Set<string>()
  const seenAuthored = new Map<string, string>()

  for (const r of REGIONS) {
    if (seenId.has(r.id)) problems.push(`duplicate region id: ${r.id}`)
    seenId.add(r.id)

    for (const subject of r.authored ?? []) {
      if (authoredSubjectIds && !authoredSubjectIds.has(subject)) {
        problems.push(`${r.name} claims authored subject "${subject}", which is not shipped`)
      }
      const already = seenAuthored.get(subject)
      if (already) {
        problems.push(`authored subject "${subject}" is claimed by both ${already} and ${r.name}`)
      }
      seenAuthored.set(subject, r.name)
    }

    if (!r.area) {
      if (!r.role) problems.push(`${r.name} has no area and no role saying why`)
      if (r.anchors?.length) problems.push(`${r.name} has no area but names anchors`)
      if (r.authored?.length) problems.push(`${r.name} has no area but holds authored subjects`)
      continue
    }
    if (!areaIds.has(r.area)) {
      problems.push(`${r.name} names area "${r.area}", which is not in AREAS`)
      continue
    }
    const already = seenArea.get(r.area)
    if (already) problems.push(`area "${r.area}" is claimed by both ${already} and ${r.name}`)
    seenArea.set(r.area, r.name)

    const inArea = conceptIdsByArea.get(r.area) ?? new Set<string>()
    for (const anchor of r.anchors ?? []) {
      if (!inArea.has(anchor)) {
        problems.push(`${r.name} anchors on "${anchor}", which is not in ${r.area}`)
      }
    }
  }

  for (const id of areaIds) {
    if (!seenArea.has(id)) problems.push(`area "${id}" has no region — it cannot be reached on the map`)
  }
  /* The check that matters most, because its failure is silent and its cost is
     the whole feature: an authored subject nobody claimed holds real written
     material that would appear nowhere on the map, and the map would go on
     reporting coverage as though it did not exist. */
  for (const id of authoredSubjectIds ?? []) {
    if (!seenAuthored.has(id)) {
      problems.push(`authored subject "${id}" belongs to no region — its material is off the map`)
    }
  }
  return problems
}
