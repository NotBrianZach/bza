'use client'

import { useEffect, useState } from 'react'
import { readingStatsQueries, ReadingStats } from '@/lib/queries/stats'
import { Flame, BookOpen, Clock, Calendar } from 'lucide-react'

export default function ReadingStreaks() {
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('bza-daily-goal') ?? '0') || 0 } catch { return 0 }
  })
  const [editingGoal, setEditingGoal] = useState(false)

  useEffect(() => {
    readingStatsQueries.get(30).then(setStats).catch(() => {})
  }, [])

  if (!stats) return null
  if (stats.days_read === 0) return null

  const today = new Date()
  const days: { date: string; pages: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = stats.daily.find(x => x.date === key)
    days.push({ date: key, pages: found?.pages ?? 0 })
  }

  const maxPages = Math.max(...days.map(d => d.pages), 1)

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Flame size={16} className={stats.current_streak > 0 ? 'text-orange-500' : 'text-gray-400'} />
          Reading Streak
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {stats.total_pages_read.toLocaleString()} pages total
          </span>
          {stats.total_minutes_read > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {Math.round(stats.total_minutes_read / 60)}h read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {stats.days_read} days read
          </span>
        </div>
      </div>

      {/* Streak badges */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col items-center bg-orange-50 dark:bg-orange-950/30 rounded-lg px-4 py-2 min-w-[80px]">
          <span className="text-2xl font-black text-orange-500">{stats.current_streak}</span>
          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            {stats.current_streak === 1 ? 'day streak' : 'day streak'}
          </span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 min-w-[80px]">
          <span className="text-2xl font-black text-gray-700 dark:text-gray-200">{stats.longest_streak}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">best streak</span>
        </div>
      </div>

      {/* Daily goal */}
      <div className="flex items-center gap-2 mb-4">
        {editingGoal ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={dailyGoal || ''}
              onChange={e => setDailyGoal(parseInt(e.target.value) || 0)}
              className="input w-20 text-xs py-1"
              placeholder="Pages"
              autoFocus
            />
            <button
              onClick={() => { localStorage.setItem('bza-daily-goal', String(dailyGoal)); setEditingGoal(false) }}
              className="text-xs text-green-600 hover:underline"
            >Save</button>
            <button onClick={() => setEditingGoal(false)} className="text-xs text-gray-400">Cancel</button>
          </div>
        ) : dailyGoal > 0 ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${(days[days.length - 1]?.pages ?? 0) >= dailyGoal ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(100, ((days[days.length - 1]?.pages ?? 0) / dailyGoal) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {days[days.length - 1]?.pages ?? 0}/{dailyGoal} pages today
            </span>
            <button onClick={() => setEditingGoal(true)} className="text-[10px] text-gray-400 hover:text-gray-600">Edit</button>
          </div>
        ) : (
          <button onClick={() => setEditingGoal(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            + Set daily reading goal
          </button>
        )}
      </div>

      {/* 30-day bar chart */}
      <div className="flex items-end gap-px h-12" title="Pages read per day (last 30 days)">
        {days.map(({ date, pages }) => {
          const height = pages > 0 ? Math.max(15, Math.round((pages / maxPages) * 48)) : 3
          const isToday = date === today.toISOString().slice(0, 10)
          return (
            <div
              key={date}
              className="flex-1 relative group"
              style={{ height: 48, display: 'flex', alignItems: 'flex-end' }}
            >
              <div
                className={`w-full rounded-sm transition-all ${
                  pages > 0
                    ? isToday
                      ? 'bg-orange-500'
                      : 'bg-orange-300 dark:bg-orange-700'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
                style={{ height }}
              />
              {pages > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {date.slice(5)}: {pages}p
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>30 days ago</span>
        <span>today</span>
      </div>
    </div>
  )
}
