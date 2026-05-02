'use client'

import Link from 'next/link'

import { BacktestChart } from '@/components/charts/BacktestChart'
import { IndicatorPanel } from '@/components/charts/IndicatorPanel'
import { PriceChart } from '@/components/charts/PriceChart'
import { RiskHistoryChart } from '@/components/charts/RiskHistoryChart'
import { NewsFeed } from '@/components/news/NewsFeed'
import { SentimentSummary } from '@/components/news/SentimentSummary'
import { RiskScoreCard } from '@/components/risk/RiskScoreCard'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { usePortfolio, usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

export default function StockPage({
  params,
}: {
  params: { ticker: string }
}) {
  const upperTicker = params.ticker.toUpperCase()
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id
  const { data: portfolioData } = usePortfolio(portfolioId || null)
  const portfolio = portfolioData as Portfolio | undefined
  const position = portfolio?.positions?.find(
    (portfolioPosition) => portfolioPosition.ticker === upperTicker
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{upperTicker}</h1>
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <ErrorBoundary>
              <PriceChart ticker={upperTicker} period="6mo" height={320} />
            </ErrorBoundary>
          </Card>
        </div>

        <div>
          <Card>
            <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
              Risk Analysis
            </h2>
            <ErrorBoundary>
              <RiskScoreCard ticker={upperTicker} />
            </ErrorBoundary>
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
          Technical Indicators
        </h2>
        <ErrorBoundary>
          <IndicatorPanel ticker={upperTicker} />
        </ErrorBoundary>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
              News Feed
            </h2>
            <ErrorBoundary>
              <NewsFeed ticker={upperTicker} />
            </ErrorBoundary>
          </Card>
        </div>
        <div>
          <Card>
            <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
              Sentiment
            </h2>
            <ErrorBoundary>
              <SentimentSummary ticker={upperTicker} />
            </ErrorBoundary>
          </Card>
        </div>
      </div>

      {position && (
        <Card>
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Risk Score History
          </h2>
          <ErrorBoundary>
            <RiskHistoryChart
              positionId={position.id}
              ticker={upperTicker}
              height={200}
            />
          </ErrorBoundary>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
          Strategy Backtest
        </h2>
        <ErrorBoundary>
          <BacktestChart ticker={upperTicker} height={240} />
        </ErrorBoundary>
      </Card>
    </div>
  )
}
