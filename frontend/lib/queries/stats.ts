import { supabase } from '../supabase'

export interface ReadingStats {
  current_streak: number
  longest_streak: number
  total_pages_read: number
  total_minutes_read: number
  days_read: number
  daily: { date: string; pages: number }[]
}

export const readingStatsQueries = {
  async get(days = 30): Promise<ReadingStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { current_streak: 0, longest_streak: 0, total_pages_read: 0, total_minutes_read: 0, days_read: 0, daily: [] }
    const { data, error } = await supabase.rpc('get_reading_stats', { p_user_id: user.id, p_days: days })
    if (error) throw error
    return data as ReadingStats
  },
}
