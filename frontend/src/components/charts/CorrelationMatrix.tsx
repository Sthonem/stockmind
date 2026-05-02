'use client'

import { useQuery } from '@tanstack/react-query'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { portfolioApi } from '@/lib/api'

type CorrelationPair = {
  ticker_1: string
  ticker_2: string
  correlation?: number
}

type CorrelationResponse = {
  matrix?: Record<string, Record<string, number>>
  tickers?: string[]
  error?: string
  warning?: string | null
  average_correlation?: number
  high_correlation_pairs?: CorrelationPair[]
}

export function CorrelationMatrix({ portfolioId }: { portfolioId: number }) {
  const { data, isLoading } = useQuery<CorrelationResponse>({
    queryKey: ['correlation', portfolioId],
    queryFn: () => portfolioApi.correlation(portfolioId).then((r) => r.data),
    enabled: !!portfolioId,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data?.matrix || data.error) {
    return (
      <div className="text-center py-4 text-gray-600 text-xs">
        {data?.error || 'Need at least 2 positions for correlation analysis'}
      </div>
    )
  }

  const tickers = data.tickers || []

  const getColor = (value: number) => {
    if (value === 1) return 'bg-gray-700 text-gray-500'
    if (value >= 0.8) return 'bg-red-500/30 text-red-300'
    if (value >= 0.5) return 'bg-yellow-500/20 text-yellow-300'
    if (value >= 0.2) return 'bg-blue-500/10 text-blue-300'
    if (value >= -0.2) return 'bg-gray-800 text-gray-400'
    return 'bg-green-500/10 text-green-300'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Correlation Matrix</span>
        {data.warning && (
          <span className="text-yellow-400 text-xs">{data.warning}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="w-16 pb-2" />
              {tickers.map((ticker) => (
                <th key={ticker} className="text-center pb-2 text-gray-500 font-medium px-1">
                  {ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((row) => (
              <tr key={row}>
                <td className="text-gray-500 font-medium pr-2 py-1">{row}</td>
                {tickers.map((col) => {
                  const value = data.matrix?.[row]?.[col] ?? 0
                  return (
                    <td key={col} className="py-1 px-1">
                      <div className={`text-center rounded px-1 py-1 font-mono ${getColor(value)}`}>
                        {value.toFixed(2)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.average_correlation !== undefined && (
        <p className="text-gray-600 text-xs text-right">
          Avg correlation: {data.average_correlation.toFixed(3)}
        </p>
      )}

      {data.high_correlation_pairs && data.high_correlation_pairs.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-yellow-400 text-xs font-medium mb-1">High Correlation Pairs</p>
          {data.high_correlation_pairs.map((pair) => (
            <p key={`${pair.ticker_1}-${pair.ticker_2}`} className="text-yellow-300 text-xs">
              {pair.ticker_1} ↔ {pair.ticker_2}: {pair.correlation?.toFixed(3)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
