'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { portfolioApi } from '@/lib/api'

const SECTOR_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a78bfa',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#6b7280',
]

type SectorDistribution = Record<string, number>

type DiversificationResponse = {
  sector_distribution?: SectorDistribution
  diversification?: {
    overall_score?: number
    level?: string
    note?: string
    dominant_sector?: string
  }
  num_sectors?: number
  num_positions?: number
}

type PieEntry = {
  name: string
  value: number
}

type TooltipPayload = {
  name: string
  value?: number
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-medium">{name}</p>
      <p className="text-gray-400">{value?.toFixed(1)}% of portfolio</p>
    </div>
  )
}

function CustomLegend({
  payload,
}: {
  payload?: { value: string; color: string }[]
}) {
  if (!payload) return null

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function SectorChart({
  portfolioId,
  height = 280,
}: {
  portfolioId: number
  height?: number
}) {
  const { data, isLoading } = useQuery<DiversificationResponse>({
    queryKey: ['diversification', portfolioId],
    queryFn: () => portfolioApi.diversification(portfolioId).then((r) => r.data),
    enabled: !!portfolioId,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data?.sector_distribution) {
    return (
      <div className="text-center py-6 text-gray-600 text-xs">
        Sector data unavailable
      </div>
    )
  }

  const pieData: PieEntry[] = Object.entries(data.sector_distribution)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)

  const divScore = data.diversification?.overall_score || 0
  const divLevel = data.diversification?.level || 'unknown'
  const divNote = data.diversification?.note || ''

  const levelColor =
    divLevel === 'well_diversified' ? 'text-green-400' :
    divLevel === 'moderately_diversified' ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Sector Distribution</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Diversification:</span>
          <span className={`font-medium ${levelColor}`}>
            {divScore.toFixed(0)}/100
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="45%"
            innerRadius="45%"
            outerRadius="70%"
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      <p className="text-gray-600 text-xs text-center">{divNote}</p>

      {data.diversification?.dominant_sector && (
        <div className="flex justify-between text-xs text-gray-500 border-t border-gray-800 pt-2">
          <span>
            Dominant sector:
            <span className="text-white ml-1">{data.diversification.dominant_sector}</span>
          </span>
          <span>
            {data.num_sectors} sector{data.num_sectors !== 1 ? 's' : ''},{' '}
            {data.num_positions} position{data.num_positions !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
