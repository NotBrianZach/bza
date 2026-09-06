'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { settingsQueries } from '@/lib/queries/settings'
import type { UserPrefs } from '@/lib/queries/types'
import { PREFS_DEFAULTS } from '@/lib/queries/types'
import { AUTO_COVER_KEY } from '@/lib/queries/images'
import AiPersonaSection from '@/components/settings/AiPersonaSection'
import DisplaySizesSection from '@/components/settings/DisplaySizesSection'
import ReaderTextColorSection from '@/components/settings/ReaderTextColorSection'
import VoiceSection from '@/components/settings/VoiceSection'
import AiModelsSection from '@/components/settings/AiModelsSection'
import WebhooksSection from '@/components/settings/WebhooksSection'
import AiPromptsSection from '@/components/settings/AiPromptsSection'
import PreferencesSection from '@/components/settings/PreferencesSection'
import NewsletterSection from '@/components/settings/NewsletterSection'
import ScoreBarsSection from '@/components/settings/ScoreBarsSection'
import ExportSection from '@/components/settings/ExportSection'
import ImportHighlightsSection from '@/components/settings/ImportHighlightsSection'

/**
 * SettingsPage is now a thin composition shell.
 *
 * All feature sections live in components/settings/*.tsx and own their own
 * state and persistence. Two exceptions require props:
 *   - PreferencesSection: prefs live at parent (Supabase-backed via
 *     settingsQueries) so setPref/prefs are passed through.
 *   - NewsletterSection: initial email fetched at parent so route conditional
 *     stays simple.
 *
 * Refactor from 1234 loc god-component landed across commits 601, 603-606,
 * and this one (task #5).
 */
export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [prefs, setPrefs] = useState<UserPrefs>(PREFS_DEFAULTS)
  const [isPro, setIsPro] = useState(false)
  const [autoCover, setAutoCover] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user)
      if (session?.user) {
        settingsQueries.getPrefs().then(setPrefs).catch(() => { /* silent */ })
      }
    })
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.rpc('get_user_quota', { user_uuid: user.id })
        if ((data as any)?.[0]?.tier && (data as any)[0].tier !== 'free') setIsPro(true)
      } catch { /* silent */ }
    })()
    setAutoCover(localStorage.getItem(AUTO_COVER_KEY) !== 'false')
    fetch('/api/newsletter/token')
      .then(r => r.json())
      .then(d => { if (d.email) setNewsletterEmail(d.email) })
      .catch(() => { /* silent */ })
  }, [])

  const setPref = async <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setPrefs(p => ({ ...p, [key]: value }))
    try { await settingsQueries.setPref(key, value) } catch { /* silent */ }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <AiPersonaSection />
        <DisplaySizesSection />
        <ReaderTextColorSection />
        <VoiceSection />
        <AiModelsSection />
        <WebhooksSection isAuthenticated={!!isAuthenticated} isPro={isPro} />
        <AiPromptsSection />

        {isAuthenticated && (
          <PreferencesSection
            prefs={prefs}
            setPref={setPref}
            autoCover={autoCover}
            setAutoCover={setAutoCover}
            autoCoverStorageKey={AUTO_COVER_KEY}
          />
        )}

        {!isAuthenticated && isAuthenticated !== null && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <Link href="/auth/login" className="text-indigo-600 hover:underline">Sign in</Link> to sync preferences to your account.
          </p>
        )}

        {isAuthenticated && (
          <NewsletterSection email={newsletterEmail} onEmailChanged={setNewsletterEmail} />
        )}

        <ScoreBarsSection />

        {isAuthenticated && <ExportSection />}
        {isAuthenticated && <ImportHighlightsSection />}
      </div>
    </div>
  )
}
