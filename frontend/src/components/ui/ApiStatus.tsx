'use client'

import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

export function ApiStatus() {
  const { isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    refetchInterval: 30000,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse" />
        Connecting...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Backend offline
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Connected
    </div>
  )
}
