'use client'

import { DecisionNote } from '@/components/decisions/DecisionNote'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { usePortfolio, usePortfolioPerformance, usePortfolioRisk, usePortfolios } from '@/lib/hooks'
import type { PerformanceData, Portfolio, PortfolioRiskSummary, Position } from '@/lib/types'

interface EnrichedPosition extends Position {
  unrealized_pnl_pct?: number
  current_price?: number
  risk_score?: number
}

function PositionSection({
  title,
  count,
  color,
  positions,
}: {
  title: string
  count: number
  color: 'green' | 'red' | 'gray'
  positions: EnrichedPosition[]
}) {
  const colorMap = {
    green: {
      text: 'text-green-400',
      dot: 'bg-green-400',
    },
    red: {
      text: 'text-red-400',
      dot: 'bg-red-400',
    },
    gray: {
      text: 'text-gray-500',
      dot: 'bg-gray-500',
    },
  }
  const styles = colorMap[color]

  return (
    <section>
      <h2 className={`text-sm font-medium ${styles.text} uppercase tracking-wider mb-3 flex items-center gap-2`}>
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {title} ({count})
      </h2>
      <div className="space-y-3">
        {positions.map((position) => (
          <DecisionNote
            key={position.id}
            positionId={position.id}
            ticker={position.ticker}
            avgBuyPrice={position.avg_buy_price}
            notes={position.notes}
            currentPnlPct={position.unrealized_pnl_pct}
            riskScore={position.risk_score}
          />
        ))}
      </div>
    </section>
  )
}

export default function DecisionsPage() {
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id || null

  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolio(portfolioId)
  const { data: performanceData, isLoading: performanceLoading } = usePortfolioPerformance(portfolioId)
  const { data: riskData } = usePortfolioRisk(portfolioId)

  const portfolio = portfolioData as Portfolio | undefined
  const performance = performanceData as PerformanceData | undefined
  const risk = riskData as PortfolioRiskSummary | undefined
  const isLoading = portfolioLoading || performanceLoading

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

  const enrichedPositions: EnrichedPosition[] = positions.map((position) => {
    const performancePosition = performancePositions.find((item) => item.ticker === position.ticker)
    const riskPosition = riskPositions.find((item) => item.ticker === position.ticker)
    return {
      ...position,
      unrealized_pnl_pct: performancePosition?.unrealized_pnl_pct,
      current_price: performancePosition?.current_price,
      risk_score: riskPosition?.risk_score,
    }
  })

  const profitable = enrichedPositions
    .filter((position) => position.unrealized_pnl_pct != null && position.unrealized_pnl_pct > 0)
    .sort((a, b) => (b.unrealized_pnl_pct || 0) - (a.unrealized_pnl_pct || 0))
  const losing = enrichedPositions
    .filter((position) => position.unrealized_pnl_pct != null && position.unrealized_pnl_pct < 0)
    .sort((a, b) => (a.unrealized_pnl_pct || 0) - (b.unrealized_pnl_pct || 0))
  const unknown = enrichedPositions.filter((position) => position.unrealized_pnl_pct == null)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Decision History</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your investment theses and see how each position is performing
        </p>
      </div>

      {positions.length === 0 ? (
        <EmptyState
          title="No positions yet"
          description="Add positions to start tracking your decisions"
          action={{ label: 'Go to Dashboard', onClick: () => { window.location.href = '/' } }}
        />
      ) : (
        <>
          {profitable.length > 0 && (
            <PositionSection
              title="Profitable"
              count={profitable.length}
              color="green"
              positions={profitable}
            />
          )}

          {losing.length > 0 && (
            <PositionSection
              title="Losing"
              count={losing.length}
              color="red"
              positions={losing}
            />
          )}

          {unknown.length > 0 && (
            <PositionSection
              title="Price unavailable"
              count={unknown.length}
              color="gray"
              positions={unknown}
            />
          )}

          <div className="pt-4 border-t border-gray-800">
            <p className="text-gray-600 text-xs text-center">
              Click any position to expand and view your investment thesis. Add notes when creating positions to track your reasoning.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
