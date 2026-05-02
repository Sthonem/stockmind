'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface MiniChartProps {
  data: { value: number }[]
  color?: string
  height?: number
}

export function MiniChart({ data, color = '#3b82f6', height = 40 }: MiniChartProps) {
  if (!data?.length) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
