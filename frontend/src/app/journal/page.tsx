'use client'

import { ThesisCard } from '@/components/journal/ThesisCard'
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
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 32px', display: 'flex', justifyContent: 'center' }}>
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
    return {
      ...pos,
      unrealized_pnl_pct: perf?.unrealized_pnl_pct,
      risk_score: riskPos?.risk_score,
      risk_level: riskPos?.risk_level,
    }
  })

  const withThesis = enriched.filter((p) => p.notes)
  const withoutThesis = enriched.filter((p) => !p.notes)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>
          Journal
        </h1>
        <p style={{ fontSize: 13, color: '#8B96B0' }}>
          Keep your thinking organized. What did you buy and why?
        </p>
      </div>

      {positions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 14, color: '#4A5568' }}>No positions to journal.</p>
          <p style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>
            Add positions to your portfolio to start tracking your investment theses.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 18, marginBottom: 22, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
              {withThesis.length} with thesis
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#4A5568' }}>{withoutThesis.length} without</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#4A5568' }}>{positions.length} total positions</span>
          </div>

          {withThesis.map((pos) => (
            <ThesisCard
              key={pos.id}
              positionId={pos.id}
              ticker={pos.ticker}
              avgBuyPrice={pos.avg_buy_price}
              shares={pos.shares}
              currentNotes={pos.notes}
              unrealizedPnlPct={pos.unrealized_pnl_pct}
              riskScore={pos.risk_score}
              riskLevel={pos.risk_level}
            />
          ))}

          {withoutThesis.length > 0 && (
            <>
              <div style={{ margin: '16px 0', height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <p style={{ fontSize: 11, color: '#4A5568', marginBottom: 12, fontStyle: 'italic' }}>
                These positions don&apos;t have a thesis yet. What were you thinking?
              </p>
              {withoutThesis.map((pos) => (
                <ThesisCard
                  key={pos.id}
                  positionId={pos.id}
                  ticker={pos.ticker}
                  avgBuyPrice={pos.avg_buy_price}
                  shares={pos.shares}
                  currentNotes={pos.notes}
                  unrealizedPnlPct={pos.unrealized_pnl_pct}
                  riskScore={pos.risk_score}
                  riskLevel={pos.risk_level}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
