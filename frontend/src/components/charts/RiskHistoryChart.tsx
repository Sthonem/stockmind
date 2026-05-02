'use client'

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
import { portfolioApi } from '@/lib/api'

interface RiskHistoryChartProps {
  positionId: number
  ticker: string
  height?: number
}

type RiskHistoryRecord = {
  created_at?: string
  score?: number
  rsi?: number | null
}

type RiskHistoryResponse = {
  history?: RiskHistoryRecord[]
}

type ChartPoint = {
  date: string
  score: number
  rsi: number | null
}

type TooltipPayload = {
  value?: number
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
  const score = payload[0]?.value || 0
  const level = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'
  const levelColor = score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e'

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">Score: {score.toFixed(1)}</p>
      <p style={{ color: levelColor }} className="font-medium">{level}</p>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#eab308'
  return '#22c55e'
}

export function RiskHistoryChart({ positionId, ticker, height = 200 }: RiskHistoryChartProps) {
  const { data, isLoading } = useQuery<RiskHistoryResponse>({
    queryKey: ['risk-history', positionId],
    queryFn: () => portfolioApi.riskHistory(positionId).then((r) => r.data),
    enabled: !!positionId,
  })

  const chartData: ChartPoint[] = (data?.history || [])
    .slice()
    .reverse()
    .map((history) => ({
      date: history.created_at?.slice(0, 10) || '',
      score: Number(history.score?.toFixed(1) || 0),
      rsi: history.rsi ? Number(history.rsi.toFixed(1)) : null,
    }))

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!chartData.length) {
    return (
      <div className="text-center py-6 text-gray-600 text-xs">
        No risk history yet — scores are saved during daily sync
      </div>
    )
  }

  const latestScore = chartData[chartData.length - 1]?.score || 0
  const avgScore = chartData.reduce((sum, point) => sum + point.score, 0) / chartData.length
  const maxScore = Math.max(...chartData.map((point) => point.score))
  const scoreColor = getScoreColor(latestScore || 50)

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-400">{ticker} Risk Score History</span>
        <div className="flex gap-4 text-gray-500">
          <span>Latest: <span className="text-white font-medium">{latestScore.toFixed(1)}</span></span>
          <span>Avg: <span className="text-white font-medium">{avgScore.toFixed(1)}</span></span>
          <span>Peak: <span className="text-red-400 font-medium">{maxScore.toFixed(1)}</span></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={`riskGradient-${positionId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={scoreColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={scoreColor} stopOpacity={0.02} />
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
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={70}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: 'High', position: 'right', fill: '#ef4444', fontSize: 10 }}
          />
          <ReferenceLine
            y={40}
            stroke="#eab308"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: 'Med', position: 'right', fill: '#eab308', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={scoreColor}
            strokeWidth={2}
            fill={`url(#riskGradient-${positionId})`}
            name="Risk Score"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
