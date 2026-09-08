'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Renders an image whose src may be a storage:// URL, a legacy public
// storage URL, a bare bucket path, or a plain HTTP URL. Signed URLs are
// generated for the storage variants; plain URLs pass through.
export function StorageImage({ src, alt }: { src?: string; alt?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState('')
  useEffect(() => {
    if (!src) return
    // storage://bucket/path scheme
    const storageMatch = src.match(/^storage:\/\/([^/]+)\/(.+)$/)
    if (storageMatch) {
      const [, bucket, path] = storageMatch
      supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
        if (data?.signedUrl) setResolvedSrc(data.signedUrl)
      })
      return
    }
    // Old public URLs: .../storage/v1/object/public/BUCKET/PATH
    const publicMatch = src.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
    if (publicMatch) {
      const [, bucket, path] = publicMatch
      supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
        if (data?.signedUrl) setResolvedSrc(data.signedUrl)
      })
      return
    }
    // Raw path (no scheme, no URL) — assume page-images bucket
    if (!src.startsWith('http') && !src.startsWith('data:') && src.includes('/')) {
      supabase.storage.from('page-images').createSignedUrl(src, 3600).then(({ data }) => {
        if (data?.signedUrl) setResolvedSrc(data.signedUrl)
      })
      return
    }
    // Regular URL — pass through
    setResolvedSrc(src)
  }, [src])
  if (!resolvedSrc) return null
  return <img src={resolvedSrc} alt={alt ?? ''} referrerPolicy="no-referrer" style={{ maxWidth: '100%' }} loading="lazy" />
}
