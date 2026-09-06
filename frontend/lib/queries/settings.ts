import { supabase } from '../supabase'
import type { UserPrefs } from './types'
import { PREFS_DEFAULTS } from './types'

export const settingsQueries = {
  async getPrefs(): Promise<UserPrefs> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ...PREFS_DEFAULTS }
    const { data } = await supabase
      .from('profiles')
      .select('prefs')
      .eq('id', user.id)
      .maybeSingle()
    return { ...PREFS_DEFAULTS, ...(data?.prefs ?? {}) }
  },

  async setPref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // jsonb_set-style merge via rpc or just load+update; use update with jsonb concat
    const { data } = await supabase
      .from('profiles')
      .select('prefs')
      .eq('id', user.id)
      .maybeSingle()
    const current = data?.prefs ?? {}
    await supabase
      .from('profiles')
      .update({ prefs: { ...current, [key]: value } })
      .eq('id', user.id)
  },
}
