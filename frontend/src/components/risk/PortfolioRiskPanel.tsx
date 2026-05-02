'use client'

import { usePortfolioRisk } from '@/lib/hooks'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const riskGroups = [
  {
    label: 'High Risk',
    key: 'high_risk_positions',
    box: 'bg-red-500/10 border-red-500/20',
    title: 'text-red-400',
    badge: 'text-red-300 bg-red-500/20',
  },
  {
    label: 'Medium Risk',
    key: 'medium_risk_positions',
    box: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'text-yellow-400',
    badge: 'text-yellow-300 bg-yellow-500/20',
  },
  {
    label: 'Low Risk',
    key: 'low_risk_positions',
    box: 'bg-green-500/10 border-green-500/20',
    title: 'text-green-400',
    badge: 'text-green-300 bg-green-500/20',
  },
] as const

export function PortfolioRiskPanel({ portfolioId }: { portfolioId: number }) {
  const { data: risk, isLoading } = usePortfolioRisk(portfolioId)

  if (isLoading) return <LoadingSpinner />
  if (!risk || risk.scored_positions === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        <p>No risk scores yet.</p>
        <p className="text-xs mt-1">Risk scores are calculated during daily sync.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <RiskGauge
          score={risk.portfolio_risk_score || 0}
          size="lg"
        />
        <div>
          <p className="text-white font-medium">{risk.portfolio_note}</p>
          <p className="text-gray-500 text-sm mt-1">
            {risk.scored_positions}/{risk.total_positions} positions scored
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {riskGroups.map(({ label, key, box, title, badge }) => {
          const tickers = risk[key] || []

          return (
            <div key={label} className={`${box} border rounded-lg p-3`}>
              <p className={`${title} text-xs font-medium mb-2`}>{label}</p>
              {tickers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tickers.map((ticker: string) => (
                    <span key={ticker} className={`${badge} text-xs px-1.5 py-0.5 rounded`}>
                      {ticker}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-xs">None</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
