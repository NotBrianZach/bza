'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SitePanel from '@/components/SitePanel'

export const dynamic = 'force-dynamic'

function SitePageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initialUrl = params.get('url') ?? undefined
  return <SitePanel onClose={() => router.push('/')} initialUrl={initialUrl} />
}

export default function SitePage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#888'}}>Loading…</div>}>
      <SitePageInner />
    </Suspense>
  )
}
