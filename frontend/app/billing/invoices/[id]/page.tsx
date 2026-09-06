'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Invoice, InvoiceLineItem } from '@/types'
import { billingQueries } from '@/lib/queries'
import { ArrowLeft, Download, FileText } from 'lucide-react'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = parseInt(params.id as string)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { invoice, line_items } = await billingQueries.getInvoice(invoiceId)
      setInvoice(invoice)
      setLineItems(line_items)
    } catch (err: any) {
      console.error('Error loading invoice:', err)
      setError('Failed to load invoice')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Invoice not found'}</p>
          <button
            onClick={() => router.push('/billing')}
            className="btn btn-primary"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Billing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/billing')}
                className="btn btn-secondary"
              >
                <ArrowLeft size={20} />
              </button>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Invoice #{invoice.invoice_number}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                </p>
              </div>
            </div>

            {invoice.pdf_url && (
              <a
                href={invoice.pdf_url}
                download
                className="btn btn-primary"
              >
                <Download size={20} className="mr-2" />
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Invoice Summary */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Status</div>
              <StatusBadge status={invoice.status} />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">API Cost</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                ${invoice.api_cost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">BZA Markup (2x)</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                ${invoice.markup_cost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${invoice.total_amount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Details</h2>
          </div>

          {lineItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No line items found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    API Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.description}
                      </div>
                      {item.model_name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Model: {item.model_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                      ${item.base_cost.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ${item.total_cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Total
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${invoice.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pricing Transparency */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Transparent Pricing Breakdown
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div className="flex justify-between">
              <span>Base API Costs:</span>
              <span className="font-semibold">${invoice.api_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>BZA Markup (2x):</span>
              <span className="font-semibold">${invoice.markup_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-300">
              <span className="font-semibold">You Pay:</span>
              <span className="font-bold">${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
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
