import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { marketApi, portfolioApi, watchlistApi } from './api'

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfolioApi.list().then((r) => r.data),
  })
}

export function usePortfolio(id: number | null) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => portfolioApi.get(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function usePortfolioPerformance(id: number | null) {
  return useQuery({
    queryKey: ['portfolio-performance', id],
    queryFn: () => portfolioApi.performance(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function usePortfolioRisk(id: number | null) {
  return useQuery({
    queryKey: ['portfolio-risk', id],
    queryFn: () => portfolioApi.riskSummary(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function useMarketAnalysis(ticker: string | null) {
  return useQuery({
    queryKey: ['market-analysis', ticker],
    queryFn: () => marketApi.analyze(ticker!).then((r) => r.data),
    enabled: !!ticker,
  })
}

export function useTickerRisk(ticker: string | null) {
  return useQuery({
    queryKey: ['ticker-risk', ticker],
    queryFn: () => marketApi.risk(ticker!).then((r) => r.data),
    enabled: !!ticker,
  })
}

export function useOHLCV(ticker: string | null, period?: string) {
  return useQuery({
    queryKey: ['ohlcv', ticker, period],
    queryFn: () => marketApi.ohlcv(ticker!, period).then((r) => r.data),
    enabled: !!ticker,
  })
}

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list().then((r) => r.data),
  })
}

export function useAddPosition(portfolioId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      ticker: string
      shares: number
      avg_buy_price: number
      notes?: string
      currency?: string
    }) => portfolioApi.addPosition(portfolioId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      qc.invalidateQueries({ queryKey: ['portfolio-performance', portfolioId] })
      qc.invalidateQueries({ queryKey: ['portfolio-risk', portfolioId] })
    },
  })
}

export function useDeletePosition(portfolioId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (positionId: number) =>
      portfolioApi.deletePosition(positionId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      qc.invalidateQueries({ queryKey: ['portfolio-performance', portfolioId] })
      qc.invalidateQueries({ queryKey: ['portfolio-risk', portfolioId] })
    },
  })
}
