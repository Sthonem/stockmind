export interface Position {
  id: number
  portfolio_id: number
  ticker: string
  shares: number
  avg_buy_price: number
  currency: string
  notes?: string
  created_at: string
}

export interface Portfolio {
  id: number
  name: string
  created_at: string
  positions: Position[]
}

export interface RiskScore {
  score: number
  level: 'low' | 'medium' | 'high'
  recommendation: string
  components: {
    rsi_risk: number
    macd_risk: number
    bb_risk: number
    ema_risk: number
    sentiment_risk: number
  }
}

export interface PortfolioRiskSummary {
  portfolio_id: number
  portfolio_risk_score: number
  portfolio_risk_level: string
  portfolio_note: string
  high_risk_positions: string[]
  medium_risk_positions: string[]
  low_risk_positions: string[]
  positions: {
    ticker: string
    risk_score: number
    risk_level: string
    estimated_value: number
  }[]
}

export interface PerformanceData {
  portfolio_id: number
  total_cost_basis: number
  total_current_value: number
  total_unrealized_pnl: number
  total_unrealized_pnl_pct: number
  is_overall_profitable: boolean
  best_performer: string
  worst_performer: string
  positions: {
    ticker: string
    shares: number
    avg_buy_price: number
    current_price: number
    cost_basis: number
    current_value: number
    unrealized_pnl: number
    unrealized_pnl_pct: number
    is_profitable: boolean
  }[]
}

export interface WatchlistItem {
  id: number
  ticker: string
  notes?: string
  target_price?: number
  alert_above?: number
  alert_below?: number
  is_active: number
  created_at: string
}

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}
