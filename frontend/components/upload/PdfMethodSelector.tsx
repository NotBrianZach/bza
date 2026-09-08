'use client'

import type { ProcessingMethod } from './types'

export function PdfMethodSelector({ method, onChange, isPro, fileSizeBytes }: {
  method: ProcessingMethod
  onChange: (m: ProcessingMethod) => void
  isPro: boolean
  fileSizeBytes: number
}) {
  // Rough estimate: ~85 KB per page average
  const estPages = Math.max(1, Math.round(fileSizeBytes / 85_000))
  const mathpixCost = (estPages * 0.004 * 2).toFixed(2) // $0.004/page × 2× markup

  const methods: { id: ProcessingMethod; label: string; quality: string; speed: string; cost: string; proOnly?: boolean }[] = [
    { id: 'jina',    label: 'Jina',    quality: 'Good',        speed: '~30s',       cost: 'Free' },
    { id: 'nougat',  label: 'Nougat',  quality: 'Great (math)',speed: '10–30 min',  cost: `~$${(estPages * 0.002 * 2).toFixed(2)}` },
    { id: 'mathpix', label: 'Mathpix', quality: 'Best (math)', speed: '~1–3 min',   cost: `~$${mathpixCost}` },
  ]

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Processing method
        <span className="ml-1.5 text-xs font-normal text-gray-400">(est. {estPages} pages)</span>
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
        {/* Header row */}
        <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium px-3 py-1.5 border-b border-gray-200 dark:border-gray-600">
          <span>Method</span><span>Quality</span><span>Speed</span><span>Cost</span>
        </div>
        {methods.map(m => {
          const locked = m.proOnly && !isPro
          const selected = method === m.id
          return (
            <button
              key={m.id}
              type="button"
              disabled={locked}
              onClick={() => onChange(m.id)}
              className={`w-full grid grid-cols-4 px-3 py-2 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                selected
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : locked
                  ? 'opacity-50 cursor-not-allowed bg-white dark:bg-gray-800'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40'
              }`}
            >
              <span className={`font-semibold flex items-center gap-1.5 ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-500'}`} />
                {m.label}
                {m.proOnly && <span className="text-[10px] font-bold px-1 py-0 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Pro</span>}
              </span>
              <span className="text-gray-600 dark:text-gray-300">{m.quality}</span>
              <span className="text-gray-500 dark:text-gray-400">{m.speed}</span>
              <span className={m.id === 'mathpix' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>{m.cost}</span>
            </button>
          )
        })}
      </div>
      {method === 'nougat' && (
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Nougat runs on a GPU worker — expect 10–30 min for large textbooks.</p>
      )}
      {method === 'mathpix' && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Estimated cost charged to your account. Final amount depends on actual page count.</p>
      )}
    </div>
  )
}
