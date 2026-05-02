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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ticker Symbol</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            maxLength={10}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="10"
            min="0.001"
            step="any"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Avg Buy Price ($)</label>
          <input
            type="number"
            value={avgBuyPrice}
            onChange={(e) => setAvgBuyPrice(e.target.value)}
            placeholder="175.50"
            min="0.01"
            step="any"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why did you buy this?"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={addPosition.isPending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {addPosition.isPending ? 'Adding...' : 'Add Position'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
