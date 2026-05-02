'use client'

import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

type RSIHistoryPoint = {
  date: string
  rsi: number
}

type RSIResponse = {
  rsi?: number
  signal?: string
  history?: RSIHistoryPoint[]
}

export function RSIChart({ ticker, height = 200 }: { ticker: string; height?: number }) {
  const { data, isLoading } = useQuery<RSIResponse>({
    queryKey: ['rsi', ticker],
    queryFn: () => marketApi.rsi(ticker).then((r) => r.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data?.history?.length) {
    return <div className="text-gray-600 text-xs text-center py-4">RSI data unavailable</div>
  }

  const latestRSI = data.rsi
  const signal = data.signal || 'neutral'
  const signalColor =
    signal === 'overbought' ? '#ef4444' :
    signal === 'oversold' ? '#22c55e' : '#6b7280'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">RSI(14)</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{latestRSI?.toFixed(1)}</span>
          <span style={{ color: signalColor }} className="font-medium uppercase">
            {signal}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data.history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ color: '#fff', fontSize: 11 }}
          />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine y={50} stroke="#374151" strokeDasharray="2 2" strokeOpacity={0.4} />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            name="RSI"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-gray-600">
        <span className="text-green-600">Oversold (&lt;30)</span>
        <span className="text-red-600">Overbought (&gt;70)</span>
      </div>
    </div>
  )
}
