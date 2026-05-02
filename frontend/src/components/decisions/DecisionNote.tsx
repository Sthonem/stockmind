'use client'

import { useState } from 'react'
import { TrendChip } from '@/components/ui/TrendChip'
import { Badge } from '@/components/ui/Badge'

interface DecisionNoteProps {
  positionId: number
  ticker: string
  avgBuyPrice: number
  shares?: number
  currentPrice?: number
  notes?: string
  currentPnlPct?: number
  currentPnlAbs?: number
  riskScore?: number
}

export function DecisionNote({
  ticker,
  avgBuyPrice,
  shares,
  currentPrice,
  notes,
  currentPnlPct,
  currentPnlAbs,
  riskScore,
}: DecisionNoteProps) {
  const [expanded, setExpanded] = useState(false)

  const riskColor = riskScore == null ? '#8B96B0'
    : riskScore >= 70 ? '#f43f5e'
    : riskScore >= 40 ? '#f59e0b' : '#22c55e'

  const riskBadgeColor = riskScore == null ? 'gray'
    : riskScore >= 70 ? 'red'
    : riskScore >= 40 ? 'yellow' : 'green'

  const riskLabel = riskScore == null ? 'unknown'
    : riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low'

  const pnlColor = currentPnlPct == null ? '#8B96B0'
    : currentPnlPct >= 0 ? '#22c55e' : '#f43f5e'

  const metricItems = [
    {
      label: 'P/L',
      value: currentPnlPct != null ? `${currentPnlPct >= 0 ? '+' : ''}${currentPnlPct.toFixed(1)}%` : '—',
      color: pnlColor,
    },
    {
      label: 'Risk score',
      value: riskScore != null ? `${riskScore}/100` : '—',
      color: riskColor,
    },
    {
      label: 'Value',
      value: currentPrice && shares ? `$${(currentPrice * shares).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—',
      color: '#F0F4FF',
    },
  ]

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: '#0E1420',
        border: `1px solid ${expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        marginBottom: 8,
      }}
    >
      {/* Collapsed row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: '#8B96B0', letterSpacing: 0.5,
        }}>
          {ticker.slice(0, 2)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#F0F4FF' }}>{ticker}</span>
            {currentPnlPct != null && <TrendChip value={currentPnlPct} />}
            <Badge label={riskLabel} color={riskBadgeColor as 'red' | 'yellow' | 'green' | 'gray'} />
          </div>
          <p style={{ fontSize: 12, color: '#4A5568' }}>
            {shares != null ? `${shares} shares · ` : ''}avg ${avgBuyPrice?.toFixed(2)}{currentPrice ? ` · now $${currentPrice.toFixed(2)}` : ''}
          </p>
        </div>

        {currentPnlAbs != null && (
          <div style={{ textAlign: 'right', minWidth: 72 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: pnlColor }}>
              {currentPnlAbs >= 0 ? '+' : '−'}${Math.abs(currentPnlAbs).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: 10, color: '#4A5568' }}>unrealized</p>
          </div>
        )}

        <span style={{
          fontSize: 16, color: '#4A5568',
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s',
          display: 'block',
          flexShrink: 0,
        }}>›</span>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{
          padding: '14px 18px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {metricItems.map((m) => (
              <div key={m.label} style={{ background: '#141C2B', borderRadius: 9, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: '#4A5568', marginBottom: 4 }}>{m.label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#8B96B0', lineHeight: 1.75 }}>
            {notes || 'No investment thesis recorded.'}
          </p>
        </div>
      )}
    </div>
  )
}
