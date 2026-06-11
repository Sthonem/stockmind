'use client'

import { useState } from 'react'
import { useAddPosition } from '@/lib/hooks'

interface AddPositionFormProps {
  portfolioId: number
  onSuccess?: () => void
  onCancel?: () => void
}

type ApiError = {
  response?: {
    data?: {
      detail?: string
    }
  }
}

export function AddPositionForm({ portfolioId, onSuccess, onCancel }: AddPositionFormProps) {
  const [ticker, setTicker] = useState('')
  const [shares, setShares] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const addPosition = useAddPosition(portfolioId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!ticker.trim()) return setError('Ticker is required')
    if (!shares || parseFloat(shares) <= 0) return setError('Shares must be greater than 0')
    if (!avgBuyPrice || parseFloat(avgBuyPrice) <= 0) return setError('Buy price must be greater than 0')

    try {
      await addPosition.mutateAsync({
        ticker: ticker.toUpperCase().trim(),
        shares: parseFloat(shares),
        avg_buy_price: parseFloat(avgBuyPrice),
        notes: notes.trim() || undefined,
      })
      setTicker('')
      setShares('')
      setAvgBuyPrice('')
      setNotes('')
      onSuccess?.()
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.detail || 'Failed to add position')
    }
  }

  const inputStyle = {
    width: '100%',
    height: 38,
    borderRadius: 8,
    background: '#141C2B',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#F0F4FF',
    padding: '0 12px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    color: '#8B96B0',
    marginBottom: 6,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Ticker Symbol</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            maxLength={10}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="10"
            min="0.001"
            step="any"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Avg Buy Price ($)</label>
          <input
            type="number"
            value={avgBuyPrice}
            onChange={(e) => setAvgBuyPrice(e.target.value)}
            placeholder="175.50"
            min="0.01"
            step="any"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why did you buy this?"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{
          fontSize: 13, color: '#f43f5e',
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={addPosition.isPending}
          style={{
            height: 36, padding: '0 18px', borderRadius: 8,
            background: addPosition.isPending ? '#141C2B' : '#3b82f6',
            color: addPosition.isPending ? '#4A5568' : '#fff',
            fontSize: 13, fontWeight: 600, border: 'none',
            cursor: addPosition.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {addPosition.isPending ? 'Adding…' : 'Add Position'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 36, padding: '0 18px', borderRadius: 8,
              background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
              color: '#8B96B0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
