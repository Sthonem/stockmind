import { CSSProperties } from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export function Card({ children, className = '', style = {}, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#0E1420',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04)',
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  sub,
  color = 'white',
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'white' | 'green' | 'red' | 'yellow'
  icon?: string
}) {
  const colorMap: Record<string, string> = {
    white: '#F0F4FF',
    green: '#22c55e',
    red: '#f43f5e',
    yellow: '#f59e0b',
  }

  return (
    <div style={{
      background: '#141C2B',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 11, color: '#8B96B0', fontWeight: 500 }}>{label}</p>
        {icon && <span style={{ fontSize: 14, opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: colorMap[color] || '#F0F4FF', letterSpacing: -0.5 }}>{value}</p>
      {sub ? <p style={{ fontSize: 11, color: '#4A5568', marginTop: 3 }}>{sub}</p> : null}
    </div>
  )
}
