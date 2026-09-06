'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExchangeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (!code) {
      router.replace(next)
      return
    }

    // Use supabase.auth.exchangeCodeForSession — it reads the PKCE verifier from
    // its own storage (handling base64url + JSON encoding internally) and stores
    // the resulting session without calling _getUser() (which hangs on mobile).
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          router.replace(`/auth/login?error=${encodeURIComponent(error.message)}`)
          return
        }
        window.location.replace(next)
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        router.replace(`/auth/login?error=${encodeURIComponent(msg)}`)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Signing in…</p>
      </div>
    </div>
  )
}

export default function ExchangePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Signing in…</p>
        </div>
      </div>
    }>
      <ExchangeHandler />
    </Suspense>
  )
}
