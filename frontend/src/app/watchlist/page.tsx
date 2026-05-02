'use client'

import { useState } from 'react'

import { AddWatchlistForm } from '@/components/watchlist/AddWatchlistForm'
import { WatchlistItemCard } from '@/components/watchlist/WatchlistItem'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useWatchlist } from '@/lib/hooks'
import type { WatchlistItem } from '@/lib/types'

export default function WatchlistPage() {
  const { data: watchlistData, isLoading } = useWatchlist()
  const watchlist = (watchlistData || []) as WatchlistItem[]
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track stocks with price alerts and target prices
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Stock'}
        </button>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-gray-400 mb-4">Add to Watchlist</h2>
          <AddWatchlistForm onSuccess={() => setShowForm(false)} />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !watchlist.length ? (
        <EmptyState
          title="No stocks on watchlist"
          description="Add stocks to track their prices and set alerts"
          action={{ label: 'Add your first stock', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-gray-600 text-xs">
            {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} watched
          </p>
          {watchlist.map((item) => (
            <WatchlistItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
