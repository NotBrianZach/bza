'use client'

import { useEffect, useState } from 'react'
import { Mail, Copy, Check } from 'lucide-react'

export function NewsletterTab({ useLocalStorage }: { useLocalStorage: boolean }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (useLocalStorage || email) return
    setLoading(true)
    fetch('/api/newsletter/token')
      .then(r => r.json())
      .then(d => { setEmail(d.email) })
      .finally(() => setLoading(false))
  }, [useLocalStorage, email])

  if (useLocalStorage) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center space-y-3">
          <Mail size={32} className="mx-auto text-gray-400" />
          <p className="text-sm text-gray-500">Sign in to get your newsletter email address</p>
          <a href="/auth/signup" className="btn btn-primary inline-flex items-center gap-2 mx-auto">Sign Up Free</a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
          <Mail size={16} />
          <span className="font-medium text-sm">Your newsletter address</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500"><span className="spinner" /> Loading…</div>
        ) : email ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 truncate text-gray-900 dark:text-gray-100 font-mono">
              {email}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(email)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              title="Copy address"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            </button>
          </div>
        ) : (
          <p className="text-sm text-red-500">Failed to load address. Try refreshing.</p>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <p className="font-medium text-gray-800 dark:text-gray-200">How to use it</p>
        <ol className="space-y-1.5 list-none">
          {[
            'Copy your address above',
            'Go to your favourite newsletter (Substack, Mailchimp, etc.)',
            'Subscribe using this address instead of your regular email',
            'Each new issue will appear automatically in your library',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
        <p className="font-medium">Works with any newsletter that delivers via email</p>
        <p>Substack · Mailchimp · Beehiiv · Ghost · Buttondown · ConvertKit · and more</p>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        You can rotate this address in{' '}
        <a href="/settings" className="underline hover:text-gray-600 dark:hover:text-gray-300">Settings</a>
        {' '}if you start receiving spam.
      </p>
    </div>
  )
}
