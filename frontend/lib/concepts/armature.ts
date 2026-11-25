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
   * carries no knowledge points. The authored subjects are siblings of them in
   * the composed graph, and they hold EVERY written concept there is.
   *
   * Stated without a count on purpose. This sentence read "the ten authored
   * subjects ... ALL 62 written concepts" and both numerals were stale by two
   * subjects and eighteen concepts, because nothing reads them and so nothing
   * went red. The claim that does work here is the partition, which is true at
   * any size; `atlasCoverage` is where the figures live, and
   * `regionCoverage` below prints them per region on every run.
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
    // `absolute-value` was the third anchor until the twentieth promotion wrote
    // it into `arithmetic-foundations`. An anchor must be a node of `area`, so a
    // promotion empties the slot rather than leaving it, and `armatureProblems`
    // says so loudly — the one check this table has that the game's copy does
    // not. `absolute-value-equations` replaces it: the node directly above the
    // one that left, still in the area, and still about the bars, so the
    // region's character is unchanged.
    //
    // It is NOT the refill rule krull's slot has used twice. There the
    // replacement inherited the departing node's place as a ROOT of the area
    // view; this one does not and cannot, because `linear-inequalities` is its
    // other prerequisite and is still a node here, gating it from inside. So
    // "the node that was next" is the durable half of that rule and "which
    // became a root" was a property of an area being authored bottom-up.
    anchors: ['word-problems', 'linear-inequalities', 'absolute-value-equations'],
    because: 'The Golden Scribes are trained at Zurramat\'s palace in literacy, rhetoric and "the principles of the golden law" — the rules every other region\'s practice is then interpreted under. The centre of the continent holds the rules everything else is derived from.',
  },
  {
    id: 'hasspab', name: 'Hasspab', epithet: 'The Aether Sepulcher',
    km: 1000, area: 'number-theory', xy: { x: 0.551, y: 0.449 },
    // `division-algorithm` was the first anchor until the thirty-ninth promotion
    // wrote it into `arithmetic-foundations`. An anchor must be a node of `area`,
    // so a promotion empties the slot rather than leaving it, and
    // `armatureProblems` says so loudly — the one check this table has that the
    // game's copy does not. This is the fifth refill and the first out of this
    // region.
    //
    // IT IS ALSO THE FIRST REFILL WHERE THE REGION GAINED NOTHING IN EXCHANGE.
    // Every previous one — Ringed Mountains', Druuvruke's twice, Paravgrad's —
    // sent its node to a subject the SAME region claims in `authored`, so the
    // slot emptied and the region's written count went up in the same edit.
    // `arithmetic-foundations` is claimed by Ringed Mountains and has been since
    // the `number-and-arithmetic` area was retired, so this region hands over a
    // node and still reports nothing written. That is honest and not a bug:
    // `regionCoverage` attributes material by SUBJECT, the subject is claimed
    // once, and claiming it twice is precisely what `armatureProblems` rejects.
    // Worth knowing before somebody reads Hasspab's zero as a stalled region.
    //
    // KRULL'S REFILL RULE NAMES `euclidean-algorithm` AND IS DECLINED, which is
    // the first time that rule has been turned down rather than found
    // inapplicable. The rule is "the node that was next" — the dependent that
    // inherits the departing node's place — and there is exactly one here, so it
    // applies cleanly. The trouble is structural rather than editorial: a
    // dependent inherits the place because the promotion just wrote its last
    // unwritten prerequisite, which makes it the node in the area MOST likely to
    // be promoted next. `euclidean-algorithm` needs `division-algorithm` and
    // `gcd-and-lcm`, both authored as of this edit, so it is READY now. Applying
    // Krull's rule would hand the slot to the one node guaranteed to empty it
    // again, and Druuvruke's third anchor has already turned over twice for want
    // of that observation. So the rule is kept and its precondition is stated:
    // take the node that was next UNLESS the promotion that freed the slot also
    // made that node ready.
    //
    // `quadratic-reciprocity` replaces it, picked off the region's own `because`
    // the way Paravgrad's fallback does. That sentence says number theory is "the
    // mathematics that feels found rather than built, inscribed rather than
    // invented", and quadratic reciprocity is the theorem that most answers to
    // it: an unexpected symmetry between two primes that nobody designed. It is
    // also seven unwritten layers up the area's chain, so the slot should hold.
    // `fermat-euler` and `cryptographic-number-theory` were the other deep
    // candidates and are the wrong flavour — both are the mathematics being USED,
    // which is the built half of that sentence rather than the found half.
    anchors: ['quadratic-reciprocity', 'modular-arithmetic', 'prime-distribution'],
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
    // not. `isometries-and-symmetry` replaced it: still synthetic, still about
    // what a cut preserves, and still in the area.
    //
    // AND THEN IT WENT THE SAME WAY, one promotion later, so this slot has now
    // turned over twice into the same subject. `plane-transformations` replaces
    // it, and the choice needs saying because neither established refill rule
    // picks it. Krull's rule is "the node that was next" — the dependent that
    // inherits the departing node's place — and there is none to inherit it
    // here: `isometries-and-symmetry`'s only dependent anywhere is
    // `binary-operations`, in `abstract-algebra`, so an anchor cannot be taken
    // from it. Paravgrad's fallback is to pick off the region's own `because`,
    // and this region's two other anchors already hold the compass and the
    // straight line it describes. What is left is the node holding the
    // departing node's CONTENT: the same translations, rotations and
    // reflections, written on coordinates. It is the first Druuvruke anchor
    // from the analytic half of the area, which the region's `authored` list
    // does not contradict — the guild's argument is about measurement either
    // way, and the merge that put both halves in one area is what makes the
    // distinction a matter of style here rather than of boundary.
    //
    // AND THEN IT WENT THE SAME WAY AGAIN, one promotion later, into
    // `plane-geometry` for the third consecutive time — so this slot has now
    // turned over three times and every occupant has left by the same route.
    // `loci-and-regions` replaces it, and for the second time running neither
    // Krull's rule nor the content rule can pick the refill. Krull's needs a
    // dependent in the area to inherit the slot and the departing node has no
    // dependent anywhere in the atlas at all. The content rule picked the last
    // occupant because it held the departing node's material; nothing left in
    // the area holds any of THIS one's, whose content was the four maps written
    // on coordinates and all of which went with it.
    //
    // So the region's own `because` decides, which is Paravgrad's fallback, and
    // it has exactly one clause the other two anchors do not already spend. The
    // compass is `constructions` and the straight line is `lines-in-the-plane`;
    // what is left is the elected assemblies "that have to agree where the line
    // goes", and a locus is precisely the set of points a condition agrees on —
    // with the region rather than the boundary being what `loci-and-regions`
    // adds to it. It also keeps the analytic-half presence in this region that
    // the last occupant introduced, which is worth keeping rather than
    // accidental: the guild's argument is about measurement, and a shaded
    // region is a measured claim about where a cut may fall.
    //
    // A note for whoever meets the fourth turnover: five of this area's seven
    // remaining nodes are analytic and the two that are not are both anchors
    // already. If this slot empties again, the honest answer may be that the
    // region's `because` has been fully spent and the clause wants rewriting
    // rather than a fourth anchor hunted out of what is left.
    anchors: ['constructions', 'loci-and-regions', 'lines-in-the-plane'],
    because: 'The Stone Digger Guild cuts straight lines through mountains for a living, under elected assemblies that have to agree where the line goes. Compass, straightedge, and an argument about measurement.',
  },
  {
    id: 'krull', name: 'Krull', epithet: 'The Stalwart Machine',
    km: 1900, area: 'linear-algebra', xy: { x: 0.535, y: 0.164 },
    authored: ['vectors-and-independence', 'matrices-and-determinants'],
    // `vector-spaces` was the first anchor until the twentieth promotion wrote
    // it into `vectors-and-independence`. An anchor must be a node of `area`,
    // so the slot had to be refilled rather than left — `armatureProblems` says
    // so loudly, which is the one check this table has that the game's copy
    // does not. `basis-and-dimension` replaced it because it inherited the
    // departing node's place in the area exactly: it was the node directly
    // above the axioms and became one of the two roots of the area view.
    //
    // AND THEN IT WENT THE SAME WAY, into the same subject, two promotions
    // later — so this slot has now turned over twice for the same reason and
    // the replacement is chosen on the same rule. `rank-nullity` inherited the
    // departing node's place exactly as it had inherited the axioms': it was
    // the node directly above it and is now one of the three roots of the area
    // view. The pattern worth reading off this is that a region anchoring on
    // the ROOT of a growing area will be refilled every time that area is
    // authored out from underneath it, and the refill is always the node that
    // was next.
    //
    // AND A THIRD TIME, into the same subject again, at the thirtieth
    // promotion. The prediction above held and the rule picked the refill, but
    // it had TWO candidates to choose between for the first time and the rule's
    // two halves came apart on them. `diagonalisation` and `least-squares` both
    // name `rank-nullity` in their own `needs`, so both are "the node that was
    // next"; only `least-squares` INHERITED its place, because
    // `diagonalisation` has `eigenvalues` above it inside this area and so did
    // not become a root. So "the dependent that becomes a root" is the half
    // that discriminates and "the node directly above" is the half that
    // happened to agree twice. `diagonalisation` is an anchor already in any
    // case, so taking it would have shrunk the region to two.
    //
    // It also reads right against the `because`: the Runeforger guild makes
    // things that have to work, and least squares is the answer you give when
    // the system cannot be solved exactly — which is every real measurement a
    // fabricator takes.
    anchors: ['least-squares', 'eigenvalues', 'diagonalisation'],
    because: 'The Runeforger guild fabricates objects that conduct aether — shields, ignition surfaces, industrial equipment — which is arrays of conducting elements and what they do to what passes through them. A city named The Stalwart Machine keeps its mathematics in matrices.',
  },
  {
    id: 'paravgrad', name: 'Paravgrad', epithet: 'The Northmost Port',
    km: 2000, area: 'trigonometry', xy: { x: 0.522, y: 0.150 },
    authored: ['triangle-trigonometry'],
    // `law-of-sines-cosines` was the first anchor until it was authored into
    // `triangle-trigonometry`, the second concept of the subject this region
    // already claims. An anchor must be a node of `area`, so a promotion out of
    // `trigonometry` empties the slot and `armatureProblems` says so loudly.
    //
    // THE DOCUMENTED REFILL RULE DOES NOT APPLY HERE, AND THAT IS WHY THIS
    // COMMENT IS LONGER THAN KRULL'S. Krull's slot has turned over twice on the
    // rule "the refill is the node that was next" — the departing anchor was
    // the root of a growing area, and the node directly above it inherited both
    // its place and the anchor. That rule needs a node above the departing one.
    // This one had NONE: no node in this area and no concept anywhere named
    // `law-of-sines-cosines` as a need, so nothing inherited its place and
    // there was no successor to promote into the slot.
    //
    // So the refill is chosen on the region's own `because` instead, which is
    // what that field is for. The Black Fleet navigates — "position is an angle
    // to a star and a bearing off a coast you cannot see" — and the departing
    // node was the triangulation one, the node that turns two bearings and a
    // distance into a position. The nearest remaining node about COMBINING
    // angles is `angle-sum-identities`: resolving one bearing into another is
    // that identity and nothing else in the area is. `radians` was the other
    // candidate and is a change of UNIT, which is not what a fleet does.
    //
    // Reordered as well as refilled, which the old list is the argument for:
    // `law-of-sines-cosines` sat first while needing nothing else here, so the
    // list began with a node that depended on none of the others. These three
    // are now in dependency order — `angle-sum-identities` rests on
    // `pythagorean-identity` which rests on `unit-circle`, and
    // `polar-coordinates` rests on `radians` which rests on `unit-circle` — so
    // the circle comes first, which is also the order a reader walks them in.
    anchors: ['unit-circle', 'angle-sum-identities', 'polar-coordinates'],
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
    // The first authored subject in the uncertainty half of the atlas, claimed
    // here because `data-summaries`' one concept was promoted out of this
    // region's own area. `armatureProblems` requires every authored subject to
    // be claimed exactly once, so a new ontology that appeared nowhere in this
    // table would fail loudly — which is the one check this table has that the
    // game's copy does not.
    //
    // NO ANCHOR SLOT EMPTIED, which is why this comment is three lines where
    // Krull's and Druuvruke's are forty. An anchor must be a node of `area`, so
    // a promotion normally vacates one and the refill is a judgement; none of
    // the three below is `descriptive-statistics`, and all three are still
    // nodes here. The region anchors on the inferential end of the subject and
    // the concept that left is the descriptive one, so its character is
    // untouched — which also means the `because` below still reads correctly: a
    // guild arbitrator weighing economic impact is inferring from aggregates,
    // and summarising a list is the step before that argument starts.
    authored: ['data-summaries'],
    anchors: ['hypothesis-testing', 'linear-regression', 'sampling-and-bias'],
    because: 'Guild arbitrators settle disputes by weighing "economic impact, social precedent, and martial necessity" — a million people whose justice is an inference from aggregates, with all the bias that implies.',
  },
  {
    id: 'burdervruke', name: 'Burdervruke', epithet: 'The Chambered Mountain',
    km: 3000, area: 'discrete-mathematics', xy: { x: 0.688, y: 0.224 },
    //
    // AN ANCHOR SLOT WAS VACATED HERE AND REFILLED, which is the case the
    // statistics region three entries up got to say it had avoided. The
    // thirty-fifth promotion took `propositional-logic` out of
    // `discrete-mathematics` and into the `statements-and-connectives`
    // subject. An anchor must be a node of `area` — `armatureProblems` builds
    // its membership set from `subjectId`, and an authored concept's
    // `subjectId` is its SUBJECT — so the id stopped resolving and the region
    // had to be re-decided rather than merely re-typed.
    //
    // Dropping to two anchors was the wrong repair, because `because` below is
    // three clauses and they are the three anchors in order: "who counts" is
    // the counting, "who may sit with whom" is the graphs, and "what follows
    // from what" is the logic. Deleting the third would have left a sentence
    // promising something the table no longer points at.
    //
    // `proof-techniques` is the refill, and it is the best match for that
    // clause rather than the nearest unused id. It is the node that now sits
    // where the departing one did in the area's order — two steps up, behind
    // `quantifiers` — and its content is literally what follows from what:
    // direct, contrapositive, contradiction and cases, four shapes of argument
    // each suited to a shape of statement. `quantifiers` was the other
    // candidate and is the closer node, and it loses because its subject is
    // the SCOPE of a claim rather than the inference from one, which is a
    // worse fit for a mountain whose offices decide eligibility.
    //
    // THAT CHOICE PAID FOR THE NEXT PROMOTION, which is worth recording
    // because it was not why it was made. The thirty-sixth promotion took
    // `quantifiers` — the candidate rejected here — so had the refill gone the
    // other way this slot would have emptied a second time one run later and
    // the region would have been re-decided twice. Preferring the better match
    // to the nearer one bought exactly one run.
    //
    // AND THEN THE SAME SLOT EMPTIED AGAIN, because the thirty-seventh
    // promotion took `proof-techniques` itself, into a fourteenth subject. So
    // the refill above was right about fit and was not durable, and the lesson
    // the thirty-fifth promotion drew from it — prefer fit to proximity — is
    // true and incomplete. What it missed is that fit and PROMOTABILITY are
    // different questions: `proof-techniques` had a single prerequisite, that
    // prerequisite was the node promoted immediately before it, and a node one
    // step above the last departure is the likeliest next departure there is.
    //
    // `formal-logic-and-incompleteness` IS THE SECOND REFILL, AND IT IS CHOSEN
    // ON BOTH QUESTIONS AT ONCE.
    //
    // On fit it is better than what it replaces, not merely adequate. The third
    // clause of `because` is "what follows from what", and that node is axioms,
    // derivation and models — what follows from what as a formal relation
    // inside a stated calculus, up to the statement that any adequate system
    // has truths it cannot prove. A mountain that runs on offices and
    // eligibility rules is a rule book before it is four styles of argument,
    // and ontology-proof.ts hands this reading over explicitly: it writes
    // formal derivation out of its own subject and names this node as where it
    // lives.
    //
    // On durability it is safe by construction rather than by luck. Its `needs`
    // are `computability-and-complexity` and `quantifiers`, and the first of
    // those is unwritten and stands behind `graph-algorithms`, so this node
    // cannot become a ready candidate until at least two promotions have landed
    // elsewhere in this area. An anchor that cannot be promoted soon is the
    // property to select for, and neither of the two previous refills was
    // checked against it.
    //
    // Dropping to two anchors is still the wrong repair, for the reason stated
    // above: `because` is three clauses and they are the three anchors in
    // order. "Who counts" is the counting, "who may sit with whom" is the
    // graphs, and "what follows from what" is now the formal systems.
    //
    // The region claims the authored subjects of this area, which it did not
    // before the thirty-fifth promotion and now does FOUR times.
    // `armatureProblems` checks that every shipped subject is claimed exactly
    // once, so a new one that nobody claims holds real material appearing
    // nowhere on the map — and the claim belongs to the region holding the
    // area the concept was promoted OUT of, which is this one. All three logic
    // and proof subjects came out of `discrete-mathematics`, and so did
    // `sets-and-membership`, which the thirty-eighth promotion added.
    //
    // THE FOURTH ENTRY IS THE FIRST THAT A CONSOLIDATION WOULD NOT ABSORB, and
    // that is worth one line here because the sentence this comment used to end
    // with is now only true of three quarters of the list. The consolidation
    // ontology-proof.ts leaves open — one REASONING subject in place of several —
    // would make this list shorter rather than moving an entry elsewhere, and it
    // would shorten it to TWO rather than to one: ontology-sets.ts argues that
    // its subject is about an OBJECT where the other four are about arguments,
    // so a merge of the reasoning subjects leaves it standing. A merge wide
    // enough to take it too would be a merge of everything in the build that
    // mentions a proof.
    //
    // The slot count is unchanged by this promotion. `sets` was never an anchor
    // — the three are `counting-principles`, `graphs` and
    // `formal-logic-and-incompleteness` — so for the first time since the
    // thirty-fifth, a departure from this area cost this region nothing but an
    // `authored` entry. The refill chosen above was selected partly on being far
    // from promotable, and that is still holding.
    authored: [
      'statements-and-connectives', 'predicates-and-quantifiers', 'methods-of-proof',
      'sets-and-membership',
    ],
    anchors: ['counting-principles', 'graphs', 'formal-logic-and-incompleteness'],
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
