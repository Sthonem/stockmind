'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

type MACDHistoryPoint = {
  date: string
  macd: number
  signal: number
  histogram: number
}

type MACDResponse = {
  direction?: string
  signal?: string
  history?: MACDHistoryPoint[]
}

export function MACDChart({ ticker, height = 200 }: { ticker: string; height?: number }) {
  const { data, isLoading } = useQuery<MACDResponse>({
    queryKey: ['macd', ticker],
    queryFn: () => marketApi.macd(ticker).then((r) => r.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data?.history?.length) {
    return <div className="text-gray-600 text-xs text-center py-4">MACD data unavailable</div>
  }

  const signalColor =
    data.direction === 'bullish' ? '#22c55e' :
    data.direction === 'bearish' ? '#ef4444' : '#6b7280'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">MACD(12,26,9)</span>
        <span style={{ color: signalColor }} className="font-medium uppercase">
          {data.signal}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data.history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            width={45}
            tickFormatter={(value: number) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
          <Bar dataKey="histogram" name="Histogram" opacity={0.8}>
            {data.history.map((entry, index) => (
              <Cell
                key={`cell-${entry.date}-${index}`}
                fill={entry.histogram >= 0 ? '#22c55e' : '#ef4444'}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            name="MACD"
          />
          <Line
            type="monotone"
            dataKey="signal"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            name="Signal"
            strokeDasharray="4 4"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 inline-block" /> MACD
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-yellow-500 inline-block border-dashed border-t" /> Signal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-gray-600 inline-block" /> Histogram
        </span>
      </div>
    </div>
  )
}
