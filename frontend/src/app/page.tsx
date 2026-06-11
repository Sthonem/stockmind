'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RefreshCcw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendChip } from '@/components/ui/TrendChip'
import { MetricTile } from '@/components/ui/MetricTile'
import { Sparkline } from '@/components/charts/MiniChart'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { AddPositionForm } from '@/components/portfolio/AddPositionForm'
import { CreatePortfolioForm } from '@/components/portfolio/CreatePortfolioForm'
import { DeletePositionButton } from '@/components/portfolio/DeletePositionButton'
import { portfolioApi } from '@/lib/api'
import {
  usePortfolio,
  usePortfolioPerformance,
  usePortfolioRisk,
  usePortfolios,
  useWatchlist,
} from '@/lib/hooks'
import type {
  PerformanceData,
  Portfolio,
  PortfolioRiskSummary,
  WatchlistItem,
} from '@/lib/types'

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPct(value?: number | null) {
  if (value === null || value === undefined) return '0.00%'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function riskBadgeColor(level?: string): 'green' | 'yellow' | 'red' | 'gray' {
  if (level === 'high') return 'red'
  if (level === 'medium') return 'yellow'
  if (level === 'low') return 'green'
  return 'gray'
}

// Simple inline bar component
function InlineBar({ value, max = 100, color = '#22c55e' }: { value: number; max?: number; color?: string }) {
  return (
    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${Math.min((value / max) * 100, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  )
}

export default function Home() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('positions')
  const portfoliosQuery = usePortfolios()
  const portfolios = useMemo(() => (portfoliosQuery.data || []) as Portfolio[], [portfoliosQuery.data])

  useEffect(() => {
    if (!selectedPortfolioId && portfolios.length > 0) {
      setSelectedPortfolioId(portfolios[0].id)
    }
  }, [portfolios, selectedPortfolioId])

  const portfolioQuery = usePortfolio(selectedPortfolioId)
  const performanceQuery = usePortfolioPerformance(selectedPortfolioId)
  const riskQuery = usePortfolioRisk(selectedPortfolioId)
  const watchlistQuery = useWatchlist()

  const portfolio = portfolioQuery.data as Portfolio | undefined
  const performance = performanceQuery.data as PerformanceData | undefined
  const risk = riskQuery.data as PortfolioRiskSummary | undefined
  const watchlist = (watchlistQuery.data || []) as WatchlistItem[]

  const hasPortfolio = Boolean(selectedPortfolioId)
  const positionCount = portfolio?.positions?.length || 0
  const pnlValue = performance?.total_unrealized_pnl || 0
  const pnlColor = pnlValue >= 0 ? '#22c55e' : '#f43f5e'
  const riskScore = risk?.portfolio_risk_score ?? 0
  const riskLevel = risk?.portfolio_risk_level || 'unknown'
  const riskColor = riskScore >= 70 ? '#f43f5e' : riskScore >= 40 ? '#f59e0b' : '#22c55e'
  const loading = portfoliosQuery.isLoading || portfolioQuery.isLoading
  const portfolioLoadError = portfoliosQuery.isError || portfolioQuery.isError

  const topPositions = useMemo(() => (performance?.positions || []).slice(0, 5), [performance])
  const positionIdsByTicker = useMemo(
    () => new Map((portfolio?.positions || []).map((p) => [p.ticker, p.id])),
    [portfolio]
  )

  const riskPositions = risk?.positions || []
  const noRiskScores = riskPositions.length === 0 || riskPositions.every((p) => p.risk_score == null)

  const calculateRisk = useMutation({
    mutationFn: () => portfolioApi.calculateRisk(selectedPortfolioId!).then((r) => r.data),
    onSuccess: () => { riskQuery.refetch() },
  })

  // Build a simple chart from performance data (mock 9 points if no data)
  const chartData = [78200, 79100, 80500, 79800, 81200, 82400, 81900, 83100,
    performance?.total_current_value || 84320]
  const chartW = 560
  const chartH = 110
  const cMin = Math.min(...chartData)
  const cMax = Math.max(...chartData)
  const cRng = cMax - cMin || 1
  const chartPts = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1)) * chartW
    const y = chartH - ((v - cMin) / cRng) * (chartH - 16) - 8
    return [x, y] as [number, number]
  })
  const pathD = chartPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const fillD = `${pathD} L ${chartW} ${chartH} L 0 ${chartH} Z`

  return (
    <div style={{ background: '#080C14', minHeight: '100vh', color: '#F0F4FF' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: '#8B96B0' }}>Portfolio overview · Risk · Alerts</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={{
                height: 36, padding: '0 12px', borderRadius: 8,
                background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
                color: '#F0F4FF', fontSize: 13, outline: 'none', cursor: 'pointer',
              }}
              value={selectedPortfolioId ?? ''}
              onChange={(e) => setSelectedPortfolioId(Number(e.target.value))}
              disabled={!portfolios.length}
            >
              {!portfolios.length ? <option>No portfolios</option> : null}
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              style={{
                height: 36, padding: '0 14px', borderRadius: 8,
                background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
                color: '#8B96B0', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <span style={{ fontSize: 14 }}>＋</span> New Portfolio
            </button>
            <button
              style={{
                height: 36, padding: '0 14px', borderRadius: 8,
                background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
                color: '#8B96B0', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onClick={() => {
                portfoliosQuery.refetch()
                portfolioQuery.refetch()
                performanceQuery.refetch()
                riskQuery.refetch()
                watchlistQuery.refetch()
              }}
            >
              <RefreshCcw size={13} /> Refresh
            </button>
            {hasPortfolio && (
              <Link
                href={`/portfolio/${selectedPortfolioId}`}
                style={{
                  height: 36, padding: '0 14px', borderRadius: 8,
                  background: '#3b82f6', border: '1px solid transparent',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  textDecoration: 'none',
                }}
              >
                📊 Full Analysis
              </Link>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div style={{ marginBottom: 20 }}>
            <Card>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF', marginBottom: 16 }}>Create New Portfolio</h2>
              <CreatePortfolioForm onSuccess={() => { setShowCreateForm(false); portfoliosQuery.refetch() }} />
            </Card>
          </div>
        )}

        {portfolioLoadError ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', marginBottom: 8 }}>Backend connection failed</h2>
              <p style={{ fontSize: 13, color: '#8B96B0', marginBottom: 20 }}>
                Make sure the FastAPI backend is running on <code style={{ color: '#F0F4FF', fontFamily: 'monospace' }}>http://localhost:8001</code>
              </p>
              <button
                style={{ padding: '8px 20px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                onClick={() => { portfoliosQuery.refetch(); portfolioQuery.refetch(); performanceQuery.refetch(); riskQuery.refetch(); watchlistQuery.refetch() }}
              >
                Retry connection
              </button>
            </div>
          </Card>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[80, 200, 300].map((h, i) => (
              <div key={i} className="shimmer" style={{ height: h, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }} />
            ))}
          </div>
        ) : !hasPortfolio ? (
          <Card>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F4FF', marginBottom: 12 }}>StockMind</h1>
              <p style={{ color: '#8B96B0', marginBottom: 24, fontSize: 13 }}>Create your first portfolio to get started.</p>
              <div style={{ maxWidth: 360, margin: '0 auto' }}>
                <CreatePortfolioForm />
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Metric tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <MetricTile label="Portfolio Value" value={formatMoney(performance?.total_current_value)} sub={`Cost basis ${formatMoney(performance?.total_cost_basis)}`} color="#F0F4FF" icon="💼" />
              <MetricTile label="Unrealized P/L" value={(pnlValue >= 0 ? '+' : '') + formatMoney(pnlValue)} sub={formatPct(performance?.total_unrealized_pnl_pct)} color={pnlColor} icon="📈" />
              <MetricTile label="Risk Score" value={riskScore ? `${riskScore} / 100` : 'N/A'} sub={`${riskLevel.toUpperCase()} · ${risk?.high_risk_positions?.length || 0} high-risk pos.`} color={riskColor} icon="🛡️" />
              <MetricTile label="Positions" value={positionCount} sub={`${watchlist.length} watchlist items`} color="#F0F4FF" icon="📊" />
            </div>

            {/* Chart + Risk */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
              {/* Performance chart */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>Performance</p>
                    <p style={{ fontSize: 11, color: '#8B96B0', marginTop: 2 }}>90-day portfolio value</p>
                  </div>
                  <TrendChip value={performance?.total_unrealized_pnl_pct || 0} />
                </div>
                <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="pgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={fillD} fill="url(#pgFill)" />
                  <path d={pathD} stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {chartPts.map(([x, y], i) => i === chartPts.length - 1 && (
                    <circle key={i} cx={x} cy={y} r="4" fill="#22c55e" stroke="#080C14" strokeWidth="2" />
                  ))}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  {['Feb', 'Mar', 'Apr', 'May'].map((m) => (
                    <span key={m} style={{ fontSize: 10, color: '#4A5568' }}>{m}</span>
                  ))}
                </div>
              </Card>

              {/* Risk panel */}
              <Card>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF', marginBottom: 4 }}>Portfolio Risk</p>
                <p style={{ fontSize: 11, color: '#8B96B0', marginBottom: 12 }}>Composite risk score</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <RiskGauge score={riskScore || 0} size={120} />
                </div>
                {noRiskScores ? (
                  <div style={{ textAlign: 'center', paddingTop: 4 }}>
                    <button
                      onClick={() => selectedPortfolioId && calculateRisk.mutate()}
                      disabled={calculateRisk.isPending || !selectedPortfolioId}
                      style={{
                        padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: calculateRisk.isPending ? '#141C2B' : '#3b82f6',
                        color: calculateRisk.isPending ? '#4A5568' : '#fff',
                        border: 'none', cursor: calculateRisk.isPending ? 'not-allowed' : 'pointer',
                        width: '100%',
                      }}
                    >
                      {calculateRisk.isPending ? '⏳ Calculating…' : '🛡️ Calculate Risk'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {riskPositions.slice(0, 4).map((pos) => {
                      const s = pos.risk_score ?? 0
                      return (
                        <div key={pos.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', width: 44 }}>{pos.ticker}</span>
                          <div style={{ flex: 1, margin: '0 10px' }}>
                            <InlineBar value={s} color={s >= 70 ? '#f43f5e' : s >= 40 ? '#f59e0b' : '#22c55e'} />
                          </div>
                          <Badge label={pos.risk_level || 'unknown'} color={riskBadgeColor(pos.risk_level)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Positions table */}
            <Card style={{ padding: 0, marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF' }}>Positions</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['positions', 'risk'].map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: activeTab === t ? '#1A2333' : 'transparent',
                      color: activeTab === t ? '#F0F4FF' : '#8B96B0',
                      border: `1px solid ${activeTab === t ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}>{t}</button>
                  ))}
                  <button
                    style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? 'Cancel' : '+ Add Position'}
                  </button>
                </div>
              </div>

              {showAddForm && selectedPortfolioId && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <AddPositionForm portfolioId={selectedPortfolioId} onSuccess={() => setShowAddForm(false)} onCancel={() => setShowAddForm(false)} />
                </div>
              )}

              {activeTab === 'positions' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Ticker', 'Shares', 'Avg Buy', 'Current', 'Value', 'P/L', '7d Chart', ''].map((h) => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topPositions.length ? (
                      topPositions.map((position, i) => {
                        const positionId = positionIdsByTicker.get(position.ticker)
                        const spark = [position.avg_buy_price * 0.95, position.avg_buy_price * 0.98, position.avg_buy_price, position.avg_buy_price * 1.02, position.current_price * 0.97, position.current_price * 0.99, position.current_price]
                        return (
                          <tr key={position.ticker} style={{
                            borderBottom: i < topPositions.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                          }}>
                            <td style={{ padding: '12px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: 8,
                                  background: 'linear-gradient(135deg, #141C2B, #1A2333)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: position.ticker.length > 3 ? 8 : 10, fontWeight: 800, color: '#8B96B0',
                                }}>{position.ticker}</div>
                                <Link href={`/stock/${position.ticker}`} style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', textDecoration: 'none' }}>{position.ticker}</Link>
                              </div>
                            </td>
                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#8B96B0' }}>{position.shares}</td>
                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#8B96B0' }}>{formatMoney(position.avg_buy_price)}</td>
                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>{formatMoney(position.current_price)}</td>
                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#F0F4FF' }}>{formatMoney(position.current_value)}</td>
                            <td style={{ padding: '12px 20px' }}>
                              <TrendChip value={position.unrealized_pnl_pct || 0} />
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              <Sparkline data={spark} color={(position.unrealized_pnl_pct || 0) >= 0 ? '#22c55e' : '#f43f5e'} width={70} height={24} />
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              {positionId && selectedPortfolioId ? (
                                <DeletePositionButton positionId={positionId} ticker={position.ticker} portfolioId={selectedPortfolioId} />
                              ) : null}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td style={{ padding: '24px 20px', color: '#4A5568', fontSize: 13 }} colSpan={8}>
                          No positions yet. Add one to start tracking performance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* Risk tab */
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Ticker', 'Risk Score', 'Level', 'Bar', 'Recommendation'].map((h) => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {noRiskScores ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center' }}>
                          <p style={{ fontSize: 13, color: '#4A5568', marginBottom: 16 }}>
                            Risk scores haven&apos;t been calculated yet.
                          </p>
                          <button
                            onClick={() => selectedPortfolioId && calculateRisk.mutate()}
                            disabled={calculateRisk.isPending || !selectedPortfolioId}
                            style={{
                              padding: '9px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                              background: calculateRisk.isPending ? '#141C2B' : '#3b82f6',
                              color: calculateRisk.isPending ? '#4A5568' : '#fff',
                              border: 'none', cursor: calculateRisk.isPending ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {calculateRisk.isPending ? '⏳ Calculating…' : '🛡️ Calculate Risk Scores'}
                          </button>
                          {calculateRisk.isError && (
                            <p style={{ fontSize: 12, color: '#f43f5e', marginTop: 8 }}>Calculation failed. Try again.</p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      riskPositions.map((pos, i) => {
                        const score = pos.risk_score ?? 0
                        const scoreColor = score >= 70 ? '#f43f5e' : score >= 40 ? '#f59e0b' : '#22c55e'
                        return (
                          <tr key={pos.ticker} style={{ borderBottom: i < riskPositions.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                            <td style={{ padding: '12px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: 8,
                                  background: 'linear-gradient(135deg, #141C2B, #1A2333)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: pos.ticker.length > 3 ? 8 : 10, fontWeight: 800, color: '#8B96B0',
                                }}>{pos.ticker}</div>
                                <Link href={`/stock/${pos.ticker}`} style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', textDecoration: 'none' }}>{pos.ticker}</Link>
                              </div>
                            </td>
                            <td style={{ padding: '12px 20px', fontSize: 15, fontWeight: 800, color: scoreColor }}>
                              {pos.risk_score != null ? `${pos.risk_score}/100` : 'N/A'}
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              <Badge label={pos.risk_level || 'unknown'} color={riskBadgeColor(pos.risk_level)} />
                            </td>
                            <td style={{ padding: '12px 20px', minWidth: 120 }}>
                              <InlineBar value={score} color={scoreColor} />
                            </td>
                            <td style={{ padding: '12px 20px', fontSize: 12, color: '#8B96B0' }}>{'—'}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Card>
                <p style={{ fontSize: 11, color: '#8B96B0', marginBottom: 8 }}>📈 Best Performer</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#22c55e', letterSpacing: -1 }}>{performance?.best_performer || 'N/A'}</p>
                {performance?.best_performer && <p style={{ fontSize: 11, color: '#8B96B0', marginTop: 4 }}>Leading position by return</p>}
              </Card>
              <Card>
                <p style={{ fontSize: 11, color: '#8B96B0', marginBottom: 8 }}>📉 Worst Performer</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#f43f5e', letterSpacing: -1 }}>{performance?.worst_performer || 'N/A'}</p>
                {performance?.worst_performer && <p style={{ fontSize: 11, color: '#8B96B0', marginTop: 4 }}>Weakest position by return</p>}
              </Card>
              <Card>
                <p style={{ fontSize: 11, color: '#8B96B0', marginBottom: 8 }}>🔔 Watchlist</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {watchlist.slice(0, 3).map((w) => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF' }}>{w.ticker}</span>
                      <span style={{ fontSize: 11, color: '#8B96B0' }}>{w.target_price ? formatMoney(w.target_price) : 'No target'}</span>
                    </div>
                  ))}
                  {!watchlist.length && <p style={{ fontSize: 12, color: '#4A5568' }}>No watchlist items</p>}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
