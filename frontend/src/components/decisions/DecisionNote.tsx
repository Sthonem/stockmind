'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DecisionNoteProps {
  positionId: number
  ticker: string
  avgBuyPrice: number
  notes?: string
  currentPnlPct?: number
  riskScore?: number
}

export function DecisionNote({
  ticker,
  avgBuyPrice,
  notes,
  currentPnlPct,
  riskScore,
}: DecisionNoteProps) {
  const [expanded, setExpanded] = useState(false)

  const pnlColor = currentPnlPct == null ? 'text-gray-400'
    : currentPnlPct >= 0 ? 'text-green-400' : 'text-red-400'

  const riskColor = riskScore == null ? 'text-gray-400'
    : riskScore >= 70 ? 'text-red-400'
      : riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div
        className="flex items-start justify-between gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-white font-bold text-base">{ticker}</span>
            <span className="text-gray-500 text-xs ml-2">avg ${avgBuyPrice?.toFixed(2)}</span>
          </div>
          <div className="flex gap-3 text-sm">
            {currentPnlPct != null && (
              <span className={`font-medium ${pnlColor}`}>
                {currentPnlPct >= 0 ? '+' : ''}{currentPnlPct?.toFixed(2)}%
              </span>
            )}
            {riskScore != null && (
              <span className={`text-xs ${riskColor}`}>
                Risk: {riskScore?.toFixed(0)}/100
              </span>
            )}
          </div>
        </div>
        <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          {notes ? (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                Investment thesis
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">{notes}</p>
            </div>
          ) : (
            <p className="text-gray-600 text-xs italic">
              No investment thesis recorded. Edit this position to add one.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <Link
              href={`/stock/${ticker}`}
              className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              View analysis →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
