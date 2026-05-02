'use client'

import { useQuery } from '@tanstack/react-query'

import { newsApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface SentimentResponse {
  article_count: number
  analyzed_count: number
  overall_score: number
  positive_count: number
  neutral_count: number
  negative_count: number
}

export function SentimentSummary({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<SentimentResponse>({
    queryKey: ['sentiment', ticker],
    queryFn: () => newsApi.sentiment(ticker).then((response) => response.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data || data.article_count === 0) {
    return (
      <div className="text-gray-600 text-xs text-center py-3">
        No news available - add NEWS_API_KEY to enable
      </div>
    )
  }

  const scoreColor =
    data.overall_score > 0.15 ? 'text-green-400' :
      data.overall_score < -0.15 ? 'text-red-400' : 'text-gray-400'

  const barWidth = Math.abs(data.overall_score) * 100
  const barColor = data.overall_score > 0 ? 'bg-green-500' : 'bg-red-500'
  const barOffset = data.overall_score > 0
    ? '50%'
    : `${50 - Math.min(barWidth, 50)}%`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">News Sentiment</span>
        <span className={`text-sm font-semibold ${scoreColor}`}>
          {data.overall_score > 0 ? '+' : ''}{data.overall_score?.toFixed(3)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-xs w-16 text-right">Negative</span>
        <div className="flex-1 bg-gray-800 rounded-full h-2 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full bg-gray-600" />
          </div>
          <div
            className={`h-2 rounded-full ${barColor}`}
            style={{
              width: `${Math.min(barWidth, 50)}%`,
              marginLeft: barOffset,
            }}
          />
        </div>
        <span className="text-gray-600 text-xs w-16">Positive</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-green-400 font-semibold">{data.positive_count}</p>
          <p className="text-gray-600">Positive</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 font-semibold">{data.neutral_count}</p>
          <p className="text-gray-600">Neutral</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-semibold">{data.negative_count}</p>
          <p className="text-gray-600">Negative</p>
        </div>
      </div>

      <p className="text-gray-600 text-xs text-center">
        Based on {data.analyzed_count} of {data.article_count} articles
      </p>
    </div>
  )
}
