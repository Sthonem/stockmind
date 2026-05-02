'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioApi } from '@/lib/api'

export function CreatePortfolioForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState('')
  const qc = useQueryClient()

  const createPortfolio = useMutation({
    mutationFn: (portfolioName: string) => portfolioApi.create(portfolioName).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      setName('')
      onSuccess?.()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) createPortfolio.mutate(name.trim())
      }}
      className="flex gap-3"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Portfolio name"
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
      />
      <button
        type="submit"
        disabled={createPortfolio.isPending || !name.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {createPortfolio.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
