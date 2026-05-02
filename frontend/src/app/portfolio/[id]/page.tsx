'use client'

import Link from 'next/link'

import { CorrelationMatrix } from '@/components/charts/CorrelationMatrix'
import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart'
import { SectorChart } from '@/components/charts/SectorChart'
import { PortfolioRiskPanel } from '@/components/risk/PortfolioRiskPanel'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function PortfolioPage({
  params,
}: {
  params: { id: string }
}) {
  const portfolioId = parseInt(params.id, 10)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Portfolio Analysis</h1>
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Performance
          </h2>
          <ErrorBoundary>
            <PortfolioValueChart portfolioId={portfolioId} />
          </ErrorBoundary>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Risk Overview
          </h2>
          <ErrorBoundary>
            <PortfolioRiskPanel portfolioId={portfolioId} />
          </ErrorBoundary>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Sector Distribution
          </h2>
          <ErrorBoundary>
            <SectorChart portfolioId={portfolioId} height={260} />
          </ErrorBoundary>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Correlation
          </h2>
          <ErrorBoundary>
            <CorrelationMatrix portfolioId={portfolioId} />
          </ErrorBoundary>
        </Card>
      </div>
    </div>
  )
}
