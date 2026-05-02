'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendChip } from '@/components/ui/TrendChip'

interface ThesisCardProps {
  positionId: number
  ticker: string
  avgBuyPrice: number
  shares?: number
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
  shares,
  currentNotes,
  unrealizedPnlPct,
  riskScore,
}: ThesisCardProps) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(currentNotes || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const hasNote = !!notes.trim()

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
    },
  })

  const handleEdit = () => {
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleDone = () => {
    updatePosition.mutate(notes)
  }

  return (
    <div style={{
      background: '#0E1420',
      border: `1px solid ${editing ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: '#8B96B0',
        }}>
          {ticker.slice(0, 2)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F4FF' }}>{ticker}</span>
            {unrealizedPnlPct != null && <TrendChip value={unrealizedPnlPct} />}
            {!hasNote && !editing && (
              <span style={{ fontSize: 11, color: '#4A5568', fontStyle: 'italic' }}>no thesis yet</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#4A5568', marginTop: 2 }}>
            {shares != null ? `${shares} shares · ` : ''}avg ${avgBuyPrice?.toFixed(2)}{riskScore != null ? ` · risk ${riskScore}/100` : ''}
          </p>
        </div>

        <button
          onClick={editing ? handleDone : handleEdit}
          disabled={updatePosition.isPending}
          style={{
            padding: '5px 14px', borderRadius: 7,
            background: editing ? '#141C2B' : hasNote ? '#141C2B' : '#3b82f6',
            border: `1px solid ${editing || hasNote ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
            color: editing ? '#8B96B0' : hasNote ? '#8B96B0' : '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {updatePosition.isPending ? 'Saving...' : editing ? 'Done' : hasNote ? 'Edit' : 'Add note'}
        </button>
      </div>

      {/* Body */}
      {(hasNote || editing) && (
        <div style={{
          padding: '0 18px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 14,
        }}>
          {editing ? (
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's the thesis? Why did you buy, what would change your mind..."
              rows={4}
              style={{
                width: '100%', borderRadius: 9,
                background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
                color: '#F0F4FF', padding: '11px 14px',
                fontSize: 13, lineHeight: 1.75, outline: 'none', resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <p style={{ fontSize: 13, color: '#8B96B0', lineHeight: 1.8 }}>
              {notes}
            </p>
          )}
          {updatePosition.error && (
            <p style={{ fontSize: 11, color: '#f43f5e', marginTop: 6 }}>
              {updatePosition.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
