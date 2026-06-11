'use client'

import Link from 'next/link'

import { CorrelationMatrix } from '@/components/charts/CorrelationMatrix'
import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart'
import { SectorChart } from '@/components/charts/SectorChart'
import { PortfolioRiskPanel } from '@/components/risk/PortfolioRiskPanel'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

const sectionTitle = {
  fontSize: 10,
  fontWeight: 700,
  color: '#4A5568',
  letterSpacing: 1.2,
  textTransform: 'uppercase' as const,
  marginBottom: 16,
}

export default function PortfolioPage({
  params,
}: {
  params: { id: string }
}) {
  const portfolioId = parseInt(params.id, 10)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5 }}>
          Portfolio Analysis
        </h1>
        <Link href="/" style={{ fontSize: 13, color: '#8B96B0', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        <Card>
          <p style={sectionTitle}>Performance</p>
          <ErrorBoundary>
            <PortfolioValueChart portfolioId={portfolioId} />
          </ErrorBoundary>
        </Card>

        <Card>
          <p style={sectionTitle}>Risk Overview</p>
          <ErrorBoundary>
            <PortfolioRiskPanel portfolioId={portfolioId} />
          </ErrorBoundary>
        </Card>

        <Card>
          <p style={sectionTitle}>Sector Distribution</p>
          <ErrorBoundary>
            <SectorChart portfolioId={portfolioId} height={260} />
          </ErrorBoundary>
        </Card>

        <Card>
          <p style={sectionTitle}>Correlation</p>
          <ErrorBoundary>
            <CorrelationMatrix portfolioId={portfolioId} />
          </ErrorBoundary>
        </Card>
      </div>
    </div>
  )
}
