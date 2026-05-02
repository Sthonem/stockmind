'use client'

import { useTickerRisk } from '@/lib/hooks'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface IndicatorRowProps {
  label: string
  signal: string
  direction: string
  strength: number
}

function IndicatorRow({ label, signal, direction, strength }: IndicatorRowProps) {
  const dirColor =
    direction === 'bullish' ? 'text-green-400' :
    direction === 'bearish' ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm w-24">{label}</span>
      <span className="text-gray-300 text-sm flex-1 text-center">{signal}</span>
      <div className="flex items-center gap-2 w-28 justify-end">
        <span className={`text-xs font-medium ${dirColor}`}>
          {direction.toUpperCase()}
        </span>
        <div className="w-16 bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              direction === 'bullish' ? 'bg-green-500' :
              direction === 'bearish' ? 'bg-red-500' : 'bg-gray-500'
            }`}
            style={{ width: `${Math.round(strength * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function RiskScoreCard({ ticker }: { ticker: string }) {
  const { data: risk, isLoading, error } = useTickerRisk(ticker)

  if (isLoading) return <LoadingSpinner />
  if (error || !risk) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Risk data unavailable — Yahoo Finance may be rate limiting
      </div>
    )
  }

  const indicators = risk.indicators

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <RiskGauge score={risk.risk?.score || 0} size="md" />
        <div className="flex-1">
          <p className="text-white font-semibold text-lg">{ticker}</p>
          <p className="text-gray-400 text-sm">${risk.latest_price?.toFixed(2)}</p>
          <p className="text-gray-500 text-xs mt-1">{risk.risk?.recommendation}</p>
        </div>
      </div>

      {indicators && (
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
            Technical Signals
          </p>
          <IndicatorRow
            label="RSI"
            signal={`${indicators.rsi?.value?.toFixed(1) || 'N/A'} (${indicators.rsi?.signal || 'none'})`}
            direction={indicators.rsi?.direction || 'neutral'}
            strength={indicators.rsi?.strength || 0}
          />
          <IndicatorRow
            label="MACD"
            signal={indicators.macd?.signal || 'none'}
            direction={indicators.macd?.direction || 'neutral'}
            strength={indicators.macd?.strength || 0}
          />
          <IndicatorRow
            label="Bollinger"
            signal={indicators.bollinger_bands?.signal || 'none'}
            direction={indicators.bollinger_bands?.direction || 'neutral'}
            strength={indicators.bollinger_bands?.strength || 0}
          />
          <IndicatorRow
            label="EMA"
            signal={indicators.ema?.signal || 'none'}
            direction={indicators.ema?.direction || 'neutral'}
            strength={indicators.ema?.strength || 0}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
        <span>
          Overall:{' '}
          <span className={
            risk.overall_signal === 'bullish' ? 'text-green-400' :
            risk.overall_signal === 'bearish' ? 'text-red-400' : 'text-gray-400'
          }>
            {risk.overall_signal?.toUpperCase()}
          </span>
        </span>
        <span>Composite: {risk.composite_score?.toFixed(3)}</span>
      </div>
    </div>
  )
}
