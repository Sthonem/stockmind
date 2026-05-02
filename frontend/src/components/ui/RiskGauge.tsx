'use client'

interface RiskGaugeProps {
  score: number
  size?: number
}

export function RiskGauge({ score = 45, size = 120 }: RiskGaugeProps) {
  const r = size * 0.38
  const cx = size / 2
  const cy = size * 0.58
  const startAngle = -210
  const endAngle = 30
  const totalArc = endAngle - startAngle
  const scoreAngle = startAngle + (score / 100) * totalArc

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const arcPath = (start: number, end: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) }
    const e = { x: cx + radius * Math.cos(toRad(end)), y: cy + radius * Math.sin(toRad(end)) }
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const color = score >= 70 ? '#f43f5e' : score >= 40 ? '#f59e0b' : '#22c55e'
  const label = score >= 70 ? 'HIGH' : score >= 40 ? 'MED' : 'LOW'

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      <path d={arcPath(startAngle, endAngle, r)} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={arcPath(startAngle, scoreAngle, r)} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="Inter,sans-serif">{score}</text>
      <text x={cx} y={cy + size * 0.13} textAnchor="middle" fill="#8B96B0" fontSize={size * 0.1} fontWeight="600" letterSpacing="1" fontFamily="Inter,sans-serif">{label}</text>
    </svg>
  )
}
