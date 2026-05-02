'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { usePortfolioPerformance } from '@/lib/hooks'
import type { PerformanceData } from '@/lib/types'

export function PortfolioValueChart({
  portfolioId,
}: {
  portfolioId: number
  height?: number
}) {
  const { data, isLoading } = usePortfolioPerformance(portfolioId)
  const perf = data as PerformanceData | undefined

  if (isLoading) return <LoadingSpinner size="sm" />

  const isProfit = perf?.is_overall_profitable
  const color = isProfit ? '#22c55e' : '#ef4444'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Total Invested</p>
          <p className="text-white font-semibold">
            ${perf?.total_cost_basis?.toLocaleString() || '—'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Current Value</p>
          <p className="font-semibold" style={{ color }}>
            ${perf?.total_current_value?.toLocaleString() || '—'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Unrealized P&L</p>
          <p className="font-semibold" style={{ color }}>
            {(perf?.total_unrealized_pnl || 0) >= 0 ? '+' : ''}
            ${perf?.total_unrealized_pnl?.toFixed(2) || '—'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Return %</p>
          <p className="font-semibold" style={{ color }}>
            {(perf?.total_unrealized_pnl_pct || 0) >= 0 ? '+' : ''}
            {perf?.total_unrealized_pnl_pct?.toFixed(2) || '—'}%
          </p>
        </div>
      </div>

      {perf?.best_performer && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Best: <span className="text-green-400 font-medium">{perf.best_performer}</span></span>
          <span>Worst: <span className="text-red-400 font-medium">{perf.worst_performer}</span></span>
        </div>
      )}
    </div>
  )
}
