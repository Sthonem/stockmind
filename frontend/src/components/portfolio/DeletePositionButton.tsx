'use client'

import { useState } from 'react'
import { useDeletePosition } from '@/lib/hooks'

export function DeletePositionButton({
  positionId,
  ticker,
  portfolioId,
}: {
  positionId: number
  ticker: string
  portfolioId: number
}) {
  const [confirming, setConfirming] = useState(false)
  const deletePosition = useDeletePosition(portfolioId)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-xs">Remove {ticker}?</span>
        <button
          onClick={() => deletePosition.mutate(positionId)}
          disabled={deletePosition.isPending}
          className="text-red-400 hover:text-red-300 text-xs font-medium"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-gray-600 hover:text-red-400 transition-colors text-xs"
    >
      Remove
    </button>
  )
}
