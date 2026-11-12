'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowUpRight, GitBranch, PencilRuler } from 'lucide-react'
import { MATHEMATICS } from '@/lib/concepts/atlas'
import { conceptHref, relatedConcepts } from '@/lib/concepts/offerings'
import type { Offering } from '@/lib/correlate/types'

/**
 * Where a theorem in play sits in the practice graph.
 *
 * The two halves of this app have been strangers: /play puts a theorem on the
 * table as a thing to correlate, and /learn holds a graph of the same
 * mathematics as a thing to practise. A theorem arriving in a game was a dead
 * end — you could read it and answer it with a painting, and nothing said "this
 * is the quadratic formula, which rests on factoring, and you have problems
 * waiting on both".
 *
 * Read against `MATHEMATICS` — the whole atlas, not the authored subjects.
 * Deliberate, and the reason `practisable` is carried per concept: the atlas is
 * mostly mapped and unwritten, so restricting to what has problems would hide
 * the structure, while pretending everything has problems would promise panels
 * that are empty. Showing the position and labelling what can be practised is
 * the only version of this that is true.
 */
export default function ConceptTrail({ offering }: { offering: Offering }) {
  const related = useMemo(() => relatedConcepts(MATHEMATICS, offering), [offering])
  if (related.length === 0) return null

  // `practisable`, not `teachable`, and the variable was named for the field it
  // wanted rather than the one it read: the count is printed as "N with
  // problems", which is a claim about TASKS. See the header of offerings.ts.
  const practisable = related.filter(c => c.practisable)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
        <GitBranch size={11} />
        In the practice graph
        {practisable.length > 0 && (
          <span className="font-normal normal-case tracking-normal text-gray-400 dark:text-gray-500">
            · {practisable.length} with problems
          </span>
        )}
      </p>

      <ul className="flex flex-wrap gap-1.5">
        {related.map(c => (
          <li key={c.id}>
            <Link
              href={conceptHref(c)}
              title={c.practisable
                ? `${c.name} — ${c.relation}. Open it in practice.`
                : `${c.name} — ${c.relation}. ${c.teachable
                  ? 'There is material to read, but no problems are written for it yet.'
                  : 'Mapped, but nothing is authored for it yet, so there are no problems to do.'}`
                  + (c.caveat ? ` ${c.caveat}` : '')}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors ${
                c.practisable
                  ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/40'
                  // Visibly weaker, because it goes somewhere different: the
                  // graph rather than a problem. A learner who cannot tell the
                  // two apart before clicking learns to distrust both.
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {c.practisable ? <PencilRuler size={10} /> : <ArrowUpRight size={10} />}
              {c.name}
              {c.relation !== 'about' && (
                <span className="text-gray-400 dark:text-gray-500">· {c.relation}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
