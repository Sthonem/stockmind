'use client'

import { DecisionNote } from '@/components/decisions/DecisionNote'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { usePortfolio, usePortfolioPerformance, usePortfolioRisk, usePortfolios } from '@/lib/hooks'
import type { PerformanceData, Portfolio, PortfolioRiskSummary, Position } from '@/lib/types'

interface EnrichedPosition extends Position {
  unrealized_pnl_pct?: number
  unrealized_pnl_abs?: number
  current_price?: number
  risk_score?: number
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 32px', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    )
  }

  const positions = portfolio?.positions || []
  const performancePositions = performance?.positions || []
  const riskPositions = risk?.positions || []

  const enriched: EnrichedPosition[] = positions.map((pos) => {
    const perf = performancePositions.find((item) => item.ticker === pos.ticker)
    const riskPos = riskPositions.find((item) => item.ticker === pos.ticker)
    const pnlAbs = perf?.current_price && pos.shares
      ? (perf.current_price - pos.avg_buy_price) * pos.shares
      : undefined
    return {
      ...pos,
      unrealized_pnl_pct: perf?.unrealized_pnl_pct,
      unrealized_pnl_abs: pnlAbs,
      current_price: perf?.current_price,
      risk_score: riskPos?.risk_score,
    }
  })

  const profitable = enriched
    .filter((p) => p.unrealized_pnl_pct != null && p.unrealized_pnl_pct > 0)
    .sort((a, b) => (b.unrealized_pnl_pct || 0) - (a.unrealized_pnl_pct || 0))
  const losing = enriched
    .filter((p) => p.unrealized_pnl_pct != null && p.unrealized_pnl_pct < 0)
    .sort((a, b) => (a.unrealized_pnl_pct || 0) - (b.unrealized_pnl_pct || 0))
  const unknown = enriched.filter((p) => p.unrealized_pnl_pct == null)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>
          Decisions
        </h1>
        <p style={{ fontSize: 13, color: '#8B96B0' }}>
          Your positions and the thinking behind them
        </p>
      </div>

      {positions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 14, color: '#4A5568' }}>No positions yet.</p>
          <p style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>
            Add positions to your portfolio to start tracking decisions.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>
              ↑ {profitable.length} profitable
            </span>
            <span style={{ fontSize: 12, color: '#f43f5e', fontWeight: 500 }}>
              ↓ {losing.length} losing
            </span>
            <span style={{ fontSize: 12, color: '#4A5568' }}>
              {positions.length} total
            </span>
          </div>

          {profitable.map((pos) => (
            <DecisionNote
              key={pos.id}
              positionId={pos.id}
              ticker={pos.ticker}
              avgBuyPrice={pos.avg_buy_price}
              shares={pos.shares}
              currentPrice={pos.current_price}
              notes={pos.notes}
              currentPnlPct={pos.unrealized_pnl_pct}
              currentPnlAbs={pos.unrealized_pnl_abs}
              riskScore={pos.risk_score}
            />
          ))}

          {losing.length > 0 && profitable.length > 0 && (
            <div style={{ margin: '8px 0 16px', height: 1, background: 'rgba(255,255,255,0.07)' }} />
          )}

          {losing.map((pos) => (
            <DecisionNote
              key={pos.id}
              positionId={pos.id}
              ticker={pos.ticker}
              avgBuyPrice={pos.avg_buy_price}
              shares={pos.shares}
              currentPrice={pos.current_price}
              notes={pos.notes}
              currentPnlPct={pos.unrealized_pnl_pct}
              currentPnlAbs={pos.unrealized_pnl_abs}
              riskScore={pos.risk_score}
            />
          ))}

          {unknown.length > 0 && (profitable.length > 0 || losing.length > 0) && (
            <div style={{ margin: '8px 0 16px', height: 1, background: 'rgba(255,255,255,0.07)' }} />
          )}

          {unknown.map((pos) => (
            <DecisionNote
              key={pos.id}
              positionId={pos.id}
              ticker={pos.ticker}
              avgBuyPrice={pos.avg_buy_price}
              shares={pos.shares}
              notes={pos.notes}
              riskScore={pos.risk_score}
            />
          ))}
        </>
      )}
    </div>
  )
}
