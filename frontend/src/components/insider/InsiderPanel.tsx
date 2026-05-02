'use client'

import { useQuery } from '@tanstack/react-query'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

interface InsiderFiling {
  filing_date: string
  document?: string
}

interface InsiderResponse {
  error?: string
  total_form4_filings?: number
  days_back?: number
  recent_filings?: InsiderFiling[]
  interpretation?: {
    activity_level?: string
    filings_per_month?: number
    note?: string
  }
}

export function InsiderPanel({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<InsiderResponse>({
    queryKey: ['insider', ticker],
    queryFn: () => marketApi.insider(ticker).then((response) => response.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data || data.error) {
    return (
      <div className="text-center py-4 text-gray-600 text-xs">
        {data?.error || 'Insider data unavailable'}
      </div>
    )
  }

  const interpretation = data.interpretation
  const activityColor =
    interpretation?.activity_level === 'very_active' ? 'text-red-400' :
      interpretation?.activity_level === 'active' ? 'text-yellow-400' :
        interpretation?.activity_level === 'normal' ? 'text-blue-400' : 'text-gray-400'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Form 4 Filings</p>
          <p className="text-white font-semibold text-lg">{data.total_form4_filings ?? 0}</p>
          <p className="text-gray-600 text-xs">last {data.days_back ?? 90} days</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Activity Level</p>
          <p className={`font-semibold text-sm ${activityColor}`}>
            {interpretation?.activity_level?.replace('_', ' ').toUpperCase() || 'N/A'}
          </p>
          <p className="text-gray-600 text-xs">
            {interpretation?.filings_per_month?.toFixed(1) ?? '0.0'} filings/month
          </p>
        </div>
      </div>

      {interpretation?.note && (
        <p className="text-gray-500 text-xs bg-gray-800 rounded-lg p-3">
          {interpretation.note}
        </p>
      )}

      {data.recent_filings && data.recent_filings.length > 0 && (
        <div>
          <p className="text-gray-600 text-xs uppercase tracking-wider mb-2">Recent Filings</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.recent_filings.map((filing, index) => (
              <div
                key={`${filing.filing_date}-${filing.document || index}`}
                className="flex items-center justify-between gap-3 bg-gray-800 rounded-lg px-3 py-2 text-xs"
              >
                <span className="text-gray-400">{filing.filing_date}</span>
                <span className="text-gray-300">Form 4</span>
                <span className="text-gray-600 truncate max-w-24">{filing.document}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
