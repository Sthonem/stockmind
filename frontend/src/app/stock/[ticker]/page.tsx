'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { BacktestChart } from '@/components/charts/BacktestChart'
import { IndicatorPanel } from '@/components/charts/IndicatorPanel'
import { PriceChart } from '@/components/charts/PriceChart'
import { RiskHistoryChart } from '@/components/charts/RiskHistoryChart'
import { NewsFeed } from '@/components/news/NewsFeed'
import { SentimentSummary } from '@/components/news/SentimentSummary'
import { RiskScoreCard } from '@/components/risk/RiskScoreCard'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { TrendChip } from '@/components/ui/TrendChip'
import { marketApi } from '@/lib/api'
import { usePortfolio, usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

const sectionTitle = {
  fontSize: 10,
  fontWeight: 700,
  color: '#4A5568',
  letterSpacing: 1.2,
  textTransform: 'uppercase' as const,
  marginBottom: 16,
}

interface StockInfo {
  name?: string
  sector?: string
  current_price?: number
  previous_close?: number
}

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

  const { data: info } = useQuery<StockInfo>({
    queryKey: ['stock-info', upperTicker],
    queryFn: () => marketApi.info(upperTicker).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const price = info?.current_price
  const prevClose = info?.previous_close
  const changePct = price && prevClose ? ((price - prevClose) / prevClose) * 100 : null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: 'linear-gradient(135deg, #141C2B, #1A2333)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: upperTicker.length > 3 ? 10 : 12, fontWeight: 800, color: '#8B96B0', flexShrink: 0,
        }}>{upperTicker}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5 }}>{upperTicker}</h1>
            {price != null && (
              <span style={{ fontSize: 20, fontWeight: 700, color: '#F0F4FF', letterSpacing: -0.5 }}>
                ${price.toFixed(2)}
              </span>
            )}
            {changePct != null && <TrendChip value={changePct} />}
          </div>
          <p style={{ fontSize: 12, color: '#8B96B0' }}>
            {[info?.name, info?.sector].filter(Boolean).join(' · ') || 'Loading company info…'}
          </p>
        </div>
        <Link href="/" style={{ fontSize: 13, color: '#8B96B0', textDecoration: 'none', flexShrink: 0 }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <ErrorBoundary>
            <PriceChart ticker={upperTicker} period="6mo" height={320} />
          </ErrorBoundary>
        </Card>

        <Card>
          <p style={sectionTitle}>Risk Analysis</p>
          <ErrorBoundary>
            <RiskScoreCard ticker={upperTicker} />
          </ErrorBoundary>
        </Card>
      </div>

      <Card>
        <p style={sectionTitle}>Technical Indicators</p>
        <ErrorBoundary>
          <IndicatorPanel ticker={upperTicker} />
        </ErrorBoundary>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <p style={sectionTitle}>News Feed</p>
          <ErrorBoundary>
            <NewsFeed ticker={upperTicker} />
          </ErrorBoundary>
        </Card>
        <Card>
          <p style={sectionTitle}>Sentiment</p>
          <ErrorBoundary>
            <SentimentSummary ticker={upperTicker} />
          </ErrorBoundary>
        </Card>
      </div>

      {position && (
        <Card>
          <p style={sectionTitle}>Risk Score History</p>
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
        <p style={sectionTitle}>Strategy Backtest</p>
        <ErrorBoundary>
          <BacktestChart ticker={upperTicker} height={240} />
        </ErrorBoundary>
      </Card>
    </div>
  )
}
