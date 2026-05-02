'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

interface KellyResultData {
  full_kelly_pct?: number
  half_kelly_pct?: number
  recommended_pct?: number
  recommended_value?: number
  capped?: boolean
  risk_note?: string
  win_rate: number
  win_loss_ratio?: number
  risk_adjustment: number
  data_source?: string
  data_points?: number
}

interface KellyResultProps {
  data: KellyResultData
  portfolioValue: number
}

function KellyResult({ data, portfolioValue }: KellyResultProps) {
  const cappedColor = data.capped ? 'text-yellow-400' : 'text-blue-400'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Full Kelly</p>
          <p className="text-white font-semibold">{data.full_kelly_pct?.toFixed(1)}%</p>
          <p className="text-gray-600 text-xs">theoretical max</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Half Kelly</p>
          <p className="text-white font-semibold">{data.half_kelly_pct?.toFixed(1)}%</p>
          <p className="text-gray-600 text-xs">safer baseline</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Recommended</p>
          <p className={`font-bold text-lg ${cappedColor}`}>{data.recommended_pct?.toFixed(1)}%</p>
          <p className="text-gray-600 text-xs">{data.capped ? 'capped at max' : 'risk-adjusted'}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Dollar Amount</p>
          <p className="text-white font-semibold">${data.recommended_value?.toLocaleString()}</p>
          <p className="text-gray-600 text-xs">of ${portfolioValue?.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3 space-y-2">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Risk Adjustment</p>
        <p className="text-gray-300 text-sm">{data.risk_note}</p>
        <div className="flex gap-4 text-xs text-gray-500 pt-1 flex-wrap">
          <span>Win rate: <span className="text-white">{(data.win_rate * 100)?.toFixed(1)}%</span></span>
          <span>Win/loss ratio: <span className="text-white">{data.win_loss_ratio?.toFixed(2)}x</span></span>
          <span>Risk adjustment: <span className="text-white">{(data.risk_adjustment * 100)?.toFixed(0)}%</span></span>
        </div>
        {data.data_source && (
          <p className="text-gray-600 text-xs">
            Source: {data.data_source === 'historical'
              ? `${data.data_points} days of price history`
              : 'Conservative default assumptions'}
          </p>
        )}
      </div>
    </div>
  )
}

interface SizingQueryParams {
  ticker: string
  value: number
  risk: number
  max: number
}

export function KellyCalculator() {
  const [ticker, setTicker] = useState('')
  const [portfolioValue, setPortfolioValue] = useState('10000')
  const [riskScore, setRiskScore] = useState('50')
  const [maxPct, setMaxPct] = useState('25')
  const [submitted, setSubmitted] = useState(false)
  const [queryParams, setQueryParams] = useState<SizingQueryParams | null>(null)

  const { data, isLoading } = useQuery<KellyResultData>({
    queryKey: ['sizing', queryParams],
    queryFn: () => marketApi.sizing(
      queryParams!.ticker,
      queryParams!.value,
      queryParams!.risk,
      queryParams!.max
    ).then((response) => response.data),
    enabled: !!queryParams,
  })

  const handleCalculate = () => {
    if (!ticker.trim()) return
    setQueryParams({
      ticker: ticker.toUpperCase(),
      value: parseFloat(portfolioValue),
      risk: parseFloat(riskScore),
      max: parseFloat(maxPct) / 100,
    })
    setSubmitted(true)
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            placeholder="AAPL"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Portfolio Value ($)</label>
          <input
            type="number"
            value={portfolioValue}
            onChange={(event) => setPortfolioValue(event.target.value)}
            placeholder="10000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Risk Score (0-100)</label>
          <input
            type="number"
            value={riskScore}
            onChange={(event) => setRiskScore(event.target.value)}
            min="0"
            max="100"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Position (%)</label>
          <input
            type="number"
            value={maxPct}
            onChange={(event) => setMaxPct(event.target.value)}
            min="1"
            max="100"
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={!ticker.trim() || isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {isLoading ? 'Calculating...' : 'Calculate Position Size'}
      </button>

      {isLoading && <LoadingSpinner size="sm" />}

      {data && !isLoading && (
        <KellyResult data={data} portfolioValue={parseFloat(portfolioValue)} />
      )}

      {submitted && !isLoading && !data && (
        <p className="text-gray-500 text-sm text-center py-4">
          Could not fetch data - Yahoo Finance may be rate limiting. Using conservative defaults.
        </p>
      )}
    </div>
  )
}
