'use client'

import { UsageStats as UsageStatsType } from '@/types'
import { TrendingUp, Image, BookOpen, DollarSign } from 'lucide-react'

interface UsageStatsProps {
  stats: UsageStatsType
}

export default function UsageStats({ stats }: UsageStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={<TrendingUp size={24} />}
        title="Tokens This Month"
        value={`${(stats.tokens_used / 1000).toFixed(1)}k / ${(stats.tokens_limit / 1000).toFixed(0)}k`}
        percentage={stats.tokens_percentage}
        color="blue"
      />

      <StatCard
        icon={<Image size={24} />}
        title="Images Generated"
        value={`${stats.images_used} / ${stats.images_limit}`}
        percentage={stats.images_percentage}
        color="purple"
      />

      <StatCard
        icon={<BookOpen size={24} />}
        title="Active Books"
        value={`${stats.books_count} / ${stats.books_limit}`}
        percentage={(stats.books_count / stats.books_limit) * 100}
        color="green"
      />

      <StatCard
        icon={<DollarSign size={24} />}
        title="Total Cost"
        value={`$${stats.total_cost.toFixed(2)}`}
        subtitle={`API: $${stats.api_cost.toFixed(2)} | Markup: $${stats.markup_cost.toFixed(2)}`}
        color="orange"
      />
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  percentage,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle?: string
  percentage?: number
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  const progressColors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
  }

  return (
    <div className="card">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{value}</div>

      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{subtitle}</div>
      )}

      {percentage !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${progressColors[color]} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
