'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

const PERIOD_OPTIONS = [
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
]

interface StatCardProps {
  label: string
  value: string | number
  color?: string
  sub?: string
}

type PortfolioValuePoint = {
  date: string
  value: number
}

type Trade = {
  type?: string
  date?: string
  price?: number
  pnl?: number
}

type BacktestResponse = {
  total_return_pct?: number
  buy_hold_return_pct?: number
  outperformed_buy_hold?: boolean
  win_rate_pct?: number
  winning_trades?: number
  losing_trades?: number
  max_drawdown_pct?: number
  sharpe_ratio?: number
  initial_capital?: number
  portfolio_values?: PortfolioValuePoint[]
  trades?: Trade[]
}

function StatCard({ label, value, color = '#fff', sub }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="font-semibold text-sm" style={{ color }}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export function BacktestChart({
  ticker,
  height = 260,
}: {
  ticker: string
  height?: number
}) {
  const [period, setPeriod] = useState('1y')

  const { data, isLoading } = useQuery<BacktestResponse>({
    queryKey: ['backtest', ticker, period],
    queryFn: () => marketApi.backtest(ticker, period).then((r) => r.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner />
  if (!data) {
    return (
      <div className="text-center py-6 text-gray-600 text-xs">
        Backtest data unavailable — market data required
      </div>
    )
  }

  const totalReturn = data.total_return_pct || 0
  const buyHoldReturn = data.buy_hold_return_pct || 0
  const returnColor = totalReturn >= 0 ? '#22c55e' : '#ef4444'
  const outperformed = data.outperformed_buy_hold
  const chartData = data.portfolio_values || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">Strategy Backtest</span>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                period === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard
          label="Strategy Return"
          value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`}
          color={returnColor}
        />
        <StatCard
          label="Buy & Hold"
          value={`${buyHoldReturn >= 0 ? '+' : ''}${buyHoldReturn.toFixed(2)}%`}
          color={buyHoldReturn >= 0 ? '#22c55e' : '#ef4444'}
          sub={outperformed ? '↑ Strategy wins' : '↓ B&H wins'}
        />
        <StatCard
          label="Win Rate"
          value={`${(data.win_rate_pct || 0).toFixed(1)}%`}
          color={(data.win_rate_pct || 0) >= 50 ? '#22c55e' : '#ef4444'}
          sub={`${data.winning_trades || 0}W / ${data.losing_trades || 0}L`}
        />
        <StatCard
          label="Max Drawdown"
          value={`-${(data.max_drawdown_pct || 0).toFixed(2)}%`}
          color="#ef4444"
          sub={`Sharpe: ${(data.sharpe_ratio || 0).toFixed(2)}`}
        />
      </div>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={`backtestGradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={returnColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={returnColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value: string) => value?.slice(5)}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af', fontSize: 11 }}
              formatter={(value) => `$${Number(value ?? 0).toLocaleString()}`}
            />
            <ReferenceLine
              y={data.initial_capital}
              stroke="#374151"
              strokeDasharray="4 4"
              label={{ value: 'Initial', position: 'right', fill: '#6b7280', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={returnColor}
              strokeWidth={2}
              fill={`url(#backtestGradient-${ticker})`}
              name="Portfolio Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {data.trades && data.trades.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Recent Trades</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.trades.slice(-8).reverse().map((trade, index) => (
              <div key={`${trade.date}-${index}`} className="flex items-center justify-between text-xs bg-gray-800 rounded px-3 py-1.5">
                <span className={trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                  {trade.type?.toUpperCase()}
                </span>
                <span className="text-gray-400">{trade.date}</span>
                <span className="text-white">${trade.price?.toFixed(2)}</span>
                {trade.pnl !== undefined && (
                  <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
