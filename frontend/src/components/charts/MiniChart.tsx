'use client'

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({ data, color = '#22c55e', width = 80, height = 28 }: SparklineProps) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  const pathD = `M ${pts.join(' L ')}`
  const fillPts = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`
  const gradId = `sg-${color.replace('#', '')}-${width}-${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPts} fill={`url(#${gradId})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Legacy MiniChart wrapper for backward compat
interface MiniChartProps {
  data: { value: number }[]
  color?: string
  height?: number
}

export function MiniChart({ data, color = '#3b82f6', height = 40 }: MiniChartProps) {
  if (!data?.length) return null
  const values = data.map((d) => d.value)
  return <Sparkline data={values} color={color} width={80} height={height} />
}
