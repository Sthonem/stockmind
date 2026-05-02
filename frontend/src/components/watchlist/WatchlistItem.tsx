'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

import { marketApi, watchlistApi } from '@/lib/api'
import type { WatchlistItem } from '@/lib/types'

interface WatchlistItemProps {
  item: WatchlistItem
}

interface PriceResponse {
  price?: number
}

export function WatchlistItemCard({ item }: WatchlistItemProps) {
  const queryClient = useQueryClient()

  const { data: priceData } = useQuery<PriceResponse>({
    queryKey: ['price', item.ticker],
    queryFn: () => marketApi.price(item.ticker).then((response) => response.data),
    refetchInterval: 60_000,
  })

  const removeItem = useMutation({
    mutationFn: () => watchlistApi.remove(item.id).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const currentPrice = priceData?.price
  const atTarget = item.target_price && currentPrice
    ? Math.abs(currentPrice - item.target_price) / item.target_price <= 0.02
    : false
  const aboveAlert = item.alert_above && currentPrice ? currentPrice >= item.alert_above : false
  const belowAlert = item.alert_below && currentPrice ? currentPrice <= item.alert_below : false
  const hasAlert = atTarget || aboveAlert || belowAlert

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
      hasAlert ? 'border-yellow-500/40' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${item.ticker}`}
            className="text-white font-bold text-lg hover:text-blue-400 transition-colors"
          >
            {item.ticker}
          </Link>
          {hasAlert && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30">
              Alert
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentPrice && (
            <span className="text-white font-semibold">${currentPrice.toFixed(2)}</span>
          )}
          <button
            onClick={() => removeItem.mutate()}
            disabled={removeItem.isPending}
            className="text-gray-600 hover:text-red-400 transition-colors text-xs disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {item.notes && (
        <p className="text-gray-500 text-xs mb-3 italic">{item.notes}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {item.target_price && (
          <div className={`rounded-lg p-2 ${atTarget ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-gray-800'}`}>
            <p className={atTarget ? 'text-yellow-400 font-medium' : 'text-gray-500'}>Target</p>
            <p className={atTarget ? 'text-yellow-300 font-semibold' : 'text-gray-300'}>
              ${item.target_price.toFixed(2)}
            </p>
            {currentPrice && item.target_price && (
              <p className="text-gray-600">
                {(((currentPrice - item.target_price) / item.target_price) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}
        {item.alert_above && (
          <div className={`rounded-lg p-2 ${aboveAlert ? 'bg-red-500/20 border border-red-500/30' : 'bg-gray-800'}`}>
            <p className={aboveAlert ? 'text-red-400 font-medium' : 'text-gray-500'}>Alert above</p>
            <p className={aboveAlert ? 'text-red-300 font-semibold' : 'text-gray-300'}>
              ${item.alert_above.toFixed(2)}
            </p>
          </div>
        )}
        {item.alert_below && (
          <div className={`rounded-lg p-2 ${belowAlert ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800'}`}>
            <p className={belowAlert ? 'text-green-400 font-medium' : 'text-gray-500'}>Alert below</p>
            <p className={belowAlert ? 'text-green-300 font-semibold' : 'text-gray-300'}>
              ${item.alert_below.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
