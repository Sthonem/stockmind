'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { Badge } from '@/components/ui/Badge'
import { TrendChip } from '@/components/ui/TrendChip'
import { Sparkline } from '@/components/charts/MiniChart'
import { Card } from '@/components/ui/Card'
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

const mockIndices = [
  { name: 'S&P 500', value: '5,842', chg: 1.12, spark: [5700, 5720, 5760, 5740, 5800, 5820, 5842] },
  { name: 'NASDAQ',  value: '18,620', chg: 1.84, spark: [18100, 18200, 18350, 18280, 18490, 18560, 18620] },
  { name: 'DOW',     value: '43,290', chg: 0.67, spark: [43000, 43050, 43100, 43080, 43200, 43250, 43290] },
  { name: 'VIX',     value: '14.2',   chg: -8.30, spark: [16.8, 16.2, 15.9, 15.5, 15.0, 14.6, 14.2] },
]

const mockEvents = [
  { time: '10:00', label: 'ISM Services PMI', impact: 'high', ticker: null },
  { time: '14:00', label: 'Powell speaks at Brookings', impact: 'high', ticker: null },
  { time: '16:30', label: 'AMZN Q1 Earnings', impact: 'high', ticker: 'AMZN' },
]

export default function DailyPage() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id

  const generateSummary = useMutation<DailySummary>({
    mutationFn: () => agentApi.dailySummary(portfolioId).then((res) => res.data),
    onSuccess: setSummary,
  })

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  if (generateSummary.isPending) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5 }}>Daily Briefing</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[240, 160, 200].map((h, i) => (
            <div key={i} className="shimmer" style={{ height: h, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>Daily Briefing</h1>
          <p style={{ fontSize: 13, color: '#8B96B0' }}>Your personalized market summary, generated each morning</p>
        </div>
        <div style={{
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '52px 40px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>☕</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#F0F4FF', marginBottom: 8 }}>No briefing yet for today</p>
          <p style={{ fontSize: 13, color: '#8B96B0', maxWidth: 340, margin: '0 auto 28px', lineHeight: 1.7 }}>
            StockMind will analyze market conditions and your portfolio to give you a focused morning read.
          </p>
          <button
            onClick={() => generateSummary.mutate()}
            style={{
              padding: '11px 32px', borderRadius: 10, background: '#3b82f6',
              color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            Generate today&apos;s briefing
          </button>
        </div>

        {generateSummary.isError && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <p style={{ fontSize: 13, color: '#f43f5e' }}>Failed to generate briefing. Check your GROQ_API_KEY configuration.</p>
          </div>
        )}
      </div>
    )
  }

  // Parse summary content
  const lines = summary.summary.split('\n').filter(Boolean)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#4A5568', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{today}</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F0F4FF', letterSpacing: -0.8, lineHeight: 1.15 }}>
            {summary.news_theme || 'Market Update'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge label={summary.market_regime?.includes('bull') || summary.market_regime?.includes('risk-on') ? 'Risk-On' : 'Market Update'} color="green" />
          <button
            onClick={() => { setSummary(null); generateSummary.mutate() }}
            style={{
              height: 34, padding: '0 14px', borderRadius: 8,
              background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
              color: '#8B96B0', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Index strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {mockIndices.map((idx) => (
          <div key={idx.name} style={{
            background: '#0E1420', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <div>
              <p style={{ fontSize: 10, color: '#4A5568', marginBottom: 4 }}>{idx.name}</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5 }}>{idx.value}</p>
              <TrendChip value={idx.chg} />
            </div>
            <Sparkline data={idx.spark} color={idx.chg >= 0 ? '#22c55e' : '#f43f5e'} width={56} height={32} />
          </div>
        ))}
      </div>

      {/* Summary content */}
      {lines.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {lines.slice(0, 3).map((line, i) => (
            <div key={i} style={{
              background: '#0E1420', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '18px 20px',
              display: 'grid', gridTemplateColumns: '3px 1fr', gap: 16, alignItems: 'start',
              marginBottom: 8,
            }}>
              <div style={{ width: 3, borderRadius: 99, background: i === 0 ? '#06b6d4' : i === 1 ? '#3b82f6' : '#22c55e', alignSelf: 'stretch', minHeight: 40 }} />
              <div>
                <p style={{ fontSize: 13, color: '#8B96B0', lineHeight: 1.75 }}>{line}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Market regime callout */}
      {summary.market_regime && (
        <div style={{
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.18)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'grid', gridTemplateColumns: '3px 1fr', gap: 16,
        }}>
          <div style={{ width: 3, borderRadius: 99, background: '#22c55e' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Market Regime</p>
            <p style={{ fontSize: 13, color: '#8B96B0', lineHeight: 1.75 }}>{summary.market_regime}</p>
          </div>
        </div>
      )}

      {/* Events */}
      <Card style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#4A5568', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>On the calendar today</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {mockEvents.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 0',
              borderBottom: i < mockEvents.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#4A5568', minWidth: 42, fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
              <span style={{ fontSize: 13, color: '#F0F4FF', flex: 1 }}>
                {e.label}
                {e.ticker && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#8B96B0', background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)', padding: '1px 7px', borderRadius: 5 }}>
                    {e.ticker}
                  </span>
                )}
              </span>
              <Badge label={e.impact} color={e.impact === 'high' ? 'red' : 'yellow'} />
            </div>
          ))}
        </div>
      </Card>

      <p style={{ textAlign: 'right', fontSize: 10, color: '#4A5568', marginTop: 12 }}>
        Generated {new Date(summary.generated_at).toLocaleTimeString()} · {summary.tokens_used} tokens
      </p>
    </div>
  )
}
