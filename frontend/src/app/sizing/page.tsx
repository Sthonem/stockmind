'use client'

import { useState } from 'react'

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  fmt: (v: number) => string
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#8B96B0', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#22c55e' }}
      />
    </div>
  )
}

export default function SizingPage() {
  const [winRate, setWinRate] = useState(55)
  const [winLoss, setWinLoss] = useState(1.8)
  const [portfolioSize, setPortfolioSize] = useState(50000)
  const [riskScore, setRiskScore] = useState(50)

  const kelly = Math.max(0, winRate / 100 - (1 - winRate / 100) / winLoss)
  const halfKelly = kelly * 0.5
  const riskAdj = riskScore >= 70 ? 0.6 : riskScore >= 40 ? 0.7 : 1.0
  const adjusted = halfKelly * riskAdj
  const dollarAmt = portfolioSize * adjusted

  const riskReductionLabel = riskScore >= 70 ? 'High risk: −40%' : riskScore >= 40 ? 'Medium risk: −30%' : 'Low risk: no reduction'

  const cardStyle = {
    background: '#0E1420',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '18px 20px',
  }

  const breakdownRows = [
    { label: 'Full Kelly', value: `${(kelly * 100).toFixed(1)}%`, sub: 'Theoretical maximum' },
    { label: 'Half Kelly', value: `${(halfKelly * 100).toFixed(1)}%`, sub: 'StockMind baseline (50%)' },
    { label: 'Risk Adjustment', value: `${((1 - riskAdj) * 100).toFixed(0)}% reduction`, sub: riskReductionLabel },
    { label: 'Final Size', value: `${(adjusted * 100).toFixed(1)}%`, sub: `$${Math.round(dollarAmt).toLocaleString()}` },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>
          Position Sizing
        </h1>
        <p style={{ fontSize: 13, color: '#8B96B0' }}>
          Kelly Criterion calculator — optimal portfolio allocation
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Left: Inputs */}
        <div style={cardStyle}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 20 }}>
            Inputs
          </p>
          <Slider label="Win Rate" value={winRate} min={1} max={99} step={1} onChange={setWinRate} fmt={(v) => `${v}%`} />
          <Slider label="Win/Loss Ratio" value={winLoss} min={0.1} max={5} step={0.1} onChange={setWinLoss} fmt={(v) => `${v.toFixed(1)}×`} />
          <Slider label="Portfolio Size" value={portfolioSize} min={1000} max={500000} step={1000} onChange={setPortfolioSize} fmt={(v) => `$${v.toLocaleString()}`} />
          <Slider label="Risk Score" value={riskScore} min={0} max={100} step={1} onChange={setRiskScore} fmt={(v) => `${v}/100`} />
        </div>

        {/* Right: Result + breakdown + warning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Result card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
              Recommended Position Size
            </p>
            <p style={{ fontSize: 42, fontWeight: 900, color: '#F0F4FF', letterSpacing: -2, marginBottom: 4 }}>
              ${Math.round(dollarAmt).toLocaleString()}
            </p>
            <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
              {(adjusted * 100).toFixed(1)}% of portfolio
            </p>
            <div style={{ marginTop: 16, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(adjusted * 100, 100)}%`,
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                borderRadius: 99,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Breakdown */}
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
              Calculation Breakdown
            </p>
            {breakdownRows.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: i < breakdownRows.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF' }}>{row.label}</p>
                  <p style={{ fontSize: 11, color: '#4A5568' }}>{row.sub}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{row.value}</p>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              ⚠ Not financial advice. Always consider your full financial situation before making investment decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Formula card */}
      <div style={cardStyle}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
          How It Works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#8B96B0', lineHeight: 1.7 }}>
            The Kelly Criterion calculates the optimal fraction of your portfolio to allocate based on historical win rate and win/loss ratio.
            StockMind uses Half Kelly (50%) as the baseline, then adjusts based on your current risk score.
          </p>
          <div style={{ background: '#141C2B', borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#22c55e' }}>
            <p style={{ color: '#4A5568', fontSize: 11, marginBottom: 6 }}>Kelly formula:</p>
            <p>K = W − (1−W) / R</p>
            <p style={{ marginTop: 4, color: '#4A5568', fontSize: 11 }}>W = win rate, R = win/loss ratio</p>
          </div>
        </div>
      </div>
    </div>
  )
}
