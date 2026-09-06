'use client'

import { useEffect } from 'react'
import { migrateContentToIDB } from '@/lib/localStorage'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    migrateContentToIDB().catch(() => {})
  }, [])
  return <>{children}</>
}
