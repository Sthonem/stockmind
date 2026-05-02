'use client'

export interface NewsArticle {
  title: string
  description?: string | null
  source: string
  url: string
  published_at: string
  sentiment_analysis?: {
    sentiment: string
    score: number
    confidence: number
    impact: string
    category: string
    reasoning: string
  } | null
  category?: {
    primary_category: string
    is_urgent: boolean
    confidence: number
  } | null
}

const SENTIMENT_CONFIG = {
  positive: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  negative: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  neutral: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-700' },
}

const CATEGORY_LABELS: Record<string, string> = {
  earnings: 'Earnings',
  macro: 'Macro',
  merger_acquisition: 'M&A',
  insider: 'Insider',
  analyst: 'Analyst',
  product: 'Product',
  legal_regulatory: 'Legal',
  sector: 'Sector',
  other: 'Other',
}

function timeAgo(dateStr: string) {
  const published = new Date(dateStr).getTime()
  if (Number.isNaN(published)) return 'Recently'

  const diff = Math.max(0, Date.now() - published)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

export function NewsCard({ article }: { article: NewsArticle }) {
  const sentiment = article.sentiment_analysis?.sentiment || 'neutral'
  const config = SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG] || SENTIMENT_CONFIG.neutral
  const category = article.category?.primary_category
  const isUrgent = article.category?.is_urgent

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block border rounded-lg p-3 transition-colors hover:border-gray-600 ${config.border} ${config.bg}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {isUrgent && (
            <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded font-medium">
              URGENT
            </span>
          )}
          {category && (
            <span className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded">
              {CATEGORY_LABELS[category] || category}
            </span>
          )}
          {article.sentiment_analysis && (
            <span className={`text-xs font-medium ${config.color}`}>
              {sentiment.toUpperCase()} ({article.sentiment_analysis.score > 0 ? '+' : ''}
              {article.sentiment_analysis.score?.toFixed(2)})
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs flex-shrink-0">
          {timeAgo(article.published_at)}
        </span>
      </div>

      <p className="text-white text-sm font-medium leading-snug mb-1 line-clamp-2">
        {article.title}
      </p>

      {article.description && (
        <p className="text-gray-500 text-xs line-clamp-1 mb-1.5">
          {article.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-600 text-xs flex-shrink-0">{article.source}</span>
        {article.sentiment_analysis?.reasoning && (
          <span className="text-gray-600 text-xs italic line-clamp-1 max-w-xs text-right">
            {article.sentiment_analysis.reasoning}
          </span>
        )}
      </div>
    </a>
  )
}
