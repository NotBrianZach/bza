'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, BookOpen, KeyRound, Loader2, MapPin } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import {
  ARMATURE_MAP, RINGS, regionCoverage, regionForConcept, regions,
  type PlacedRegion, type RegionCoverage,
} from '@/lib/concepts/armature'
import { MATHEMATICS, atlasCoverage } from '@/lib/concepts/atlas'
import { ONTOLOGIES } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'

/**
 * The Armature — nineteen areas of mathematics given a geography.
 *
 * ── TWO NAMES, ON PURPOSE ─────────────────────────────────────────────────
 *
 * In the code this is the Armature; in the interface it is "RPG mode". That
 * is not drift, it is the two names answering different questions. "Armature"
 * says what the thing is once you know it exists — the framework a form is
 * modelled onto, which is what a prerequisite graph is to a subject. A tab
 * label does not get to do that: it has one line to tell somebody who has
 * never seen this what they get by clicking, and the answer is an RPG.
 *
 * So: no user-facing string here says "Armature", and the module, the file and
 * the exports all still do. The `?tab=world` parameter also stays, because a
 * URL is not a label and that one is already in the home page's link and in
 * whatever anybody has saved.
 *
 * The name is derived from Armat Sur, the tabletop setting the map and its
 * city names come from; see the header of lib/concepts/armature.ts for why
 * that particular word. The drawing keeps its original title, which is why
 * the credit line below the map exists.
 *
 * ── Why a drawn map is worth a 3 MB image ─────────────────────────────────
 *
 * The Concepts tab already draws the real graph, and that is the honest
 * picture of what rests on what. What it cannot do is answer "where am I, and
 * what is nearby" for somebody who does not yet know the names — a
 * force-directed graph of two hundred unfamiliar nodes is a hairball to the
 * person who most needs the overview. A map of twenty-one named places with
 * one idea each is navigable before you know any of them, which is the entire
 * trick Logical Journey of the Zoombinis ran.
 *
 * ── The pins carry coverage, which is the part that is not decoration ─────
 *
 * Each pin is shaded by how much of its area has material written. That makes
 * `atlasCoverage().byArea` — a table of nineteen rows nobody reads — into
 * something you take in at a glance: the written mathematics is a cluster, and
 * most of the world is thin. Nadda-zalan, the region defined as the place
 * where nothing is written, is then literally true rather than a conceit.
 *
 * ── It decides nothing ────────────────────────────────────────────────────
 *
 * Same rule as JourneyMap. Every region, area, count and ring comes from
 * lib/concepts/armature.ts and lib/concepts/atlas.ts, both pure and tested. This
 * file owns pixels and one piece of selection state. In particular the ring a
 * city sits in is NOT a prerequisite claim — see the header of armature.ts.
 */

/** Written-fraction bands. Three, because a continuous ramp reads as noise. */
function density(c: RegionCoverage): 'none' | 'thin' | 'some' | 'written' {
  if (c.concepts === 0 || c.written === 0) return 'none'
  const share = c.written / c.concepts
  return share >= 0.5 ? 'written' : share >= 0.15 ? 'some' : 'thin'
}

const DOT: Record<string, string> = {
  none: 'bg-gray-800 border-gray-600',
  thin: 'bg-amber-900 border-amber-600',
  some: 'bg-amber-600 border-amber-300',
  written: 'bg-amber-300 border-amber-100',
}

const DENSITY_LABEL: Record<string, string> = {
  none: 'nothing written',
  thin: 'barely written',
  some: 'partly written',
  written: 'mostly written',
}

/** Authored subject names, for the places that have something to practise. */
const SUBJECT_NAME: Record<string, string> =
  Object.fromEntries(ONTOLOGIES.map(o => [o.subject.id, o.subject.name]))

/** Which region each concept stands in. Built once; the atlas is static. */
const REGION_OF_CONCEPT: Map<string, string> = new Map(
  MATHEMATICS.concepts
    .map(c => [c.id, regionForConcept(c.subjectId)?.id])
    .filter((p): p is [string, string] => !!p[1]),
)

interface Named { conceptId: string; conceptName: string }

/** The traversal as the page already has it. See TraversalMap's TraversalView. */
export interface Journey {
  here: string | null
  hereName: string | null
  route: Named[]
  reached: number
  total: number
  frontier: number
}

interface TraverseResponse {
  outcome?: 'opens' | 'blocked' | 'not-yours' | 'interferes' | 'spent'
  because?: string
  detail?: string
  door?: string
  doorName?: string
  nearestName?: string
  missing?: Named[]
  withName?: string
  error?: string
}

export default function ArmatureMap({ onBrowse, onPractise, journey, openings, onTravelled }: {
  /**
   * Look at a region's mathematics — the mapped area, in the concept graph.
   *
   * Callbacks rather than `<Link>`s because both destinations are tabs in the
   * parent page's local state, and the parent is the only thing that knows how
   * to reach them. Both optional: with neither passed the map is still a good
   * thing to read, and the buttons do not appear rather than appearing and
   * doing nothing.
   */
  onBrowse?: (areaId: string, conceptId?: string) => void
  /**
   * Practise a region's authored subject.
   *
   * Kept separate from `onBrowse` because the two are genuinely different
   * offers and only five of the twenty-one regions can make the second one.
   * Browsing shows an unwritten area honestly; practising needs problems to
   * exist, and pointing the practice set at a mapped area would answer "give
   * me something to do" with nothing and look broken.
   */
  onPractise?: (subjectId: string) => void
  /**
   * The traversal, which turns the map from a thing you read into a board.
   *
   * Optional: with no journey the map is the browse surface it was, which is
   * also what a signed-out reader gets. Nothing here invents a position — a
   * party that has not started is nowhere, and the map says so rather than
   * guessing a plausible starting city.
   */
  journey?: Journey | null
  /** Where a learner may start, or the current frontier once they have. */
  openings?: Named[]
  /** Called after a move lands, so the page can reload the authoritative state. */
  onTravelled?: () => void
}) {
  /* Computed once. The atlas is a static document — nothing here depends on
     the session, and recomputing per render would be work done for no possible
     change in the answer. */
  const coverage = useMemo(() => regionCoverage(atlasCoverage(MATHEMATICS)), [])
  const byId = useMemo(
    () => new Map(coverage.map(c => [c.region.id, c])), [coverage])
  const all = useMemo(() => regions(), [])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? byId.get(selectedId) ?? null : null

  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<TraverseResponse | null>(null)

  /**
   * Where the party stands, and everywhere it has been — as regions.
   *
   * `here` can be null twice over and the two mean different things: no
   * journey at all (signed out, or never started), or a journey standing at a
   * concept whose subject this table does not place. The second should be
   * impossible — `armatureProblems` fails the build if an authored subject
   * belongs to no region — so it is left to resolve as "nowhere" rather than
   * defended against, which would hide the failure if it ever happened.
   */
  const hereRegion = journey?.here ? REGION_OF_CONCEPT.get(journey.here) ?? null : null
  const visited = useMemo(() => {
    const seen = new Set<string>()
    for (const r of journey?.route ?? []) {
      const region = REGION_OF_CONCEPT.get(r.conceptId)
      if (region) seen.add(region)
    }
    return seen
  }, [journey])

  /** Keys the party holds in a given region — the concepts reached there. */
  const heldIn = useCallback((regionId: string) =>
    (journey?.route ?? []).filter(r => REGION_OF_CONCEPT.get(r.conceptId) === regionId),
  [journey])

  /*
   * Posting to the same endpoint TraversalMap uses, with the same body shapes.
   *
   * Deliberately not a second copy of the world: `onTravelled` tells the page
   * to reload the authoritative state rather than this component merging the
   * response into a local journey. Two code paths maintaining one world is how
   * the frontier on the board and the frontier on the server drift apart —
   * TraversalMap's own note, and it applies twice as hard now that both
   * surfaces are showing the same walk.
   */
  const post = useCallback(async (body: Record<string, string>) => {
    if (busy) return
    setBusy(true)
    try {
      const response = await authedFetch('/api/learn/traverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await response.json()) as TraverseResponse
      setLast(data)
      if (data.outcome === 'opens') {
        /* Follow the party to where it landed, so the map moves with them
           rather than leaving the panel on the city they departed from. */
        if (data.door) setSelectedId(REGION_OF_CONCEPT.get(data.door) ?? null)
        onTravelled?.()
      }
    } catch (e) {
      setLast({ error: e instanceof Error ? e.message : 'the request failed' })
    } finally {
      setBusy(false)
    }
  }, [busy, onTravelled])

  return (
    <div className='space-y-3'>
      <p className='text-xs leading-snug text-gray-400'>
        Every sphere of influence carries one area of mathematics, so the atlas has a
        geography. Travelling outward from the centre runs roughly rules → structure
        → change → analysis. That is a story, not a syllabus: nothing here gates
        anything, and what actually has to come first is on the Concepts tab.
      </p>

      <div className='grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]'>
        <div
          className='relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900'
          /* The intrinsic ratio, so the pin overlay has the right shape before
             the image decodes. Without it the pins pile into a zero-height box
             on first paint and jump when the picture lands. */
          style={{ aspectRatio: `${ARMATURE_MAP.width} / ${ARMATURE_MAP.height}` }}
        >
          <Image
            src={ARMATURE_MAP.src}
            alt='A geographical atlas of the areas of mathematics, drawn as a fantasy world map'
            fill
            sizes='(max-width: 1024px) 100vw, 60vw'
            className='object-cover'
            /* Unoptimised: this is a single large hand-drawn map served from
               the same origin, and the Worker's image pipeline would re-encode
               it on every cold request for a file that never changes. */
            unoptimized
            priority={false}
          />
          {all.map(region => {
            const cov = byId.get(region.id)
            const band = cov ? density(cov) : 'none'
            const isSelected = region.id === selectedId
            const isHere = region.id === hereRegion
            const wasVisited = visited.has(region.id) && !isHere
            /* Labels near the frame are anchored by their near edge instead of
               centred, or a long name runs off the map — "Hemgrad and Hemlith"
               sits at x=0.047. The label is positioned out of flow so moving it
               cannot drag the dot off its city. */
            const edge = region.xy.x < 0.12 ? 'left-0' : region.xy.x > 0.88
              ? 'right-0' : 'left-1/2 -translate-x-1/2'
            return (
              <button
                key={region.id}
                type='button'
                onClick={() => setSelectedId(region.id)}
                style={{
                  left: `${(region.xy.x * 100).toFixed(3)}%`,
                  top: `${(region.xy.y * 100).toFixed(3)}%`,
                }}
                className={`absolute block h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 ${
                  isHere ? 'z-30' : isSelected ? 'z-20' : 'z-10'
                } group focus:outline-none`}
                aria-pressed={isSelected}
                aria-current={isHere ? 'location' : undefined}
                /* The accessible name carries the mathematics AND the party's
                   position: a screen reader on twenty-one identical dots
                   otherwise gets twenty-one place names, no reason to pick one,
                   and no way at all to find out where it is standing. */
                aria-label={`${region.name} — ${region.areaName
                  ?? (region.role === 'broker' ? 'trades in other regions’ knowledge' : 'nothing written here')
                }, ${DENSITY_LABEL[band]}${
                  isHere ? ', you are here' : wasVisited ? ', visited' : ''}`}
                title={`${region.name} — ${region.areaName ?? region.epithet}`}
              >
                {/* The party's own marker, drawn OUTSIDE the coverage dot and
                    larger than it. Coverage is a property of the place and
                    position is a property of you, so one must not be able to
                    hide the other — a sky ring around a dark "nothing written"
                    pin has to read as clearly as one around a bright pin. */}
                {isHere && (
                  <span className='pointer-events-none absolute -left-1 -top-1 block h-[26px] w-[26px] animate-pulse rounded-full border-2 border-sky-300' />
                )}
                <span
                  className={`absolute left-1 top-1 block h-2.5 w-2.5 border-2 shadow ${DOT[band]} ${
                    region.role === 'frontier' ? 'rounded-[2px]'
                      : region.role === 'broker' ? 'rounded-full border-dashed' : 'rounded-full'
                  } ${isSelected ? 'ring-2 ring-sky-300' : ''} ${
                    wasVisited ? 'ring-1 ring-sky-700' : ''
                  } transition-transform group-hover:scale-125`}
                />
                <span
                  className={`pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded border px-1 py-px text-[10px] transition-opacity ${edge} ${
                    isHere
                      ? 'border-sky-600 bg-sky-950/95 text-sky-100'
                      : 'border-gray-700 bg-gray-900/95 text-gray-100'
                  } ${
                    isSelected || isHere ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  }`}
                >
                  {region.name}
                </span>
              </button>
            )
          })}
        </div>

        <div className='min-h-[140px] space-y-3'>
          {journey && (
            <JourneyPanel
              journey={journey}
              openings={openings ?? []}
              hereRegion={hereRegion}
              busy={busy}
              last={last}
              onStart={id => post({ start: id })}
            />
          )}
          {selected
            ? (
              <RegionDetail
                cov={selected}
                onBrowse={onBrowse}
                onPractise={onPractise}
                held={journey ? heldIn(selected.region.id) : []}
                canTravel={!!journey && journey.route.length > 0}
                busy={busy}
                onOffer={id => post({ offer: id })}
                isHere={selected.region.id === hereRegion}
              />
            )
            : <Unselected />}
        </div>
      </div>

      <Legend />

      {/* Said out loud rather than quietly hoped past. The drawing still
          carries its own title in the corner, so a reader WILL notice the two
          names and the only question is whether we explain it or look as
          though we were hiding it. */}
      <p className='text-[10px] text-gray-600'>
        This mode takes its geography, its city names and this atlas from the
        tabletop setting Armat&nbsp;Sur. The mathematics is ours.
      </p>
    </div>
  )
}

/**
 * Where the party stands, and the one move available before they have moved.
 *
 * The constraint is the traversal's own, verbatim: you pick the key, never the
 * door. So there is no control here that chooses a destination — the opening
 * move picks a concept to START at, and every move after that is made by
 * offering a key from a region's own panel. A "travel to Taiga" button would
 * be the single thing that breaks the game.
 */
function JourneyPanel({ journey, openings, hereRegion, busy, last, onStart }: {
  journey: Journey
  openings: Named[]
  hereRegion: string | null
  busy: boolean
  last: TraverseResponse | null
  onStart: (conceptId: string) => void
}) {
  const started = journey.route.length > 0
  const here = hereRegion ? regions().find(r => r.id === hereRegion) ?? null : null
  return (
    <div className='rounded-lg border border-sky-900/60 bg-sky-950/20 p-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-sm font-semibold text-gray-100'>Your journey</h3>
        <span className='text-[11px] text-gray-500'>
          {journey.reached} of {journey.total} reached · {journey.frontier} open
        </span>
      </div>
      <p className='mt-0.5 text-[11px] italic text-gray-500'>
        You pick the key, never the door.
      </p>

      {!started ? (
        <>
          <p className='mt-2 text-xs text-gray-400'>
            You are nowhere yet. Choose where to make landfall — after that, the
            road is not your decision.
          </p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {openings.map(door => (
              <button
                key={door.conceptId}
                type='button'
                onClick={() => onStart(door.conceptId)}
                disabled={busy}
                className='inline-flex items-center gap-1 rounded bg-sky-900 px-2 py-1 text-[11px] text-sky-100 hover:bg-sky-800 disabled:opacity-50'
              >
                {busy ? <Loader2 size={11} className='animate-spin' /> : <MapPin size={11} />}
                {door.conceptName}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className='mt-2 flex items-center gap-1.5 text-xs text-gray-300'>
          <MapPin size={12} className='shrink-0 text-sky-400' />
          <span>
            Standing in <strong className='text-gray-100'>{here?.name ?? 'parts unknown'}</strong>
            {journey.hereName && <span className='text-gray-500'> — {journey.hereName}</span>}
          </span>
        </p>
      )}

      {last && <Outcome response={last} />}
    </div>
  )
}

/**
 * What the world said about the move.
 *
 * A refused key is an outcome and not an error, because most keys will not fit
 * and that is the game. Each refusal names what is missing, which is the half
 * that makes it useful: "that road needs polynomial division, which you have
 * not reached" is a next move, where "locked" is a wall.
 */
function Outcome({ response }: { response: TraverseResponse }) {
  if (response.error) {
    return <p className='mt-2 text-[11px] text-red-300'>{response.error}</p>
  }
  const opened = response.outcome === 'opens'
  const where = response.door ? regions().find(r => r.id === REGION_OF_CONCEPT.get(response.door as string)) : null
  return (
    <div className={`mt-2 rounded border px-2 py-1.5 text-[11px] ${
      opened ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
        : 'border-amber-900/60 bg-amber-950/20 text-amber-200'
    }`}>
      {opened
        ? (
          <p>
            The road opens to <strong>{response.doorName}</strong>
            {where && <> in <strong>{where.name}</strong></>}.
            {response.detail && <span className='block text-emerald-300/80'>{response.detail}</span>}
          </p>
        )
        : <p>{response.because}</p>}
      {response.missing && response.missing.length > 0 && (
        <p className='mt-1 text-amber-300/80'>
          Still needs: {response.missing.map(m => m.conceptName).join(', ')}.
        </p>
      )}
    </div>
  )
}

function Unselected() {
  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900 p-3'>
      <h3 className='text-sm font-semibold text-gray-100'>Pick a place</h3>
      <p className='mt-1 text-xs leading-snug text-gray-400'>
        Twenty-one spheres of influence, nineteen areas of mathematics, and two
        regions that teach none. Each pin is shaded by how much of its area has
        problems written — most of the world is thin, which is the honest state
        of the atlas rather than a rendering fault.
      </p>
    </div>
  )
}

function RegionDetail({ cov, onBrowse, onPractise, held, canTravel, busy, onOffer, isHere }: {
  cov: RegionCoverage
  onBrowse?: (areaId: string, conceptId?: string) => void
  onPractise?: (subjectId: string) => void
  /** Concepts the party has reached HERE. These are the keys it can offer. */
  held: Named[]
  canTravel: boolean
  busy: boolean
  onOffer: (conceptId: string) => void
  isHere: boolean
}) {
  const r: PlacedRegion = cov.region
  const ring = RINGS.find(x => x.id === r.ring)
  const band = density(cov)
  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900 p-3'>
      <h3 className='flex items-center gap-1.5 text-sm font-semibold text-gray-100'>
        {r.name}
        {isHere && (
          <span className='inline-flex items-center gap-1 rounded-full border border-sky-700 px-1.5 py-px text-[10px] font-normal text-sky-300'>
            <MapPin size={9} /> you are here
          </span>
        )}
      </h3>
      <p className='text-xs italic text-gray-500'>{r.epithet}</p>
      <p className='mt-1 text-[11px] text-gray-500'>
        {r.km.toLocaleString()} km from the continental centre · {ring?.name ?? r.ring}
      </p>

      {r.role === 'teaching' ? (
        <>
          <p className='mt-2 text-xs text-gray-200'>
            <span className='font-semibold'>{r.areaName}</span>
            <span className='text-gray-400'>
              {' '}— {cov.written} of {cov.concepts} concepts written ({DENSITY_LABEL[band]})
            </span>
          </p>
          {/* Anchors are resolved against the live graph rather than printed
              from the literal, so a concept renamed out from under this file
              shows as missing here instead of silently linking nowhere. */}
          {/* Anchors are resolved against the live graph rather than printed
              from the literal, so a concept renamed out from under this file
              shows as missing here instead of silently linking nowhere. */}
          <ul className='mt-2 space-y-1'>
            {(r.anchors ?? []).map(id => {
              const c = conceptById(MATHEMATICS, id)
              return (
                <li key={id} className='text-[11px]'>
                  {c
                    ? (
                      <button
                        type='button'
                        onClick={() => onBrowse?.(r.area as string, id)}
                        disabled={!onBrowse}
                        className='text-sky-400 hover:underline disabled:cursor-default disabled:text-gray-300 disabled:no-underline'
                      >
                        {c.name}
                      </button>
                    )
                    : <span className='text-amber-400'>{id} (missing from the atlas)</span>}
                </li>
              )
            })}
          </ul>

          {/* The part of the region you can actually DO. Only five of the
              twenty-one have one, which is the coverage story told as an
              offer rather than as a number. */}
          {cov.authored.length > 0 && (
            <div className='mt-3 border-t border-gray-800 pt-2'>
              <p className='text-[10px] uppercase tracking-wide text-gray-500'>
                Problems written here
              </p>
              <ul className='mt-1 space-y-1'>
                {cov.authored.map(id => (
                  <li key={id}>
                    <button
                      type='button'
                      onClick={() => onPractise?.(id)}
                      disabled={!onPractise}
                      className='text-[11px] text-emerald-400 hover:underline disabled:cursor-default disabled:text-gray-300 disabled:no-underline'
                    >
                      {SUBJECT_NAME[id] ?? id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className='mt-2 text-xs font-semibold text-gray-300'>
          {r.role === 'broker' ? 'Trades in knowledge' : 'Past the edge of the atlas'}
        </p>
      )}

      {/* What the party holds here, offered as keys.
          This is the move, and it lives on the REGION rather than in the
          journey panel on purpose: a key is a thing you learned in a place, so
          offering one should feel like setting out from somewhere. The door it
          opens is still the graph's decision and may be in another region
          entirely — which is exactly the moment the map earns itself, because
          you watch the marker move. */}
      {canTravel && held.length > 0 && (
        <div className='mt-3 border-t border-gray-800 pt-2'>
          <p className='text-[10px] uppercase tracking-wide text-gray-500'>
            Keys you hold here
          </p>
          <div className='mt-1 flex flex-wrap gap-1'>
            {held.map(k => (
              <button
                key={k.conceptId}
                type='button'
                onClick={() => onOffer(k.conceptId)}
                disabled={busy}
                title={`Offer ${k.conceptName} — the graph picks where it leads`}
                className='inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-950 px-1.5 py-0.5 text-[11px] text-gray-200 hover:border-sky-700 hover:text-sky-200 disabled:opacity-50'
              >
                {busy ? <Loader2 size={10} className='animate-spin' /> : <KeyRound size={10} />}
                {k.conceptName}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className='mt-2 text-[11px] leading-snug text-gray-400'>{r.because}</p>

      {r.role === 'teaching' && onBrowse && (
        <button
          type='button'
          onClick={() => onBrowse(r.area as string)}
          className='mt-3 inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-[11px] text-gray-200 hover:border-sky-500 hover:text-sky-300'
        >
          <BookOpen size={11} />
          Open {r.areaName}
          <ArrowRight size={11} />
        </button>
      )}
    </div>
  )
}

function Legend() {
  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500'>
      {(['written', 'some', 'thin', 'none'] as const).map(band => (
        <span key={band} className='inline-flex items-center gap-1'>
          <span className={`inline-block h-2.5 w-2.5 rounded-full border-2 ${DOT[band]}`} />
          {DENSITY_LABEL[band]}
        </span>
      ))}
      <span className='inline-flex items-center gap-1'>
        <span className='inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-gray-600 bg-gray-800' />
        trades in knowledge
      </span>
      <span className='inline-flex items-center gap-1'>
        <span className='inline-block h-2.5 w-2.5 rounded-[2px] border-2 border-gray-600 bg-gray-800' />
        unwritten frontier
      </span>
    </div>
  )
}
