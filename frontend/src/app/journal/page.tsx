'use client'

import { ThesisCard } from '@/components/journal/ThesisCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { usePortfolio, usePortfolioPerformance, usePortfolioRisk, usePortfolios } from '@/lib/hooks'
import type { PerformanceData, Portfolio, PortfolioRiskSummary, Position } from '@/lib/types'

interface EnrichedPosition extends Position {
  unrealized_pnl_pct?: number
  risk_score?: number
  risk_level?: string
}

export default function JournalPage() {
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id || null
  const { data: portfolioData, isLoading } = usePortfolio(portfolioId)
  const { data: performanceData } = usePortfolioPerformance(portfolioId)
  const { data: riskData } = usePortfolioRisk(portfolioId)

  const portfolio = portfolioData as Portfolio | undefined
  const performance = performanceData as PerformanceData | undefined
  const risk = riskData as PortfolioRiskSummary | undefined

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const positions = portfolio?.positions || []
  const performancePositions = performance?.positions || []
  const riskPositions = risk?.positions || []

  const enriched: EnrichedPosition[] = positions.map((position) => {
    const performancePosition = performancePositions.find((item) => item.ticker === position.ticker)
    const riskPosition = riskPositions.find((item) => item.ticker === position.ticker)
    return {
      ...position,
      unrealized_pnl_pct: performancePosition?.unrealized_pnl_pct,
      risk_score: riskPosition?.risk_score,
      risk_level: riskPosition?.risk_level,
    }
  })

  const withThesis = enriched.filter((position) => position.notes)
  const withoutThesis = enriched.filter((position) => !position.notes)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Investment Journal</h1>
        <p className="text-gray-500 text-sm mt-1">
          Record and review your investment theses for each position
        </p>
      </div>

      {positions.length === 0 ? (
        <EmptyState
          title="No positions to journal"
          description="Add positions to your portfolio to start tracking your investment theses"
          action={{ label: 'Go to Dashboard', onClick: () => { window.location.href = '/' } }}
        />
      ) : (
        <>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{withThesis.length} with thesis</span>
            <span>{withoutThesis.length} without thesis</span>
            <span>{positions.length} total positions</span>
          </div>

          {withThesis.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                With thesis ({withThesis.length})
              </h2>
              {withThesis.map((position) => (
                <ThesisCard
                  key={position.id}
                  positionId={position.id}
                  ticker={position.ticker}
                  avgBuyPrice={position.avg_buy_price}
                  currentNotes={position.notes}
                  unrealizedPnlPct={position.unrealized_pnl_pct}
                  riskScore={position.risk_score}
                  riskLevel={position.risk_level}
                />
              ))}
            </section>
          )}

          {withoutThesis.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-600" />
                Without thesis ({withoutThesis.length})
              </h2>
              {withoutThesis.map((position) => (
                <ThesisCard
                  key={position.id}
                  positionId={position.id}
                  ticker={position.ticker}
                  avgBuyPrice={position.avg_buy_price}
                  currentNotes={position.notes}
                  unrealizedPnlPct={position.unrealized_pnl_pct}
                  riskScore={position.risk_score}
                  riskLevel={position.risk_level}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
