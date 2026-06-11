'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/Badge'
import { Sparkline } from '@/components/charts/MiniChart'
import { Card } from '@/components/ui/Card'
import { watchlistApi, marketApi } from '@/lib/api'
import { useWatchlist } from '@/lib/hooks'
import type { WatchlistItem } from '@/lib/types'

const inputStyle = {
  height: 36, borderRadius: 8, background: '#141C2B',
  border: '1px solid rgba(255,255,255,0.07)', color: '#F0F4FF',
  padding: '0 12px', fontSize: 13, outline: 'none', width: '100%',
}

function WatchlistCard({ item }: { item: WatchlistItem }) {
  const queryClient = useQueryClient()

  interface PriceResponse { price?: number }
  const { data: priceData } = useQuery<PriceResponse>({
    queryKey: ['price', item.ticker],
    queryFn: () => marketApi.price(item.ticker).then((r) => r.data),
    refetchInterval: 60_000,
  })

  const removeItem = useMutation({
    mutationFn: () => watchlistApi.remove(item.id).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  // Real 2-week sparkline from OHLCV history
  interface OhlcvResponse { data?: { close: number }[] }
  const { data: ohlcvData } = useQuery<OhlcvResponse>({
    queryKey: ['ohlcv-spark', item.ticker],
    queryFn: () => marketApi.ohlcv(item.ticker, '1mo').then((r) => r.data),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })

  const currentPrice = priceData?.price || 0
  const target = item.target_price || 0
  const dist = target && currentPrice ? ((target - currentPrice) / currentPrice) * 100 : 0
  const hasAlert = Boolean(
    (item.alert_above && currentPrice && currentPrice >= item.alert_above) ||
    (item.alert_below && currentPrice && currentPrice <= item.alert_below) ||
    (target && currentPrice && Math.abs(currentPrice - target) / target <= 0.02)
  )
  const closes = (ohlcvData?.data || []).map((d) => d.close).slice(-10)
  const sparkUp = closes.length >= 2 ? closes[closes.length - 1] >= closes[0] : true

  return (
    <Card style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: item.ticker.length > 3 ? 9 : 11, fontWeight: 800, color: '#8B96B0', flexShrink: 0,
        }}>{item.ticker}</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>{item.ticker}</span>
            {hasAlert && <Badge label="Alert set" color="yellow" />}
          </div>
          <p style={{ fontSize: 12, color: '#8B96B0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.notes || 'No notes'}
          </p>
        </div>

        {/* Spark — real price history */}
        {closes.length >= 2 && (
          <Sparkline data={closes} color={sparkUp ? '#22c55e' : '#f43f5e'} width={72} height={26} />
        )}

        {/* Prices */}
        <div style={{ textAlign: 'right', minWidth: 100 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#F0F4FF' }}>
            {currentPrice ? `$${currentPrice.toFixed(2)}` : '—'}
          </p>
          {target ? <p style={{ fontSize: 11, color: '#8B96B0' }}>Target: ${target.toFixed(2)}</p> : null}
          {target && currentPrice ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: dist >= 0 ? '#22c55e' : '#f43f5e' }}>
              {dist >= 0 ? '▲' : '▼'} {Math.abs(dist).toFixed(1)}% to target
            </span>
          ) : null}
        </div>

        {/* Remove */}
        <button
          onClick={() => removeItem.mutate()}
          disabled={removeItem.isPending}
          style={{ fontSize: 12, color: '#4A5568', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
        >
          ✕
        </button>
      </div>
    </Card>
  )
}

export default function WatchlistPage() {
  const { data: watchlistData, isLoading } = useWatchlist()
  const watchlist = (watchlistData || []) as WatchlistItem[]
  const [showForm, setShowForm] = useState(false)
  const [ticker, setTicker] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const addItem = useMutation({
    mutationFn: () => watchlistApi.add({
      ticker: ticker.toUpperCase().trim(),
      target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      alert_above: alertPrice ? parseFloat(alertPrice) : undefined,
      notes: notes || undefined,
    }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      setTicker(''); setTargetPrice(''); setAlertPrice(''); setNotes('')
      setShowForm(false)
    },
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>Watchlist</h1>
          <p style={{ fontSize: 13, color: '#8B96B0' }}>Track stocks with price alerts and target prices</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            height: 36, padding: '0 16px', borderRadius: 8,
            background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Stock'}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Add to Watchlist</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <input placeholder="Ticker Symbol" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} style={inputStyle} />
            <input placeholder="Target Price" type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} style={inputStyle} />
            <input placeholder="Alert Price" type="number" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} style={inputStyle} />
          </div>
          <textarea
            placeholder="Notes..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%', borderRadius: 8, background: '#141C2B',
              border: '1px solid rgba(255,255,255,0.07)', color: '#F0F4FF',
              padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => addItem.mutate()}
            disabled={!ticker.trim() || addItem.isPending}
            style={{ marginTop: 10, height: 34, padding: '0 20px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            {addItem.isPending ? 'Adding...' : 'Add to Watchlist'}
          </button>
        </Card>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 80, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }} />)}
        </div>
      ) : !watchlist.length ? (
        <div style={{ textAlign: 'center', padding: '52px 0' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#F0F4FF', marginBottom: 8 }}>No stocks on watchlist</p>
          <p style={{ fontSize: 13, color: '#8B96B0' }}>Add stocks to track their prices and set alerts</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 11, color: '#4A5568', marginBottom: 12 }}>{watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} watched</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {watchlist.map((item) => <WatchlistCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
