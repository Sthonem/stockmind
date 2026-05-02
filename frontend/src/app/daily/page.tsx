'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { DailySummaryCard } from '@/components/daily/DailySummaryCard'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { agentApi } from '@/lib/api'
import { usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

interface DailySummary {
  date: string
  generated_at: string
  indices_data: string
  market_regime: string
  news_theme: string
  summary: string
  tokens_used: number
}

export default function DailyPage() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id

  const generateSummary = useMutation<DailySummary>({
    mutationFn: () =>
      agentApi.dailySummary(portfolioId).then((response) => response.data),
    onSuccess: setSummary,
  })

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Briefing</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI-generated market summary tailored to your portfolio
          </p>
        </div>
        <button
          onClick={() => generateSummary.mutate()}
          disabled={generateSummary.isPending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {generateSummary.isPending ? 'Generating...' : summary ? 'Refresh' : 'Generate Briefing'}
        </button>
      </div>

      {!summary && !generateSummary.isPending && (
        <Card>
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-500 text-sm font-semibold">DB</span>
            </div>
            <p className="text-gray-400 font-medium mb-2">Ready to generate your briefing</p>
            <p className="text-gray-600 text-sm mb-6">
              Get a personalized market summary based on current conditions
              and your portfolio positions.
            </p>
            <div className="text-left max-w-sm mx-auto space-y-2 text-xs text-gray-600 mb-6">
              <p>- Market index performance</p>
              <p>- Current market regime analysis</p>
              <p>- Key themes and catalysts</p>
              <p>- Upcoming events to watch</p>
              {portfolioId && <p>- Portfolio-specific insights</p>}
            </div>
            <button
              onClick={() => generateSummary.mutate()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Generate Now
            </button>
          </div>
        </Card>
      )}

      {generateSummary.isPending && (
        <Card>
          <div className="text-center py-10">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 text-sm mt-4">
              Analyzing market conditions...
            </p>
            <p className="text-gray-600 text-xs mt-1">
              This may take 10-20 seconds
            </p>
          </div>
        </Card>
      )}

      {summary && !generateSummary.isPending && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              {new Date(summary.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
          </div>
          <DailySummaryCard data={summary} />
        </Card>
      )}

      {generateSummary.isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">
            Failed to generate briefing. Check your GROQ_API_KEY configuration.
          </p>
        </div>
      )}
    </div>
  )
}
