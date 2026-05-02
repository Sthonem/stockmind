interface BadgeProps {
  label: string
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'cyan' | 'gray'
}

const colorMap: Record<string, { bg: string; text: string }> = {
  green:  { bg: 'rgba(34,197,94,0.1)',    text: '#22c55e' },
  red:    { bg: 'rgba(244,63,94,0.1)',    text: '#f43f5e' },
  yellow: { bg: 'rgba(245,158,11,0.1)',   text: '#f59e0b' },
  blue:   { bg: 'rgba(59,130,246,0.1)',   text: '#3b82f6' },
  purple: { bg: 'rgba(167,139,250,0.1)',  text: '#a78bfa' },
  cyan:   { bg: 'rgba(6,182,212,0.1)',    text: '#06b6d4' },
  gray:   { bg: 'rgba(255,255,255,0.06)', text: '#8B96B0' },
}

export function Badge({ label, color = 'gray' }: BadgeProps) {
  const c = colorMap[color] || colorMap.gray
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 9px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      background: c.bg,
      color: c.text,
    }}>
      {label}
    </span>
  )
}
