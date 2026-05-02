interface MetricTileProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: string
}

export function MetricTile({ label, value, sub, color = '#F0F4FF', icon }: MetricTileProps) {
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
      <p style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#4A5568', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}
