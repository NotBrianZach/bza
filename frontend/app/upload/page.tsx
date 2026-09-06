'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { billingQueries } from '@/lib/queries'
import BookUpload from '@/components/BookUpload'

export default function UploadPage() {
  const router = useRouter()
  const [useLocalStorage, setUseLocalStorage] = useState<boolean | null>(null)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const noSession = { data: { session: null }, error: null } as const
    Promise.race([
      supabase.auth.getSession(),
      new Promise<typeof noSession>(resolve => setTimeout(() => resolve(noSession), 4000)),
    ]).then(async ({ data: { session } }) => {
      // Only treat as authenticated if the user has a real account (email/OAuth),
      // not an anonymous session — anonymous sessions have no email and their
      // books won't show up on the home page which uses the same email check.
      const isRealUser = !!session?.user?.email
      setUseLocalStorage(!isRealUser)
      if (isRealUser) {
        const quota = await billingQueries.getQuota().catch(() => null)
        setIsPro((quota?.tier ?? 'free') !== 'free')
      }
    })
  }, [])

  if (useLocalStorage === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <BookUpload
        useLocalStorage={useLocalStorage}
        isPro={isPro}
        onSuccess={() => router.push('/')}
        onCancel={() => router.push('/')}
      />
    </div>
  )
}
