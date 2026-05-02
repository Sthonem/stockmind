'use client'

import { KellyCalculator } from '@/components/sizing/KellyCalculator'
import { Card } from '@/components/ui/Card'

export default function SizingPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Position Sizing</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelly Criterion calculator - how much of your portfolio to allocate
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
          Kelly Criterion Calculator
        </h2>
        <KellyCalculator />
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          How it works
        </h2>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            The Kelly Criterion calculates the optimal fraction of your portfolio
            to allocate to a position based on historical win rate and win/loss ratio.
          </p>
          <div className="bg-gray-800 rounded-lg p-3 font-mono text-xs text-gray-300">
            Kelly % = Win Rate - (1 - Win Rate) / Win-Loss Ratio
          </div>
          <p>
            StockMind uses Half Kelly (50% of the theoretical max) as the baseline,
            then further reduces it based on your current risk score. High risk positions
            get a 40% reduction, medium risk 30%.
          </p>
          <p className="text-yellow-400 text-xs">
            This is a mathematical guideline, not financial advice.
            Always consider your full financial situation before making investment decisions.
          </p>
        </div>
      </Card>
    </div>
  )
}
