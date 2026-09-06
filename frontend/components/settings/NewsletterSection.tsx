'use client'

/**
 * NewsletterSection — displays the user's unique inbound-email address
 * and lets them rotate it. Renders nothing if there's no email yet
 * (parent loads it after auth).
 *
 * Props-taking extraction: `email` and the "regenerate" fetch live at
 * parent (initial load), but the copy state + regenerate action live here.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useState } from 'react'
import { Mail, Copy, RefreshCw, Check } from 'lucide-react'

interface NewsletterSectionProps {
  email: string | null
  onEmailChanged: (newEmail: string) => void
}

export default function NewsletterSection({ email, onEmailChanged }: NewsletterSectionProps) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  if (!email) return null

  const copy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const regenerate = async () => {
    if (!confirm('Generate a new address? The old one will stop working.')) return
    setRegenerating(true)
    try {
      const { getAuthHeaders } = await import('@/lib/authedFetch')
      const headers = await getAuthHeaders()
      const res = await fetch('/api/newsletter/token', { method: 'POST', headers })
      const d = await res.json()
      if (d.email) onEmailChanged(d.email)
    } catch { /* silent */ } finally {
      setRegenerating(false)
    }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        <Mail size={15} className="text-blue-500" />
        Email Newsletters
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Subscribe to newsletters using your unique address below. Each email will automatically appear in your library as a readable article.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 text-xs font-mono bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 truncate">
          {email}
        </code>
        <button onClick={copy} title="Copy address" className="flex-shrink-0 flex items-center gap-1 btn btn-secondary text-xs py-2 px-3">
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
        <button
          onClick={regenerate}
          disabled={regenerating}
          title="Generate a new address (invalidates the old one)"
          className="flex-shrink-0 p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
        Use this as your subscriber email for Substack, newsletters, etc. Rotating the address will invalidate the old one.
      </p>
    </section>
  )
}
