'use client'

import { useState } from 'react'

import { InsiderPanel } from '@/components/insider/InsiderPanel'
import { InstitutionalPanel } from '@/components/insider/InstitutionalPanel'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePortfolio, usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

export default function InsiderPage() {
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id || null
  const { data: portfolioData } = usePortfolio(portfolioId)
  const portfolio = portfolioData as Portfolio | undefined
  const tickers = portfolio?.positions?.map((p) => p.ticker) || []
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const activeTicker = selectedTicker || tickers[0] || null

  const cardStyle = {
    background: '#0E1420',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '18px 20px',
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>
          Insider Activity
        </h1>
        <p style={{ fontSize: 13, color: '#8B96B0' }}>
          Track insider trades and institutional movements in your holdings
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
          {/* Ticker tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {tickers.map((ticker) => (
              <button
                key={ticker}
                onClick={() => setSelectedTicker(ticker)}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: activeTicker === ticker ? '#3b82f6' : '#141C2B',
                  color: activeTicker === ticker ? '#fff' : '#8B96B0',
                  border: `1px solid ${activeTicker === ticker ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {ticker}
              </button>
            ))}
          </div>

          {activeTicker && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
              <div style={cardStyle}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
                  Insider Activity (SEC Form 4)
                </p>
                <InsiderPanel ticker={activeTicker} />
              </div>
              <div style={cardStyle}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
                  Institutional Ownership
                </p>
                <InstitutionalPanel ticker={activeTicker} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
