'use client'

import { useQuery } from '@tanstack/react-query'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { newsApi } from '@/lib/api'
import { NewsCard, type NewsArticle } from './NewsCard'

interface CategorizedNewsResponse {
  total_articles: number
  urgent_count?: number
  dominant_category?: string | null
  articles: NewsArticle[]
}

export function NewsFeed({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<CategorizedNewsResponse>({
    queryKey: ['news-categorized', ticker],
    queryFn: () => newsApi.categorized(ticker).then((response) => response.data),
    enabled: !!ticker,
  })

  if (isLoading) return <LoadingSpinner size="sm" />
  if (!data?.articles?.length) {
    return (
      <div className="text-center py-6 text-gray-600 text-xs">
        No news articles found.
        <br />Add NEWS_API_KEY to .env to enable news feed.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 mb-3">
        <span>{data.total_articles} articles</span>
        {Boolean(data.urgent_count) && (
          <span className="text-red-400">{data.urgent_count} urgent</span>
        )}
        {data.dominant_category && (
          <span>
            Main theme: <span className="text-white">{data.dominant_category}</span>
          </span>
        )}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {data.articles.map((article) => (
          <NewsCard key={`${article.url}-${article.published_at}`} article={article} />
        ))}
      </div>
    </div>
  )
}
