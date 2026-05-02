'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

interface ThesisCardProps {
  positionId: number
  ticker: string
  avgBuyPrice: number
  currentNotes?: string
  unrealizedPnlPct?: number
  riskScore?: number
  riskLevel?: string
}

interface UpdatePositionResponse {
  notes?: string
}

export function ThesisCard({
  positionId,
  ticker,
  avgBuyPrice,
  currentNotes,
  unrealizedPnlPct,
  riskScore,
  riskLevel,
}: ThesisCardProps) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(currentNotes || '')
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()

  const updatePosition = useMutation<UpdatePositionResponse, Error, string>({
    mutationFn: (nextNotes: string) =>
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/portfolio/positions/${positionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: nextNotes }),
        }
      ).then((response) => {
        if (!response.ok) throw new Error('Failed to save thesis')
        return response.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const pnlColor = unrealizedPnlPct == null ? 'text-gray-400'
    : unrealizedPnlPct >= 0 ? 'text-green-400' : 'text-red-400'

  const riskColor = riskLevel === 'high' ? 'text-red-400'
    : riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/stock/${ticker}`}
              className="text-white font-bold text-lg hover:text-blue-400 transition-colors"
            >
              {ticker}
            </Link>
            <span className="text-gray-500 text-sm">avg ${avgBuyPrice?.toFixed(2)}</span>
          </div>
          <div className="flex gap-4 text-sm">
            {unrealizedPnlPct != null && (
              <span className={`font-medium ${pnlColor}`}>
                {unrealizedPnlPct >= 0 ? '+' : ''}{unrealizedPnlPct?.toFixed(2)}% P&L
              </span>
            )}
            {riskScore != null && (
              <span className={`text-xs ${riskColor}`}>
                Risk {riskScore?.toFixed(0)}/100
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-gray-500 hover:text-blue-400 text-xs transition-colors"
        >
          {editing ? 'Cancel' : 'Edit thesis'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Why did you buy this? What's your thesis? What would make you sell?"
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => updatePosition.mutate(notes)}
              disabled={updatePosition.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {updatePosition.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setNotes(currentNotes || '')
              }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          {updatePosition.error && (
            <p className="text-red-400 text-xs">{updatePosition.error.message}</p>
          )}
        </div>
      ) : (
        <div>
          {notes ? (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Investment thesis</p>
              <p className="text-gray-300 text-sm leading-relaxed">{notes}</p>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-700 rounded-lg p-3 text-gray-600 text-xs text-center transition-colors hover:border-gray-600 hover:text-gray-400"
            >
              + Add investment thesis
            </button>
          )}
          {saved && (
            <p className="text-green-400 text-xs mt-2">Thesis saved</p>
          )}
        </div>
      )}
    </div>
  )
}
