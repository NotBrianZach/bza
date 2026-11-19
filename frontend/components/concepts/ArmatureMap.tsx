'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, BookOpen } from 'lucide-react'
import {
  ARMATURE_MAP, RINGS, regionCoverage, regions,
  type PlacedRegion, type RegionCoverage,
} from '@/lib/concepts/armature'
import { MATHEMATICS, atlasCoverage } from '@/lib/concepts/atlas'
import { ONTOLOGIES } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'

/**
 * The Armature — nineteen areas of mathematics given a geography.
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

export default function ArmatureMap({ onBrowse, onPractise }: {
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

  return (
    <div className='space-y-3'>
      <p className='text-xs leading-snug text-gray-400'>
        Every sphere of influence on the Armature carries one area of mathematics, so
        atlas has a geography. Travelling outward from the centre runs roughly
        rules → structure → change → analysis. That is a story, not a syllabus:
        nothing here gates anything, and what actually has to come first is on the
        Concepts tab.
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
            alt='The Armature — a geographical atlas of the areas of mathematics'
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
                  isSelected ? 'z-20' : 'z-10'
                } group focus:outline-none`}
                aria-pressed={isSelected}
                /* The accessible name carries the mathematics too: a screen
                   reader on twenty-one identical dots otherwise gets twenty-one
                   place names and no reason to pick one. */
                aria-label={`${region.name} — ${region.areaName
                  ?? (region.role === 'broker' ? 'trades in other regions’ knowledge' : 'nothing written here')
                }, ${DENSITY_LABEL[band]}`}
                title={`${region.name} — ${region.areaName ?? region.epithet}`}
              >
                <span
                  className={`absolute left-1 top-1 block h-2.5 w-2.5 border-2 shadow ${DOT[band]} ${
                    region.role === 'frontier' ? 'rounded-[2px]'
                      : region.role === 'broker' ? 'rounded-full border-dashed' : 'rounded-full'
                  } ${isSelected ? 'ring-2 ring-sky-300' : ''} transition-transform group-hover:scale-125`}
                />
                <span
                  className={`pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded border border-gray-700 bg-gray-900/95 px-1 py-px text-[10px] text-gray-100 transition-opacity ${edge} ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  }`}
                >
                  {region.name}
                </span>
              </button>
            )
          })}
        </div>

        <div className='min-h-[140px]'>
          {selected
            ? <RegionDetail cov={selected} onBrowse={onBrowse} onPractise={onPractise} />
            : <Unselected />}
        </div>
      </div>

      <Legend />

      {/* Said out loud rather than quietly hoped past. The drawing still
          carries its own title in the corner, so a reader WILL notice the two
          names and the only question is whether we explain it or look as
          though we were hiding it. */}
      <p className='text-[10px] text-gray-600'>
        The Armature takes its geography, its city names and this atlas from the
        tabletop setting Armat&nbsp;Sur. The mathematics is ours.
      </p>
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

function RegionDetail({ cov, onBrowse, onPractise }: {
  cov: RegionCoverage
  onBrowse?: (areaId: string, conceptId?: string) => void
  onPractise?: (subjectId: string) => void
}) {
  const r: PlacedRegion = cov.region
  const ring = RINGS.find(x => x.id === r.ring)
  const band = density(cov)
  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900 p-3'>
      <h3 className='text-sm font-semibold text-gray-100'>{r.name}</h3>
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
