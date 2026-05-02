'use client'

import { useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useOHLCV } from '@/lib/hooks'

interface PriceChartProps {
  ticker: string
  period?: string
  height?: number
}

type OhlcvRecord = {
  date?: string
  close?: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

type ChartPoint = {
  date: string
  close: number
  open: number
  high: number
  low: number
  volume: number
}

type TooltipPayload = {
  dataKey: string
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-white font-medium">
            {entry.dataKey === 'volume'
              ? `${(entry.value / 1_000_000).toFixed(1)}M`
              : `$${Number(entry.value).toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  )
}

const PERIOD_OPTIONS = ['1mo', '3mo', '6mo', '1y', '2y']

export function PriceChart({ ticker, period = '6mo', height = 320 }: PriceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const { data, isLoading, error } = useOHLCV(ticker, selectedPeriod)

  const chartData: ChartPoint[] = data?.data?.map((d: OhlcvRecord) => ({
    date: d.date?.slice(0, 10) || '',
    close: Number(d.close?.toFixed(2) || 0),
    open: Number(d.open?.toFixed(2) || 0),
    high: Number(d.high?.toFixed(2) || 0),
    low: Number(d.low?.toFixed(2) || 0),
    volume: d.volume || 0,
  })) || []

  const minPrice = chartData.length
    ? Math.min(...chartData.map((d) => d.low)) * 0.99
    : 0
  const maxPrice = chartData.length
    ? Math.max(...chartData.map((d) => d.high)) * 1.01
    : 100

  const firstPrice = chartData[0]?.close
  const lastPrice = chartData[chartData.length - 1]?.close
  const priceChange = firstPrice && lastPrice ? lastPrice - firstPrice : 0
  const priceChangePct = firstPrice ? (priceChange / firstPrice) * 100 : 0
  const isPositive = priceChange >= 0

  if (isLoading) return <LoadingSpinner />
  if (error || !chartData.length) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        Price data unavailable
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white font-semibold">{ticker}</span>
          {lastPrice ? (
            <span className="text-white text-lg font-bold">${lastPrice.toFixed(2)}</span>
          ) : null}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(value: string) => value?.slice(5)}
          />
          <YAxis
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value.toFixed(0)}`}
            width={55}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fill: '#374151', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(0)}M`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#1f2937"
            opacity={0.6}
            name="Volume"
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            dot={false}
            name="Price"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
