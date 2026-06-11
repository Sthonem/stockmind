import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const portfolioApi = {
  list: () => api.get('/api/v1/portfolio/'),
  get: (id: number) => api.get(`/api/v1/portfolio/${id}`),
  create: (name: string) => api.post('/api/v1/portfolio/', { name }),
  addPosition: (portfolioId: number, data: {
    ticker: string
    shares: number
    avg_buy_price: number
    currency?: string
    notes?: string
  }) => api.post(`/api/v1/portfolio/${portfolioId}/positions`, data),
  deletePosition: (positionId: number) =>
    api.delete(`/api/v1/portfolio/positions/${positionId}`),
  performance: (id: number) => api.get(`/api/v1/portfolio/${id}/performance`),
  riskSummary: (id: number) => api.get(`/api/v1/portfolio/${id}/risk/summary`),
  riskHistory: (positionId: number) =>
    api.get(`/api/v1/portfolio/positions/${positionId}/risk/history`),
  calculateRisk: (id: number) => api.post(`/api/v1/portfolio/${id}/risk/calculate`),
  diversification: (id: number) => api.get(`/api/v1/portfolio/${id}/diversification`),
  correlation: (id: number) => api.get(`/api/v1/portfolio/${id}/correlation`),
  earnings: (id: number) => api.get(`/api/v1/portfolio/${id}/earnings`),
  sync: (id: number) => api.post(`/api/v1/portfolio/${id}/sync`),
  checkAlerts: (id: number, threshold?: number) =>
    api.post(`/api/v1/portfolio/${id}/alerts/check?risk_threshold=${threshold || 70}`),
}

export const marketApi = {
  indices: () => api.get('/api/v1/market/indices'),
  price: (ticker: string) => api.get(`/api/v1/market/price/${ticker}`),
  info: (ticker: string) => api.get(`/api/v1/market/info/${ticker}`),
  ohlcv: (ticker: string, period?: string) =>
    api.get(`/api/v1/market/ohlcv/${ticker}?period=${period || '6mo'}`),
  analyze: (ticker: string) => api.get(`/api/v1/market/analyze/${ticker}`),
  risk: (ticker: string, sentiment?: boolean) =>
    api.get(`/api/v1/market/risk/${ticker}?include_sentiment=${sentiment || false}`),
  rsi: (ticker: string) => api.get(`/api/v1/market/rsi/${ticker}`),
  macd: (ticker: string) => api.get(`/api/v1/market/macd/${ticker}`),
  bollinger: (ticker: string) => api.get(`/api/v1/market/bollinger/${ticker}`),
  stoploss: (ticker: string, avgBuyPrice: number) =>
    api.get(`/api/v1/market/stoploss/${ticker}?avg_buy_price=${avgBuyPrice}`),
  regime: (ticker: string) => api.get(`/api/v1/market/regime/${ticker}`),
  backtest: (ticker: string, period?: string) =>
    api.get(`/api/v1/market/backtest/${ticker}?period=${period || '1y'}`),
  validate: (ticker: string) => api.get(`/api/v1/market/validate/${ticker}`),
  earnings: (ticker: string) => api.get(`/api/v1/market/earnings/${ticker}`),
  insider: (ticker: string) => api.get(`/api/v1/market/insider/${ticker}`),
  institutional: (ticker: string) => api.get(`/api/v1/market/institutional/${ticker}`),
  calendarUpcoming: () => api.get('/api/v1/market/calendar/upcoming'),
  calendarWeek: () => api.get('/api/v1/market/calendar/week'),
  sizing: (ticker: string, portfolioValue: number, riskScore: number, maxPositionPct?: number) =>
    api.get(`/api/v1/market/sizing/${ticker}?portfolio_value=${portfolioValue}&risk_score=${riskScore}&max_position_pct=${maxPositionPct || 0.25}`),
}

export const agentApi = {
  ask: (question: string, portfolioId?: number, history?: { role: string, content: string }[]) =>
    api.post('/api/v1/agent/ask', {
      question,
      portfolio_id: portfolioId,
      conversation_history: history?.map((h) => ({ role: h.role, content: h.content })),
    }),
  scenario: (scenario: string, tickers: string[], portfolioId?: number, scenarioType?: string) =>
    api.post('/api/v1/agent/scenario', {
      scenario,
      tickers,
      portfolio_id: portfolioId,
      scenario_type: scenarioType,
    }),
  scenarioTemplates: () => api.get('/api/v1/agent/scenario/templates'),
  dailySummary: (portfolioId?: number) =>
    api.get(`/api/v1/agent/daily-summary${portfolioId ? `?portfolio_id=${portfolioId}` : ''}`),
  stoploss: (ticker: string, avgBuyPrice: number) =>
    api.get(`/api/v1/agent/stoploss/${ticker}?avg_buy_price=${avgBuyPrice}`),
  context: (portfolioId: number) =>
    api.get(`/api/v1/agent/context/${portfolioId}`),
}

export const newsApi = {
  ticker: (ticker: string, daysBack?: number) =>
    api.get(`/api/v1/news/${ticker}?days_back=${daysBack || 7}`),
  sentiment: (ticker: string) =>
    api.get(`/api/v1/news/${ticker}/sentiment`),
  categorized: (ticker: string) =>
    api.get(`/api/v1/news/${ticker}/categorized`),
  market: () => api.get('/api/v1/news/market/latest'),
}

export const watchlistApi = {
  list: () => api.get('/api/v1/watchlist/'),
  add: (data: {
    ticker: string
    notes?: string
    target_price?: number
    alert_above?: number
    alert_below?: number
  }) => api.post('/api/v1/watchlist/', data),
  remove: (id: number) => api.delete(`/api/v1/watchlist/${id}`),
  checkAlerts: () => api.post('/api/v1/watchlist/check'),
}
