'use client'

import { Invoice } from '@/types'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { timeAgo } from '@/lib/timeAgo'

interface InvoiceListProps {
  invoices: Invoice[]
}

export default function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="card text-center py-12">
        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-600 dark:text-gray-300">No invoices yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Invoices are generated monthly based on your usage
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Invoice
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  #{invoice.invoice_number}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(new Date(invoice.created_at))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${invoice.total_amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  API: ${invoice.api_cost.toFixed(2)} + Markup: ${invoice.markup_cost.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={`/billing/invoices/${invoice.id}`}
                    className="text-blue-600 hover:text-blue-700"
                    title="View Details"
                  >
                    <ExternalLink size={16} />
                  </a>
                  {invoice.pdf_url && (
                    <a
                      href={invoice.pdf_url}
                      download
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-700"
                      title="Download PDF"
                    >
                      <Download size={16} />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
