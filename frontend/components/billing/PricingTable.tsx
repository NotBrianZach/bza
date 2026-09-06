'use client'

import { PricingConfig } from '@/types'

interface PricingTableProps {
  pricing: PricingConfig[]
}

export default function PricingTable({ pricing }: PricingTableProps) {
  const textModels = pricing.filter(p => p.type === 'text')
  const imageModels = pricing.filter(p => p.type === 'image')

  return (
    <div className="space-y-6">
      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-2 border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Free</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">$0<span className="text-base font-normal text-gray-500">/mo</span></div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5 mt-3">
            <li>✓ $2 of AI included per month</li>
            <li>✓ Chat, analysis, quizzes</li>
            <li>✓ Local storage (browser only)</li>
            <li className="text-gray-400">✗ Blocked when $2 quota reached</li>
            <li className="text-gray-400">✗ No cloud backup</li>
          </ul>
        </div>
        <div className="card border-2 border-primary-500">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400 mb-2">Pro</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">$6.55<span className="text-base font-normal text-gray-500">/mo</span></div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5 mt-3">
            <li>✓ $5 of AI included per month</li>
            <li>✓ Pay-as-you-go beyond $5 (2× API cost)</li>
            <li>✓ Cloud storage + sync across devices</li>
            <li>✓ 2 GB cloud storage (+ $1/mo per 2 GB)</li>
            <li>✓ AI-generated illustrations</li>
          </ul>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Includes $5 AI budget ($2 free + $3 pro)</p>
        </div>
      </div>

      {/* Text Models */}
      {textModels.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text Models</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Pricing per 1 million tokens</p>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Input
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Output
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  You Pay (2x)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {textModels.map((model) => (
                <tr key={model.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {model.model_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    ${model.input_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    ${model.output_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    ${(model.input_cost * 2).toFixed(2)} / ${(model.output_cost * 2).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Models */}
      {imageModels.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Image Models</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Pricing per image</p>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  API Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  You Pay (2x)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {imageModels.map((model) => (
                <tr key={model.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {model.model_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {model.image_size || 'Standard'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    ${model.input_cost.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    ${(model.input_cost * 2).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transparency Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">How overage billing works</h4>
        <p className="text-sm text-blue-800">
          Pro includes $5 of AI per month. Once you exceed that, additional usage is billed at 2× the raw API cost — you only pay for what you use. Free accounts are hard-capped at $2 with no overage.
        </p>
      </div>
    </div>
  )
}
