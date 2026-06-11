'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/Badge'
import { TrendChip } from '@/components/ui/TrendChip'
import { Sparkline } from '@/components/charts/MiniChart'
import { Card } from '@/components/ui/Card'
import { agentApi, marketApi } from '@/lib/api'
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

interface MarketIndex {
  symbol: string
  name: string
  value: number
  change_pct: number
  sparkline: number[]
}

interface CalendarEvent {
  title: string
  date: string
  impact: string
}

function formatIndexValue(name: string, value: number): string {
  if (name === 'VIX') return value.toFixed(1)
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function IndexStrip() {
  const { data, isLoading } = useQuery<{ indices: MarketIndex[] }>({
    queryKey: ['market-indices'],
    queryFn: () => marketApi.indices().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer" style={{ height: 78, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }} />
        ))}
      </div>
    )
  }

  const indices = data?.indices || []
  if (!indices.length) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${indices.length}, 1fr)`, gap: 10, marginBottom: 20 }}>
      {indices.map((idx) => (
        <div key={idx.symbol} style={{
          background: '#0E1420', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div>
            <p style={{ fontSize: 10, color: '#4A5568', marginBottom: 4 }}>{idx.name}</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5 }}>
              {formatIndexValue(idx.name, idx.value)}
            </p>
            <TrendChip value={idx.change_pct} />
          </div>
          <Sparkline data={idx.sparkline} color={idx.change_pct >= 0 ? '#22c55e' : '#f43f5e'} width={56} height={32} />
        </div>
      ))}
    </div>
  )
}

function TodayEvents() {
  const { data } = useQuery<{ events: CalendarEvent[] }>({
    queryKey: ['calendar-week'],
    queryFn: () => marketApi.calendarWeek().then((r) => r.data),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })

  const events = (data?.events || [])
    .filter((e) => {
      const d = new Date(e.date)
      return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now() - 24 * 3600 * 1000
    })
    .slice(0, 4)

  if (!events.length) return null

  return (
    <Card style={{ padding: '16px 20px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#4A5568', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>Coming up on the calendar</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {events.map((e, i) => {
          const d = new Date(e.date)
          const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <div key={`${e.title}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 0',
              borderBottom: i < events.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', minWidth: 52, fontVariantNumeric: 'tabular-nums' }}>{dateLabel}</span>
              <span style={{ fontSize: 13, color: '#F0F4FF', flex: 1 }}>{e.title}</span>
              <Badge label={e.impact} color={e.impact === 'High' ? 'red' : e.impact === 'Medium' ? 'yellow' : 'gray'} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

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

        <IndexStrip />

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
            {summary.summary && !summary.summary.startsWith('AI agent error')
              ? summary.summary.split('\n').find(l => l.trim().length > 20 && !l.startsWith('-') && !l.startsWith('1.') && !l.includes(':')) || 'Market Update'
              : 'Market Update'}
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

      {/* Index strip — live data */}
      <IndexStrip />

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
      {summary.market_regime && (() => {
        const parts = summary.market_regime.split('\n')
        const regime = parts[0]?.replace('Regime: ', '').replace(/_/g, ' ') || ''
        const description = parts[1]?.replace('Description: ', '') || ''
        const implication = parts[2]?.replace('Implication: ', '') || ''
        return (
          <div style={{
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.18)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 16,
            display: 'grid', gridTemplateColumns: '3px 1fr', gap: 16,
          }}>
            <div style={{ width: 3, borderRadius: 99, background: '#22c55e' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 0.8, textTransform: 'uppercase' }}>Market Regime</p>
                {regime && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#F0F4FF', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 99 }}>
                    {regime}
                  </span>
                )}
              </div>
              {description && <p style={{ fontSize: 13, color: '#8B96B0', lineHeight: 1.75, marginBottom: 4 }}>{description}</p>}
              {implication && <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>→ {implication}</p>}
            </div>
          </div>
        )
      })()}

      {/* Events — live calendar data */}
      <TodayEvents />

      <p style={{ textAlign: 'right', fontSize: 10, color: '#4A5568', marginTop: 12 }}>
        Generated {new Date(summary.generated_at).toLocaleTimeString()} · {summary.tokens_used} tokens
      </p>
    </div>
  )
}
