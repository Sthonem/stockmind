'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { watchlistApi } from '@/lib/api'

interface AddWatchlistPayload {
  ticker: string
  notes?: string
  target_price?: number
  alert_above?: number
  alert_below?: number
}

interface ApiErrorBody {
  detail?: string
}

export function AddWatchlistForm({ onSuccess }: { onSuccess?: () => void }) {
  const [ticker, setTicker] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [alertAbove, setAlertAbove] = useState('')
  const [alertBelow, setAlertBelow] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const queryClient = useQueryClient()
  const addItem = useMutation({
    mutationFn: (data: AddWatchlistPayload) => watchlistApi.add(data).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      setTicker('')
      setTargetPrice('')
      setAlertAbove('')
      setAlertBelow('')
      setNotes('')
      onSuccess?.()
    },
    onError: (err: AxiosError<ApiErrorBody>) => {
      setError(err.response?.data?.detail || 'Failed to add to watchlist')
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!ticker.trim()) {
      setError('Ticker is required')
      return
    }
    setError('')
    addItem.mutate({
      ticker: ticker.toUpperCase().trim(),
      target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      alert_above: alertAbove ? parseFloat(alertAbove) : undefined,
      alert_below: alertBelow ? parseFloat(alertBelow) : undefined,
      notes: notes || undefined,
    })
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Ticker *</label>
          <input
            type="text"
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            placeholder="AAPL"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Target Price</label>
          <input
            type="number"
            value={targetPrice}
            onChange={(event) => setTargetPrice(event.target.value)}
            placeholder="180.00"
            step="any"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Alert Above</label>
          <input
            type="number"
            value={alertAbove}
            onChange={(event) => setAlertAbove(event.target.value)}
            placeholder="200.00"
            step="any"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Alert Below</label>
          <input
            type="number"
            value={alertBelow}
            onChange={(event) => setAlertBelow(event.target.value)}
            placeholder="160.00"
            step="any"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Why are you watching this?"
          className={inputClass}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={addItem.isPending}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {addItem.isPending ? 'Adding...' : 'Add to Watchlist'}
      </button>
    </form>
  )
}
