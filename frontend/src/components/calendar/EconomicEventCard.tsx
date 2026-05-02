'use client'

export interface EconomicEvent {
  title: string
  date: string
  impact: string
  country: string
  is_high_impact: boolean
  affected_sectors: string[]
  forecast?: string
  previous?: string
  days_until?: number
  note?: string
}

export function EconomicEventCard({ event }: { event: EconomicEvent }) {
  const impactConfig = {
    High: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    Low: { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
  }
  const config = impactConfig[event.impact as keyof typeof impactConfig] || impactConfig.Low

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className={`border rounded-xl p-4 ${config.border} ${config.bg}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${config.border} ${config.color}`}>
            {event.impact}
          </span>
          {event.days_until != null && event.days_until <= 3 && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30 font-medium">
              {event.days_until === 0 ? 'TODAY' : `${event.days_until}d`}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs flex-shrink-0">{formatDate(event.date)}</span>
      </div>

      <p className="text-white font-medium text-sm mb-2">{event.title}</p>

      {event.affected_sectors?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {event.affected_sectors.map((sector) => (
            <span key={sector} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded">
              {sector}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
        {event.forecast && event.forecast !== 'N/A' && (
          <span>Forecast: <span className="text-gray-300">{event.forecast}</span></span>
        )}
        {event.previous && event.previous !== 'N/A' && (
          <span>Previous: <span className="text-gray-300">{event.previous}</span></span>
        )}
      </div>

      {event.note && (
        <p className="text-gray-600 text-xs mt-2 italic">{event.note}</p>
      )}
    </div>
  )
}
