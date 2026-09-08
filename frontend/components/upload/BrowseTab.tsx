'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

export function BrowseTab() {
  const router = useRouter()
  const [urlInput, setUrlInput] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Open a live browser session. Captures + bookmarks stay tied to the session in your library.
      </p>
      <input
        type="url"
        value={urlInput}
        onChange={e => setUrlInput(e.target.value)}
        placeholder="https://"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
      />
      <button
        type="button"
        onClick={() => {
          const u = (urlInput || '').trim()
          const dest = u ? `/site?url=${encodeURIComponent(u)}` : '/site'
          router.push(dest)
        }}
        className="btn btn-primary w-full"
      >
        <Globe size={16} className="mr-2" />
        Start Browsing Session
      </button>
    </div>
  )
}
