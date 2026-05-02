'use client'

interface RiskGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function RiskGauge({ score, size = 'md', showLabel = true }: RiskGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score))

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#ef4444', text: 'text-red-400', label: 'HIGH' }
    if (s >= 40) return { stroke: '#eab308', text: 'text-yellow-400', label: 'MEDIUM' }
    return { stroke: '#22c55e', text: 'text-green-400', label: 'LOW' }
  }

  const color = getColor(clampedScore)
  const sizes = { sm: 80, md: 120, lg: 160 }
  const dim = sizes[size]
  const radius = (dim / 2) - 10
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clampedScore / 100) * circumference
  const fontSize = { sm: 16, md: 22, lg: 30 }
  const subSize = { sm: 8, md: 10, lg: 12 }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="8"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold ${color.text}`}
            style={{ fontSize: fontSize[size] }}
          >
            {Math.round(clampedScore)}
          </span>
          {showLabel && (
            <span
              className="text-gray-500 font-medium"
              style={{ fontSize: subSize[size] }}
            >
              {color.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
