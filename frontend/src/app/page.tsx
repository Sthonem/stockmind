'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  PlugZap,
  LineChart,
  RefreshCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import { Card, MetricCard } from '@/components/ui/Card'
import { PortfolioRiskPanel } from '@/components/risk/PortfolioRiskPanel'
import { AddPositionForm } from '@/components/portfolio/AddPositionForm'
import { CreatePortfolioForm } from '@/components/portfolio/CreatePortfolioForm'
import { DeletePositionButton } from '@/components/portfolio/DeletePositionButton'
import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart'
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

function riskColor(level?: string) {
  if (level === 'high') return 'text-red-400'
  if (level === 'medium') return 'text-yellow-400'
  if (level === 'low') return 'text-green-400'
  return 'text-gray-400'
}

export default function Home() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const portfoliosQuery = usePortfolios()
  const portfolios = useMemo(
    () => (portfoliosQuery.data || []) as Portfolio[],
    [portfoliosQuery.data]
  )

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
  const pnlColor = (performance?.total_unrealized_pnl || 0) >= 0 ? 'green' : 'red'
  const highRiskCount = risk?.high_risk_positions?.length || 0
  const riskLevel = risk?.portfolio_risk_level || 'unknown'
  const loading = portfoliosQuery.isLoading || portfolioQuery.isLoading
  const portfolioLoadError = portfoliosQuery.isError || portfolioQuery.isError

  const topPositions = useMemo(() => {
    return (performance?.positions || []).slice(0, 5)
  }, [performance])

  const positionIdsByTicker = useMemo(() => {
    return new Map((portfolio?.positions || []).map((position) => [position.ticker, position.id]))
  }, [portfolio])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
            <p className="text-sm text-gray-400">Portfolio overview, risk, and alerts</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="h-10 rounded-lg border border-gray-700 bg-gray-900 px-3 text-sm text-white outline-none focus:border-green-500"
              value={selectedPortfolioId ?? ''}
              onChange={(event) => setSelectedPortfolioId(Number(event.target.value))}
              disabled={!portfolios.length}
            >
              {!portfolios.length ? <option>No portfolios</option> : null}
              {portfolios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 text-sm text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Briefcase size={16} />
              {showCreateForm ? 'Cancel' : 'New Portfolio'}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 text-sm text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
              onClick={() => {
                portfoliosQuery.refetch()
                portfolioQuery.refetch()
                performanceQuery.refetch()
                riskQuery.refetch()
                watchlistQuery.refetch()
              }}
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-6">
            <Card>
              <h2 className="text-lg font-medium text-white mb-4">Create New Portfolio</h2>
              <CreatePortfolioForm onSuccess={() => {
                setShowCreateForm(false)
                portfoliosQuery.refetch()
              }} />
            </Card>
          </div>
        )}

        {portfolioLoadError ? (
          <Card>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <PlugZap size={24} />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">Backend connection failed</h2>
              <p className="mb-5 text-sm text-gray-400">
                StockMind could not load portfolio data. Make sure the FastAPI backend is running on
                <span className="mx-1 font-mono text-gray-300">http://localhost:8001</span>
                and that the current frontend origin is allowed by CORS.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
                  onClick={() => {
                    portfoliosQuery.refetch()
                    portfolioQuery.refetch()
                    performanceQuery.refetch()
                    riskQuery.refetch()
                    watchlistQuery.refetch()
                  }}
                >
                  <RefreshCcw size={16} />
                  Retry connection
                </button>
                <Link
                  href="/sizing"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 px-4 text-sm text-gray-300 transition hover:border-gray-600 hover:bg-gray-800"
                >
                  Use offline tools
                </Link>
              </div>
            </div>
          </Card>
        ) : loading ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-gray-300">
              <RefreshCcw className="animate-spin text-blue-400" size={20} />
              <div className="text-center">
                <p className="font-medium">Loading portfolio data...</p>
                <p className="mt-1 text-xs text-gray-500">
                  If this takes too long, check whether the backend is running.
                </p>
              </div>
            </div>
          </Card>
        ) : !hasPortfolio ? (
          <Card>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                <Briefcase size={24} />
              </div>
              <h1 className="text-3xl font-bold mb-4">StockMind</h1>
              <p className="text-gray-400 mb-6">Create your first portfolio to get started.</p>
              <div className="max-w-sm mx-auto">
                <CreatePortfolioForm />
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Portfolio Value"
                value={formatMoney(performance?.total_current_value)}
                sub={`Cost basis ${formatMoney(performance?.total_cost_basis)}`}
              />
              <MetricCard
                label="Unrealized P/L"
                value={formatMoney(performance?.total_unrealized_pnl)}
                sub={formatPct(performance?.total_unrealized_pnl_pct)}
                color={pnlColor}
              />
              <MetricCard
                label="Risk Score"
                value={risk?.portfolio_risk_score ?? 'N/A'}
                sub={riskLevel.toUpperCase()}
                color={riskLevel === 'high' ? 'red' : riskLevel === 'medium' ? 'yellow' : 'green'}
              />
              <MetricCard
                label="Positions"
                value={positionCount}
                sub={`${watchlist.length} watchlist items`}
              />
            </section>

            {selectedPortfolioId ? (
              <section>
                <Card>
                  <h2 className="text-lg font-medium text-white mb-4">Performance</h2>
                  {positionCount > 0 ? (
                    <PortfolioValueChart portfolioId={selectedPortfolioId} />
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/60 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-gray-300">No positions to value yet</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Add your first position to unlock performance tracking.
                      </p>
                    </div>
                  )}
                </Card>
              </section>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <Card>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">Positions</h2>
                    <p className="text-sm text-gray-400">
                      {portfolio?.name || 'Selected portfolio'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <LineChart className="text-green-400" size={22} />
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {showAddForm ? 'Cancel' : '+ Add Position'}
                    </button>
                  </div>
                </div>

                {showAddForm && selectedPortfolioId && (
                  <div className="mb-4 pb-4 border-b border-gray-800">
                    <AddPositionForm
                      portfolioId={selectedPortfolioId}
                      onSuccess={() => setShowAddForm(false)}
                      onCancel={() => setShowAddForm(false)}
                    />
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-gray-800 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="pb-3 font-medium">Ticker</th>
                        <th className="pb-3 font-medium">Shares</th>
                        <th className="pb-3 font-medium">Avg Buy</th>
                        <th className="pb-3 font-medium">Current</th>
                        <th className="pb-3 font-medium">Value</th>
                        <th className="pb-3 font-medium">P/L</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {topPositions.length ? (
                        topPositions.map((position) => {
                          const positionId = positionIdsByTicker.get(position.ticker)

                          return (
                            <tr key={position.ticker}>
                              <td className="py-4 font-semibold text-white">
                                <Link
                                  href={`/stock/${position.ticker}`}
                                  className="hover:text-blue-400 transition-colors"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {position.ticker}
                                </Link>
                              </td>
                              <td className="py-4 text-gray-300">{position.shares}</td>
                              <td className="py-4 text-gray-300">
                                {formatMoney(position.avg_buy_price)}
                              </td>
                              <td className="py-4 text-gray-300">
                                {formatMoney(position.current_price)}
                              </td>
                              <td className="py-4 text-gray-300">
                                {formatMoney(position.current_value)}
                              </td>
                              <td
                                className={`py-4 font-medium ${
                                  position.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {formatPct(position.unrealized_pnl_pct)}
                              </td>
                              <td className="py-4 text-right">
                                {positionId && selectedPortfolioId ? (
                                  <DeletePositionButton
                                    positionId={positionId}
                                    ticker={position.ticker}
                                    portfolioId={selectedPortfolioId}
                                  />
                                ) : null}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td className="py-8 text-gray-400" colSpan={7}>
                            No positions yet. Add one to start tracking performance.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {selectedPortfolioId ? (
                <Card>
                  <h2 className="text-lg font-medium text-white mb-4">Portfolio Risk</h2>
                  {positionCount > 0 ? (
                    <PortfolioRiskPanel portfolioId={selectedPortfolioId} />
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/60 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-gray-300">Risk analysis is waiting</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Add positions, then run risk calculation or daily sync.
                      </p>
                    </div>
                  )}
                </Card>
              ) : null}

              <Card>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Risk Monitor</h2>
                    <p className="text-sm text-gray-400">
                      {risk?.portfolio_note || 'Run risk calculation to fill this panel'}
                    </p>
                  </div>
                  <ShieldCheck className={riskColor(riskLevel)} size={22} />
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-gray-800 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-400">High risk positions</span>
                      <span className="font-semibold text-red-400">{highRiskCount}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {risk?.high_risk_positions?.length ? (
                        risk.high_risk_positions.map((ticker) => (
                          <span
                            key={ticker}
                            className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-300"
                          >
                            {ticker}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(risk?.positions || []).slice(0, 4).map((position) => (
                      <div
                        key={position.ticker}
                        className="flex items-center justify-between rounded-lg border border-gray-800 px-3 py-3"
                      >
                        <div>
                          <p className="font-medium">{position.ticker}</p>
                          <p className="text-xs text-gray-500">
                            {formatMoney(position.estimated_value)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${riskColor(position.risk_level)}`}>
                            {position.risk_score ?? 'N/A'}
                          </p>
                          <p className="text-xs uppercase text-gray-500">
                            {position.risk_level || 'unknown'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </section>

            {selectedPortfolioId ? (
              <div className="flex justify-end">
                <Link
                  href={`/portfolio/${selectedPortfolioId}`}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  View full portfolio analysis →
                </Link>
              </div>
            ) : null}

            <section className="grid gap-6 lg:grid-cols-3">
              <Card>
                <div className="mb-4 flex items-center gap-3">
                  <TrendingUp className="text-green-400" size={20} />
                  <h2 className="text-lg font-semibold">Best Performer</h2>
                </div>
                <p className="text-3xl font-semibold">
                  {performance?.best_performer || 'N/A'}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Leading position by unrealized return.
                </p>
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-3">
                  <TrendingDown className="text-red-400" size={20} />
                  <h2 className="text-lg font-semibold">Worst Performer</h2>
                </div>
                <p className="text-3xl font-semibold">
                  {performance?.worst_performer || 'N/A'}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Weakest position by unrealized return.
                </p>
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-3">
                  <Bell className="text-yellow-400" size={20} />
                  <h2 className="text-lg font-semibold">Watchlist</h2>
                </div>
                <div className="space-y-3">
                  {watchlist.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.ticker}</span>
                      <span className="text-gray-400">
                        {item.target_price ? formatMoney(item.target_price) : 'No target'}
                      </span>
                    </div>
                  ))}
                  {!watchlist.length ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <AlertTriangle size={16} />
                      No watchlist items.
                    </div>
                  ) : null}
                </div>
              </Card>
            </section>

            <section>
              <Card>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-green-400" size={22} />
                    <div>
                      <h2 className="text-lg font-semibold">Data Status</h2>
                      <p className="text-sm text-gray-400">
                        Portfolio, performance, risk, and watchlist queries are connected.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-4">
                    <span className="rounded-md bg-gray-800 px-3 py-2 text-gray-300">
                      Portfolio {portfolioQuery.isError ? 'error' : 'ready'}
                    </span>
                    <span className="rounded-md bg-gray-800 px-3 py-2 text-gray-300">
                      Performance {performanceQuery.isError ? 'error' : 'ready'}
                    </span>
                    <span className="rounded-md bg-gray-800 px-3 py-2 text-gray-300">
                      Risk {riskQuery.isError ? 'error' : 'ready'}
                    </span>
                    <span className="rounded-md bg-gray-800 px-3 py-2 text-gray-300">
                      Watchlist {watchlistQuery.isError ? 'error' : 'ready'}
                    </span>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
