'use client'

import { useState } from 'react'

import { InsiderPanel } from '@/components/insider/InsiderPanel'
import { InstitutionalPanel } from '@/components/insider/InstitutionalPanel'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePortfolio, usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

export default function InsiderPage() {
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id || null
  const { data: portfolioData } = usePortfolio(portfolioId)
  const portfolio = portfolioData as Portfolio | undefined
  const tickers = portfolio?.positions?.map((position) => position.ticker) || []
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const activeTicker = selectedTicker || tickers[0] || null

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Insider & Institutional</h1>
        <p className="text-gray-500 text-sm mt-1">
          SEC filings, institutional ownership, and short interest data
        </p>
      </div>

      {tickers.length === 0 ? (
        <EmptyState
          title="No positions to analyze"
          description="Add positions to your portfolio to see insider data"
          action={{ label: 'Go to Dashboard', onClick: () => { window.location.href = '/' } }}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {tickers.map((ticker) => (
              <button
                key={ticker}
                onClick={() => setSelectedTicker(ticker)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTicker === ticker
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {ticker}
              </button>
            ))}
          </div>

          {activeTicker && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Insider Activity (SEC Form 4)
                </h2>
                <InsiderPanel ticker={activeTicker} />
              </Card>
              <Card>
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Institutional Ownership
                </h2>
                <InstitutionalPanel ticker={activeTicker} />
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
