interface TrendChipProps {
  value: number
  suffix?: string
}

export function TrendChip({ value, suffix = '%' }: TrendChipProps) {
  const pos = value >= 0
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 12,
      fontWeight: 600,
      color: pos ? '#22c55e' : '#f43f5e',
      background: pos ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
      padding: '2px 8px',
      borderRadius: 99,
    }}>
      {pos ? '▲' : '▼'} {Math.abs(value).toFixed(2)}{suffix}
    </span>
  )
}
