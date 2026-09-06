'use client'

/**
 * UpgradeGate — modal shown at moments of pain (quota hit, storage full,
 * Pro-only feature attempted). One-tap conversion path with analytics
 * tracking on click. See task #4 (deliberate free→paid conversion gates).
 *
 * Variants:
 *   - <UpgradeGate open reason="chat_quota" onClose={...} />
 *   - <UpgradeGate open reason="storage_full" onClose={...} />
 *   - <UpgradeGate open reason="translate_book" onClose={...} />
 *   - <UpgradeGate open reason="tts_pro_voice" onClose={...} />
 *
 * Each reason has bespoke copy + CTA text tuned to the moment.
 */

import { useEffect } from 'react'
import { X, ArrowUpRight, Sparkles } from 'lucide-react'
import { track } from '@/lib/analytics'

export type UpgradeReason =
  | 'chat_quota'
  | 'storage_full'
  | 'book_quota'
  | 'translate_book'
  | 'tts_pro_voice'
  | 'image_quota'

interface UpgradeGateProps {
  open: boolean
  reason: UpgradeReason
  isAuthenticated?: boolean
  onClose: () => void
  /** Optional: additional context that appears above the CTA (e.g. "You've used 8/10 free images this month.") */
  detail?: string
}

const COPY: Record<UpgradeReason, { title: string; body: string; cta: string; href: string }> = {
  chat_quota: {
    title: 'You\'ve used your free AI budget',
    body: 'Free tier gives you $2/mo in AI chat, structure scans, and problem-set generation. Pro includes $5/mo + pay-as-you-go, so you can keep the conversation going.',
    cta: 'Upgrade to Pro — $5/mo',
    href: '/billing',
  },
  storage_full: {
    title: 'Your browser storage is full',
    body: 'Free tier stores books in your browser (localStorage, ~5MB). Upgrade to Pro and your library moves to the cloud — unlimited books, sync across devices, and safe from cache clears.',
    cta: 'Upgrade to Cloud',
    href: '/auth/signup',
  },
  book_quota: {
    title: 'You\'ve hit your book limit',
    body: 'Your current plan caps how many books you can add. Pro removes the cap and unlocks larger file uploads, faster processing, and priority workers.',
    cta: 'Upgrade to Pro',
    href: '/billing',
  },
  translate_book: {
    title: 'Whole-book translation is a Pro feature',
    body: 'Translate any book into 30+ languages, keep the original side-by-side, and export as .bza. Free tier can translate one page at a time.',
    cta: 'Upgrade to Pro',
    href: '/billing',
  },
  tts_pro_voice: {
    title: 'AI narration is a Pro feature',
    body: 'Free tier uses your browser\'s built-in voice. Pro unlocks studio-quality AI narration (ElevenLabs) with 20+ voices and persona-matched tone.',
    cta: 'Upgrade to Pro',
    href: '/billing',
  },
  image_quota: {
    title: 'You\'ve used your image credits',
    body: 'Free tier: 10 AI-generated illustrations per month. Pro: 100/month plus higher-resolution renders.',
    cta: 'Upgrade to Pro',
    href: '/billing',
  },
}

export default function UpgradeGate({ open, reason, isAuthenticated = true, onClose, detail }: UpgradeGateProps) {
  useEffect(() => {
    if (open) track('upgrade_gate_shown', { reason })
  }, [open, reason])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const copy = COPY[reason]
  // If not authenticated, always send them to signup first
  const href = isAuthenticated ? copy.href : '/auth/signup'
  const cta = isAuthenticated ? copy.cta : 'Sign up free — then upgrade'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-gate-title"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-8 text-white">
          <div className="flex items-center gap-2 mb-2 text-white/80 text-xs uppercase tracking-wide font-semibold">
            <Sparkles size={14} />
            Pro feature
          </div>
          <h2 id="upgrade-gate-title" className="text-xl font-bold leading-tight">{copy.title}</h2>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{copy.body}</p>
          {detail && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
              {detail}
            </p>
          )}

          <div className="flex flex-col gap-2 mt-5">
            <a
              href={href}
              onClick={() => track('upgrade_clicked', { source: `gate:${reason}` })}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              {cta}
              <ArrowUpRight size={14} />
            </a>
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
