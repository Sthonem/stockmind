'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

type BollingerHistoryPoint = {
  date: string
  price: number
  upper: number
  lower: number
  middle: number
}

type BollingerResponse = {
  direction?: string
  signal?: string
  percent_b?: number
  history?: BollingerHistoryPoint[]
}

export function BollingerChart({ ticker, height = 220 }: { ticker: string; height?: number }) {
  const { data: bbData, isLoading: bbLoading } = useQuery<BollingerResponse>({
    queryKey: ['bollinger', ticker],
    queryFn: () => marketApi.bollinger(ticker).then((r) => r.data),
    enabled: !!ticker,
  })

  if (bbLoading) return <LoadingSpinner size="sm" />
  if (!bbData?.history?.length) {
    return <div className="text-gray-600 text-xs text-center py-4">Bollinger Bands data unavailable</div>
  }

  const signalColor =
    bbData.direction === 'bullish' ? '#22c55e' :
    bbData.direction === 'bearish' ? '#ef4444' : '#6b7280'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Bollinger Bands(20,2)</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-300">%B: {bbData.percent_b?.toFixed(2)}</span>
          <span style={{ color: signalColor }} className="font-medium uppercase">
            {bbData.signal?.replace('_', ' ')}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={bbData.history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            width={55}
            tickFormatter={(value: number) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ fontSize: 11 }}
            formatter={(value) => `$${Number(value ?? 0).toFixed(2)}`}
          />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="#3b82f6"
            strokeWidth={1}
            fill="#3b82f6"
            fillOpacity={0.05}
            name="Upper"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="#3b82f6"
            strokeWidth={1}
            fill="#111827"
            fillOpacity={1}
            name="Lower"
          />
          <Line
            type="monotone"
            dataKey="middle"
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            name="Middle"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Price"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
