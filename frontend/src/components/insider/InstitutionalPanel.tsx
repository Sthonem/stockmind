'use client'

import { useQuery } from '@tanstack/react-query'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

interface InstitutionalResponse {
  error?: string
  institutional_ownership_pct?: number | null
  insider_ownership_pct?: number | null
  institutional_sentiment?: string
  short_pct_float?: number | null
  short_interest_signal?: string
  short_ratio?: number | null
  note?: string
}

export function InstitutionalPanel({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<InstitutionalResponse>({
    queryKey: ['institutional', ticker],
    queryFn: () => marketApi.institutional(ticker).then((response) => response.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data || data.error) {
    return (
      <div className="text-center py-4 text-gray-600 text-xs">
        Institutional data unavailable
      </div>
    )
  }

  const sentimentColor =
    data.institutional_sentiment === 'heavily_institutional' ? 'text-purple-400' :
      data.institutional_sentiment === 'institutional_favored' ? 'text-blue-400' :
        data.institutional_sentiment === 'mixed_ownership' ? 'text-yellow-400' : 'text-gray-400'

  const shortColor =
    data.short_interest_signal === 'heavily_shorted' ? 'text-red-400' :
      data.short_interest_signal === 'moderately_shorted' ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Institutional Ownership</p>
          <p className="text-white font-semibold text-lg">
            {data.institutional_ownership_pct != null
              ? `${data.institutional_ownership_pct?.toFixed(1)}%`
              : 'N/A'}
          </p>
          <p className={`text-xs font-medium ${sentimentColor}`}>
            {data.institutional_sentiment?.replace('_', ' ') || 'unknown'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Insider Ownership</p>
          <p className="text-white font-semibold text-lg">
            {data.insider_ownership_pct != null
              ? `${data.insider_ownership_pct?.toFixed(1)}%`
              : 'N/A'}
          </p>
          <p className="text-gray-600 text-xs">Management stake</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Short Interest</p>
          <p className="text-white font-semibold text-lg">
            {data.short_pct_float != null
              ? `${data.short_pct_float?.toFixed(1)}%`
              : 'N/A'}
          </p>
          <p className={`text-xs font-medium ${shortColor}`}>
            {data.short_interest_signal?.replace('_', ' ') || 'unknown'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Short Ratio</p>
          <p className="text-white font-semibold text-lg">
            {data.short_ratio != null ? `${data.short_ratio?.toFixed(1)}` : 'N/A'}
          </p>
          <p className="text-gray-600 text-xs">Days to cover</p>
        </div>
      </div>

      {data.note && (
        <p className="text-gray-500 text-xs bg-gray-800 rounded-lg p-3">
          {data.note}
        </p>
      )}
    </div>
  )
}
